import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Image as ImageIcon } from 'lucide-react';
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
    const [cvData, setCvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const navigate = useNavigate();
    const componentRef = useRef();

    useEffect(() => {
        const calculateScale = () => {
            const a4WidthPx = 794; // 210mm em 96dpi
            const padding = 20;
            const availableWidth = window.innerWidth - padding;
            
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

    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading) fetchData();
    }, [paramId, user, authLoading]);

    const fetchData = async () => {
        const targetId = paramId || user?.id;
        if (!targetId) return;
        try {
            const { data, error } = await supabase.from('curriculos').select('*').eq('user_id', targetId).single();
            if (error && error.code !== 'PGRST116') throw error;
            setCvData(data);
        } catch (err) {
            console.error('Erro ao carregar CV:', err);
        } finally {
            setLoading(false);
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

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: 'var(--norte-green)', fontWeight: 800 }}>CARREGANDO SEU CURRICULO PROFISSIONAL...</div>;

    const s = {
        h2: { fontSize: '13pt', color: '#111', textTransform: 'uppercase', borderBottom: '2px solid #7c3aed', paddingBottom: '5px', marginBottom: '12px' },
        muted: { color: '#4b5563', fontSize: '9.5pt', fontWeight: 500 },
    };

    return (
        <div style={{ minHeight: '100vh', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#e2e8f0', backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            <div className="cv-actions-bar" style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', gap: '10px' }}>
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
                    padding: '20px 0'
                }}>
                    <div 
                        className="cv-container" 
                        ref={componentRef} 
                        style={{ 
                            background: '#fff', 
                            color: '#333', 
                            width: '210mm', 
                            minHeight: '297mm', 
                            padding: '25mm 20mm', 
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)', 
                            boxSizing: 'border-box', 
                            transform: `scale(${scale})`, 
                            transformOrigin: 'top center', 
                            fontFamily: 'Arial, sans-serif',
                            position: 'relative'
                        }}
                    >
                        
                        {/* Header */}
                        <div style={{ borderBottom: '2.5px solid #1a202c', paddingBottom: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
                            {cvData.foto_url && (
                                <img src={cvData.foto_url} alt="Foto" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--norte-green)', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1 }}>
                                <h1 style={{ color: '#1a202c', margin: '0 0 12px 0', fontSize: '22pt', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{cvData.nome}</h1>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 20px', color: '#4a5568', fontSize: '9.5pt', fontWeight: 500 }}>
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
                                            <span>{cvData.bairro} — {cvData.cidade || 'PA'}</span>
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
                                        <span key={h} style={{ background: '#f1f5f9', color: '#1a202c', padding: '5px 12px', borderRadius: '6px', fontSize: '10pt', fontWeight: 700, border: '1.5px solid #e2e8f0' }}>{h}</span>
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
