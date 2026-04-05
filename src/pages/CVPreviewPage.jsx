import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Image as ImageIcon, Award, Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../contexts/AuthContext';
import * as htmlToImage from 'html-to-image';

const WhatsAppIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 448 512" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.7-30.6-38.2-3.2-5.6-.3-8.6 2.4-11.3 2.5-2.4 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.3 5.7 23.6 9.2 31.7 11.7 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
    </svg>
);

const CNHIcon = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <line x1="15" y1="8" x2="19" y2="8" />
        <line x1="15" y1="12" x2="19" y2="12" />
        <line x1="7" y1="16" x2="17" y2="16" />
    </svg>
);

const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return null;
    const hoje = new Date(); const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}

const parseJsonItem = (item, type = 'generic') => {
    if (!item) return null;
    if (typeof item === 'object') return item;
    if (typeof item === 'string' && item.trim().startsWith('{')) {
        try { return JSON.parse(item); } catch (e) { }
    }
    if (type === 'curso') return { nome: item, instituicao: '', status: 'completo' };
    if (type === 'experiencia') return { empresa: item, cargo: 'Não informado', atual: false, atribuicoes: '' };
    if (type === 'formacao') return { instituicao: item, curso: 'Não informado', status: 'completo' };
    return item;
};

export default function CVPreviewPage() {
    const { userId: paramId } = useParams();
    const { user, role, loading: authLoading } = useAuth();
    const [cvData, setCvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const navigate = useNavigate();
    const componentRef = useRef();

    const a4WidthPx = 794; // Largura exata A4 em 96dpi
    const a4HeightPx = 1123; // Altura exata A4 em 96dpi

    useEffect(() => {
        const calculateScale = () => {
            const availableWidth = window.innerWidth - 20; // Margem mínima de 10px de cada lado
            
            if (availableWidth < a4WidthPx) {
                setScale(availableWidth / a4WidthPx);
            } else {
                setScale(1);
            }
        };
        calculateScale();
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);



    useEffect(() => {
        if (!authLoading) fetchData();
    }, [paramId, user, authLoading]);

    const fetchData = async () => {
        const targetId = paramId || user?.id;
        if (!targetId) return;
        try {
            // Busca dados do currículo e status de pagamento (join)
            const { data, error } = await supabase
                .from('curriculos')
                .select('*, user_roles(pago)')
                .eq('user_id', targetId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            
            // Ajusta o objeto para incluir o status 'pago' facilitado
            const processedData = data ? {
                ...data,
                pago: Array.isArray(data.user_roles) 
                    ? data.user_roles[0]?.pago 
                    : (data.user_roles?.pago || false)
            } : null;

            setCvData(processedData);

            // LOG DE VISUALIZAÇÃO: Registra se o visualizador for empresa ou admin
            if ((role === 'empresa' || role === 'admin') && targetId !== user?.id) {
                registraVisualizacao(targetId);
            }
        } catch (err) {
            console.error('Erro ao carregar CV:', err);
        } finally {
            setLoading(false);
        }
    };

    const registraVisualizacao = async (candidatoId) => {
        try {
            // Tenta buscar o id da empresa para fins de relatório detalhado
            const { data: empresa } = await supabase
                .from('empresas')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            // Insere a visualização com o viewer_user_id (garante o log mesmo sem perfil completo)
            await supabase
                .from('candidate_views')
                .insert({
                    empresa_id: empresa?.id || null,
                    candidato_id: candidatoId,
                    viewer_user_id: user.id
                });
        } catch (e) {
            console.error('Erro ao registrar visualização:', e);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: cvData ? `Currículo_${cvData.nome?.replace(/\s+/g, '_')}` : 'Currículo',
    });

    const handleWhatsApp = () => {
        if (!cvData?.telefone) return alert('Telefone não informado.');
        let cleanNumber = cvData.telefone.replace(/\D/g, '');
        if ((cleanNumber.length === 10 || cleanNumber.length === 11) && !cleanNumber.startsWith('55')) cleanNumber = '55' + cleanNumber;
        const msg = `Olá ${cvData.nome.split(' ')[0]}, vi seu currículo na plataforma Norte Empregos e gostaria de conversar.`;
        window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleDownloadPNG = async () => {
        if (!componentRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(componentRef.current, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `Currículo_${cvData?.nome?.replace(/\s+/g, '_') || 'Imagem'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) { console.error('Erro ao gerar PNG:', error); }
    };

    const s = {
        h2: { fontSize: '13pt', color: '#111', textTransform: 'uppercase', borderBottom: '2px solid #7c3aed', paddingBottom: '5px', marginBottom: '12px' },
        muted: { color: '#4b5563', fontSize: '9.5pt', fontWeight: 500 },
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: 'var(--norte-green)', fontWeight: 800 }}>CARREGANDO SEU CURRICULO PROFISSIONAL...</div>;

    const PREMIUM_COLORS = {
        darkGreen: '#005b32',
        lightGreen: '#f0fdf4',
        accentGreen: '#dcfce7',
        orange: '#f97316',
        text: '#1a202c',
        muted: '#4a5568'
    };

    const PremiumCVLayout = () => (
        <div style={{ fontFamily: '"Inter", "Arial", sans-serif', color: PREMIUM_COLORS.text }}>
            {/* 🔝 1. CABEÇALHO (TOP FIXO) */}
            <div style={{ 
                background: `linear-gradient(135deg, ${PREMIUM_COLORS.lightGreen} 0%, #ffffff 100%)`,
                padding: '40px 50px',
                borderBottom: `1px solid ${PREMIUM_COLORS.accentGreen}`,
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Logo e Nome da Plataforma */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
                    <div style={{ width: '40px', height: '40px', background: PREMIUM_COLORS.darkGreen, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>N</div>
                    <span style={{ fontWeight: 800, color: PREMIUM_COLORS.darkGreen, fontSize: '1.1rem', letterSpacing: '0.5px' }}>NORTE VAGAS</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
                    {cvData.foto_url && (
                        <div style={{ position: 'relative' }}>
                            <img src={cvData.foto_url} alt="Foto" style={{ width: '140px', height: '140px', borderRadius: '50%', objectFit: 'cover', border: `4px solid #fff`, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                        </div>
                    )}
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: '28pt', fontWeight: 900, margin: '0 0 5px 0', color: PREMIUM_COLORS.darkGreen, textTransform: 'uppercase', letterSpacing: '-1px' }}>{cvData.nome}</h1>
                        
                        {/* Exibição do Cargo ou Perfil DISC */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '15px' }}>
                            {cvData.cargo_desejado && <p style={{ fontSize: '16pt', fontWeight: 600, color: PREMIUM_COLORS.orange, margin: 0 }}>{cvData.cargo_desejado}</p>}
                            {cvData.perfil_disc && (
                                <p style={{ fontSize: '13pt', fontWeight: 700, color: PREMIUM_COLORS.darkGreen, margin: 0, opacity: 0.8 }}>
                                    🎯 Perfil {(() => {
                                        try {
                                            const disc = typeof cvData.perfil_disc === 'string' ? JSON.parse(cvData.perfil_disc) : cvData.perfil_disc;
                                            const sorted = Object.entries(disc).sort((a,b) => b[1] - a[1]);
                                            return sorted[0][0];
                                        } catch(e) { return cvData.perfil_disc; }
                                    })()} — Predominante
                                </p>
                            )}
                        </div>
                        
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: PREMIUM_COLORS.accentGreen, padding: '6px 16px', borderRadius: '20px', color: PREMIUM_COLORS.darkGreen, fontWeight: 800, fontSize: '0.9rem' }}>
                            <CheckCircle size={18} fill={PREMIUM_COLORS.darkGreen} color="#fff" /> Candidato Verificado
                        </div>
                    </div>
                </div>

                {/* Grafismo sutil no fundo */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: PREMIUM_COLORS.accentGreen, borderRadius: '50%', opacity: 0.3, zIndex: 0 }} />
            </div>

            {/* 📞 2. LINHA DE CONTATO (IMPORTANTE) */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '20px', 
                padding: '15px 50px', 
                background: '#fff',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '10.5pt',
                color: PREMIUM_COLORS.muted,
                fontWeight: 600,
                flexWrap: 'wrap'
            }}>
                {cvData.telefone && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color={PREMIUM_COLORS.darkGreen} /> {cvData.telefone}</div>}
                <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />
                {cvData.email && <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color={PREMIUM_COLORS.darkGreen} /> {cvData.email}</div>}
                <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color={PREMIUM_COLORS.darkGreen} /> 
                    {cvData.bairro}{cvData.cidade ? ` - ${cvData.cidade}` : ''}
                </div>
                {cvData.genero && (
                    <>
                        <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>👤 {cvData.genero}</div>
                    </>
                )}
            </div>

            {/* 📄 3. CORPO DO CURRÍCULO (ÚNICA COLUNA) */}
            <div style={{ padding: '40px 50px' }}>
                
                {/* 🧠 RESUMO PROFISSIONAL */}
                {cvData.resumo && (
                    <div style={{ marginBottom: '35px' }}>
                        <h3 style={{ color: PREMIUM_COLORS.orange, fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', borderBottom: `2px solid ${PREMIUM_COLORS.accentGreen}`, paddingBottom: '4px', display: 'inline-block' }}>🧠 Resumo Profissional</h3>
                        <p style={{ fontSize: '11pt', lineHeight: 1.6, color: PREMIUM_COLORS.text, textAlign: 'justify' }}>{cvData.resumo}</p>
                    </div>
                )}

                {/* 💼 EXPERIÊNCIA */}
                {cvData.experiencias?.length > 0 && (
                    <div style={{ marginBottom: '35px' }}>
                        <h3 style={{ color: PREMIUM_COLORS.orange, fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '18px', borderBottom: `2px solid ${PREMIUM_COLORS.accentGreen}`, paddingBottom: '4px', display: 'inline-block' }}>💼 Experiência</h3>
                        {cvData.experiencias.map((exp, i) => (
                            <div key={i} style={{ marginBottom: '22px', position: 'relative', paddingLeft: '20px', borderLeft: `2px solid ${PREMIUM_COLORS.accentGreen}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                    <h4 style={{ fontSize: '12.5pt', fontWeight: 800, color: PREMIUM_COLORS.darkGreen, margin: 0 }}>{exp.empresa}</h4>
                                    <span style={{ fontSize: '9pt', fontWeight: 700, color: PREMIUM_COLORS.muted }}>
                                        {exp.mes_inicio}/{exp.ano_inicio} — {exp.atual ? 'Atualmente' : `${exp.mes_fim}/${exp.ano_fim}`}
                                    </span>
                                </div>
                                <div style={{ fontSize: '11pt', fontWeight: 700, color: PREMIUM_COLORS.text, marginBottom: '8px' }}>{exp.cargo}</div>
                                {exp.atribuicoes && (
                                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '10.5pt', color: PREMIUM_COLORS.muted, lineHeight: 1.5 }}>
                                        {exp.atribuicoes.split('\n').map((line, idx) => (
                                            <li key={idx} style={{ marginBottom: '4px' }}>{line.replace(/^[•\-\*]\s*/, '')}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 🎓 FORMAÇÃO */}
                {cvData.formacoes?.length > 0 && (
                    <div style={{ marginBottom: '35px' }}>
                        <h3 style={{ color: PREMIUM_COLORS.orange, fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', borderBottom: `2px solid ${PREMIUM_COLORS.accentGreen}`, paddingBottom: '4px', display: 'inline-block' }}>🎓 Formação</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '15px' }}>
                            {cvData.formacoes.map((f, i) => (
                                <div key={i}>
                                    <div style={{ fontWeight: 800, fontSize: '11.5pt', color: PREMIUM_COLORS.text }}>{f.curso}</div>
                                    <div style={{ fontSize: '10pt', color: PREMIUM_COLORS.muted }}>{f.instituicao} • {f.status === 'completo' ? `Concluído em ${f.ano_conclusao}` : 'Em andamento'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 📚 CURSOS */}
                {cvData.cursos_prof?.length > 0 && (
                    <div style={{ marginBottom: '35px' }}>
                        <h3 style={{ color: PREMIUM_COLORS.orange, fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', borderBottom: `2px solid ${PREMIUM_COLORS.accentGreen}`, paddingBottom: '4px', display: 'inline-block' }}>📚 Cursos</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {cvData.cursos_prof.map((raw, i) => {
                                const c = parseJsonItem(raw, 'curso');
                                return (
                                    <div key={i} style={{ padding: '8px 15px', background: PREMIUM_COLORS.lightGreen, border: `1px solid ${PREMIUM_COLORS.accentGreen}`, borderRadius: '6px', fontSize: '10pt' }}>
                                        <div style={{ fontWeight: 700, color: PREMIUM_COLORS.darkGreen }}>{c.nome}</div>
                                        <div style={{ fontSize: '8.5pt', color: PREMIUM_COLORS.muted }}>{c.instituicao}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 🧠 HABILIDADES */}
                {cvData.habilidades?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: PREMIUM_COLORS.orange, fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', borderBottom: `2px solid ${PREMIUM_COLORS.accentGreen}`, paddingBottom: '4px', display: 'inline-block' }}>🧠 Habilidades</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            {cvData.habilidades.map(h => (
                                <div key={h} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11pt', fontWeight: 600, color: PREMIUM_COLORS.text }}>
                                    <div style={{ width: '6px', height: '6px', background: PREMIUM_COLORS.orange, borderRadius: '50%' }} /> {h}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer fixo para Premium */}
            <div style={{ padding: '20px 50px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '8.5pt', color: '#94a3b8', background: '#fcfcfc' }}>
                <span style={{ fontWeight: 700 }}>Norte Vagas</span>
            </div>
        </div>
    );

    const StandardCVLayout = () => (
        <>
            {/* Header */}
            <div style={{ borderBottom: '2.5px solid #1a202c', paddingBottom: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
                {cvData.foto_url && (
                    <img src={cvData.foto_url} alt="Foto" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--norte-green)', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1 }}>
                    <h1 style={{ color: '#1a202c', margin: '0 0 12px 0', fontSize: '22pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {cvData.nome}
                        {cvData.pago && (
                            <Award size={24} color="#7c3aed" fill="#7c3aed" title="Candidato Verificado" />
                        )}
                    </h1>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 30px', color: '#4a5568', fontSize: '10pt', fontWeight: 500, marginTop: '10px' }}>
                        {cvData.data_nascimento && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', textAlign: 'center' }}>🎂</span> 
                                <span>{calcularIdade(cvData.data_nascimento)} anos</span>
                            </div>
                        )}
                        {cvData.telefone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', textAlign: 'center' }}>📱</span> 
                                <span>{cvData.telefone}</span>
                            </div>
                        )}
                        {cvData.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                                <span style={{ width: '18px', textAlign: 'center' }}>✉</span> 
                                <span>{cvData.email}</span>
                            </div>
                        )}
                        {cvData.bairro && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: 'span 2' }}>
                                <span style={{ width: '18px', textAlign: 'center' }}>📍</span> 
                                <span>{cvData.bairro} — {cvData.cidade || 'Santarém'}</span>
                            </div>
                        )}
                        {cvData.genero && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', textAlign: 'center' }}>👤</span> 
                                <span>Gênero: {cvData.genero}</span>
                            </div>
                        )}
                        {cvData.cnh?.possui && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                                    <CNHIcon size={16} />
                                </span> 
                                <span>CNH Categoria {cvData.cnh.categorias?.join('/') || 'Não inf.'}</span>
                            </div>
                        )}
                        {cvData.possui_transporte && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '18px', textAlign: 'center' }}>🚗</span> 
                                <span>Possui Veículo Próprio</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Perfil DISC (Sublime) */}
            {cvData.perfil_disc && (
                <div style={{ marginBottom: '20px', padding: '10px 15px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--norte-green)' }}>
                    <span style={{ fontSize: '9pt', fontWeight: 800, color: 'var(--norte-dark-green)', display: 'block', marginBottom: '2px' }}>PERFIL COMPORTAMENTAL (DISC)</span>
                    {(() => {
                        try {
                            const disc = typeof cvData.perfil_disc === 'string' ? JSON.parse(cvData.perfil_disc) : cvData.perfil_disc;
                            const sorted = Object.entries(disc).sort((a,b) => b[1] - a[1]);
                            return <span style={{ fontSize: '11pt', fontWeight: 700, color: '#1a202c' }}>{sorted[0][0]} — Predominante</span>
                        } catch(e) { return <span style={{ fontSize: '11pt', fontWeight: 700 }}>{cvData.perfil_disc}</span> }
                    })()}
                </div>
            )}

            {/* Competências (Logo abaixo do DISC) */}
            {cvData.habilidades?.length > 0 && (
                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {cvData.habilidades.map(h => (
                            <span key={h} style={{ background: '#fff', color: '#2d3748', padding: '6px 14px', borderRadius: '4px', fontSize: '10.5pt', fontWeight: 700, border: '1.2px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>{h}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Resumo */}
            {cvData.resumo && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '13pt', color: '#1a202c', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 800 }}>Resumo Profissional</h2>
                    <p style={{ fontSize: '10.5pt', lineHeight: 1.55, color: '#2d3748', textAlign: 'justify' }}>{cvData.resumo}</p>
                </div>
            )}

            {/* Escolaridade */}
            {cvData.ensino_medio?.status && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '13pt', color: '#1a202c', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 800 }}>Escolaridade</h2>
                    <div style={{ fontSize: '11pt', color: '#2d3748' }}>
                        {cvData.ensino_medio.status === 'cursando' && <span>Cursando {cvData.ensino_medio.ano_cursando}º Ano do Ensino Médio</span>}
                        {cvData.ensino_medio.status === 'completo' && <span>Ensino Médio Completo — Concluído em {cvData.ensino_medio.ano_conclusao}</span>}
                        {cvData.ensino_medio.status === 'incompleto' && <span>Ensino Médio Incompleto {cvData.ensino_medio.fundamental_completo ? '(Ensino Fundamental Completo)' : ''}</span>}
                    </div>
                </div>
            )}

            {/* Formação Superior */}
            {cvData.formacoes?.length > 0 && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '13pt', color: '#1a202c', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 800 }}>Formação Acadêmica</h2>
                    {cvData.formacoes.map((f, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '11pt', color: '#1a202c' }}>
                                <span>{f.curso}</span>
                                <span style={s.muted}>{f.status === 'completo' ? `Concluído em ${f.ano_conclusao}` : (f.status === 'cursando' ? 'Cursando' : 'Incompleto')}</span>
                            </div>
                            <div style={{ fontSize: '10.5pt', color: '#4a5568', fontStyle: 'italic' }}>{f.instituicao}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Experiência */}
            {cvData.experiencias?.length > 0 && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '13pt', color: '#1a202c', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 800 }}>Experiência Profissional</h2>
                    {cvData.experiencias.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '11.5pt', color: '#1a202c' }}>
                                <span>{exp.cargo}</span>
                                <span style={s.muted}>
                                    {(() => {
                                        const formatarData = (mes, ano) => {
                                            const m = parseInt(mes);
                                            if (m >= 1 && m <= 12 && ano) return `${MESES_ABREV[m - 1]}/${ano}`;
                                            return ano || '';
                                        };

                                        const inicio = formatarData(exp.mes_inicio, exp.ano_inicio);
                                        const fim = exp.atual ? 'Atualmente' : formatarData(exp.mes_fim, exp.ano_fim);
                                        
                                        return inicio && fim ? `${inicio} — ${fim}` : (inicio || fim || '');
                                    })()}
                                </span>
                            </div>
                            <div style={{ fontSize: '11pt', color: '#4a5568', fontWeight: 700, marginBottom: '5px' }}>{exp.empresa}</div>
                            {exp.atribuicoes && (
                                <div style={{ fontSize: '10pt', color: '#2d3748', lineHeight: 1.45, paddingLeft: '10px', borderLeft: '2px solid #edf2f7' }}>
                                    <strong>Principais atividades:</strong> {exp.atribuicoes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Cursos */}
            <div style={{ width: '100%' }}>
                {cvData.cursos_prof?.length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                        <h2 style={{ fontSize: '13pt', color: '#1a202c', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px', marginBottom: '10px', fontWeight: 800 }}>Cursos</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {cvData.cursos_prof.map((raw, i) => {
                                const c = parseJsonItem(raw, 'curso');
                                return (
                                    <div key={i} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '11.5pt', fontWeight: 700, color: '#1a202c' }}>{c.nome}</div>
                                            <div style={{ fontSize: '9pt', fontWeight: 800, color: 'var(--norte-green)', textTransform: 'uppercase' }}>
                                                {c.status === 'cursando' ? 'Cursando' : (c.status === 'completo' ? 'Concluído' : 'Incompleto')}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '10pt', color: '#64748b', fontStyle: 'italic' }}>{c.instituicao}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div style={{ minHeight: '100vh', padding: scale < 1 ? '10px 0' : '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f1f5f9', position: 'relative' }}>
            <div className="cv-actions-bar" style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', gap: '10px', zIndex: 100 }}>
                <button onClick={() => navigate(-1)} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>
                    <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> VOLTAR
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <style>{`
                        .action-btn { transition: all 0.2s ease; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 800; border: none; border-radius: 8px; color: #fff; padding: 10px 20px; text-transform: uppercase; font-size: 0.8rem; }
                        .action-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
                        .btn-img { background: #F59E0B; }
                        .btn-pdf { background: #7C3AED; }
                        .btn-wpp { background: #25D366; }
                    `}</style>
                    <button onClick={handleDownloadPNG} className="action-btn btn-img"><ImageIcon size={18} /> IMAGEM</button>
                    <button onClick={handlePrint} className="action-btn btn-pdf"><Printer size={18} /> PDF</button>
                    {cvData?.telefone && <button onClick={handleWhatsApp} className="action-btn btn-wpp"><WhatsAppIcon size={18} /> WHATSAPP</button>}
                </div>
            </div>

            {!cvData ? (
                <div className="glass-panel" style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
                    <h3 style={{ color: '#ef4444' }}>Nenhum currículo encontrado.</h3>
                </div>
            ) : (
                <div className="cv-preview-wrapper" style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'center',
                    padding: scale < 1 ? '0' : '20px 0',
                    height: scale < 1 ? `${(a4HeightPx * scale) + 60}px` : 'auto',
                    overflow: 'visible',
                    boxSizing: 'border-box'
                }}>
                    <div 
                        className="cv-container" 
                        ref={componentRef} 
                        style={{ 
                            background: '#fff', 
                            color: '#333', 
                            width: `${a4WidthPx}px`, 
                            minHeight: `${a4HeightPx}px`, 
                            padding: cvData.pago ? '0' : '60px 50px', 
                            boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)', 
                            boxSizing: 'border-box', 
                            transform: `scale(${scale})`, 
                            transformOrigin: 'top center', 
                            fontFamily: 'Arial, sans-serif',
                            position: 'relative',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0,
                            overflow: 'hidden'
                        }}
                    >
                        {cvData.pago ? <PremiumCVLayout /> : <StandardCVLayout />}
                    </div>
                </div>
            )}
            <style>{`
                @media print {
                    .cv-actions-bar { display: none !important; }
                    body { background: #fff !important; padding: 0 !important; }
                    .cv-preview-wrapper { padding: 0 !important; margin: 0 !important; }
                    .cv-container { transform: none !important; box-shadow: none !important; border: none !important; margin: 0 !important; width: 210mm !important; }
                }
            `}</style>
        </div>
    );
}
