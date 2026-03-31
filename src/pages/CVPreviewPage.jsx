import { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Image as ImageIcon } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../contexts/AuthContext';
import * as htmlToImage from 'html-to-image';

function calcularIdade(dataNascimento) {
    if (!dataNascimento) return null;
    const hoje = new Date(); const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
}

const LABEL_MODAL = { presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' };

// Função resiliente para lidar com dados novos (objeto) e antigos (string simples)
const parseJsonItem = (item, type = 'generic') => {
    if (!item) return null;
    if (typeof item === 'object') return item;
    
    // Se for string, tenta dar parse se parecer com JSON
    if (typeof item === 'string' && item.trim().startsWith('{')) {
        try { 
            return JSON.parse(item); 
        } catch (e) { 
            // fallback para string simples abixo
        }
    }

    // Se for string simples, converte em objeto compatível
    if (type === 'curso') return { nome: item, instituicao: '', status: 'completo', observacao: '' };
    if (type === 'experiencia') return { empresa: item, cargo: 'Não informado', atual: false, descricao: '' };
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

    // Lógica para escala A4 no mobile
    useEffect(() => {
        const calculateScale = () => {
            const containerWidth = 794; // ~210mm
            const padding = 32; // margem lateral
            const availableWidth = window.innerWidth - padding;
            if (availableWidth < containerWidth) {
                setScale(availableWidth / containerWidth);
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

    const handleDownloadPNG = async () => {
        if (!componentRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(componentRef.current, {
                quality: 0.95,
                backgroundColor: '#ffffff',
                pixelRatio: 2 // High resolution
            });
            const link = document.createElement('a');
            link.download = `Currículo_${cvData?.nome?.replace(/\s+/g, '_') || 'Imagem'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Erro ao gerar PNG:', error);
            alert('Não foi possível gerar a imagem neste momento.');
        }
    };

    if (loading) return <div className="flex-center" style={{ color: 'var(--neon-blue)' }}>Carregando currículo...</div>;

    const s = {
        h2: { fontSize: '13pt', color: '#111', textTransform: 'uppercase', borderBottom: '2px solid #7c3aed', paddingBottom: '5px', marginBottom: '12px', textShadow: 'none' },
        muted: { color: '#4b5563', fontSize: '10pt' },
    };

    return (
        <div style={{ minHeight: '100vh', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '80px' }}>
            <div className="cv-actions-bar" style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', gap: '10px' }}>
                <button onClick={() => navigate(-1)} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>
                    <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> VOLTAR
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleDownloadPNG} className="neon-button" style={{ margin: 0, padding: '8px 16px', width: 'auto', background: '#f59e0b', color: '#fff' }}>
                        <ImageIcon size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> IMAGEM
                    </button>
                    <button onClick={handlePrint} className="neon-button" style={{ margin: 0, padding: '8px 16px', width: 'auto', background: '#7c3aed', color: '#fff' }}>
                        <Printer size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} /> PDF
                    </button>
                </div>
            </div>

            {!cvData ? (
                <div className="glass-panel" style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}>
                    <h3 style={{ color: 'var(--neon-purple)' }}>Nenhum currículo encontrado.</h3>
                </div>
            ) : (
                <div className="cv-preview-wrapper">
                    <div className="cv-container" ref={componentRef} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                        
                        <style type="text/css">
                            {`
                                .cv-preview-wrapper {
                                    width: 100%;
                                    display: flex;
                                    justify-content: center;
                                    overflow: visible;
                                    margin-bottom: 2rem;
                                }

                                .cv-container {
                                    background: #fff;
                                    color: #333;
                                    width: 210mm;
                                    min-height: 297mm;
                                    padding: 15mm;
                                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                                    border: 1px solid #e5e7eb;
                                    box-sizing: border-box;
                                    transform: scale(${scale});
                                    transform-origin: top center;
                                    flex-shrink: 0;
                                    margin-bottom: ${(297 * scale)}mm;
                                }

                                .cv-name {
                                    color: #2c3e50;
                                    margin: 0 0 12px 0;
                                    font-size: 24pt;
                                    font-weight: bold;
                                    text-align: center;
                                }

                                .cv-header-section {
                                    font-size: 13pt;
                                    color: #111;
                                    text-transform: uppercase;
                                    border-bottom: 2px solid var(--norte-green);
                                    padding-bottom: 5px;
                                    margin-bottom: 12px;
                                }

                                @media print {
                                    @page { size: A4 portrait; margin: 0; }
                                    .cv-preview-wrapper { margin: 0; height: auto !important; }
                                    .cv-container { 
                                        transform: none !important; 
                                        box-shadow: none !important; 
                                        border: none !important; 
                                        margin: 0 !important;
                                        padding: 15mm !important;
                                        width: 210mm !important;
                                    }
                                }
                            `}
                        </style>

                        <div style={{ borderBottom: '2px solid #2c3e50', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            {cvData.foto_url && (
                                <img src={cvData.foto_url} alt="Foto" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--norte-green)' }} />
                            )}
                            <div style={{ width: '100%', textAlign: 'center' }}>
                                <h1 className="cv-name">
                                    {cvData.nome?.toUpperCase()}
                                </h1>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem 1.5rem', color: '#555', fontSize: '0.9rem' }}>
                                    {cvData.data_nascimento && <span>🎂 {calcularIdade(cvData.data_nascimento)} anos</span>}
                                    {cvData.genero && <span>👤 {cvData.genero}</span>}
                                    {cvData.bairro && <span>📍 {cvData.bairro}{cvData.cidade ? ` - ${cvData.cidade}` : ''}</span>}
                                    {!cvData.bairro && cvData.cidade && <span>📍 {cvData.cidade}</span>}
                                    {cvData.email && <span>✉ {cvData.email}</span>}
                                    {cvData.telefone && <span>📱 {cvData.telefone}</span>}
                                    {cvData.cnh?.possui && cvData.cnh.categorias?.length > 0 && <span>🚗 CNH {cvData.cnh.categorias.join(' / ')}</span>}
                                </div>
                                {cvData.perfil_disc && (
                                    <div style={{ marginTop: '0.8rem' }}>
                                        {(() => {
                                            try {
                                                const discData = typeof cvData.perfil_disc === 'string' && cvData.perfil_disc.startsWith('{') 
                                                    ? JSON.parse(cvData.perfil_disc) 
                                                    : (typeof cvData.perfil_disc === 'object' ? cvData.perfil_disc : null);
                                                    
                                                if (discData && Object.keys(discData).length > 0) {
                                                    const sorted = Object.entries(discData).sort((a,b) => b[1] - a[1]);
                                                    if (sorted.length > 0 && sorted[0][0]) {
                                                        return (
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--norte-dark-green)', textTransform: 'uppercase' }}>
                                                                    🚀 {sorted[0][0]}
                                                                </span>
                                                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.6rem', fontWeight: 700, color: '#666' }}>
                                                                    {sorted.map(([type, val]) => (
                                                                        <span key={type}>{type.substring(0,3).toUpperCase()}: {val}%</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                }
                                                
                                                const textVal = typeof cvData.perfil_disc === 'string' ? cvData.perfil_disc : 'N/A';
                                                if (textVal && textVal !== 'N/A' && !textVal.startsWith('{')) {
                                                    return (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(0, 141, 76, 0.1)', color: 'var(--norte-green)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(0, 141, 76, 0.2)', textTransform: 'uppercase' }}>
                                                            🌟 PERFIL DISC: {textVal}
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            } catch (err) {
                                                return null;
                                            }
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resumo */}
                        {cvData.resumo && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 className="cv-header-section">Resumo Profissional</h2>
                                <p style={{ fontSize: '11pt', lineHeight: 1.6, textAlign: 'justify' }}>{cvData.resumo}</p>
                            </div>
                        )}

                        {/* Habilidades */}
                        {cvData.habilidades?.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 className="cv-header-section">Habilidades</h2>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {cvData.habilidades.map(h => (
                                        <span key={h} style={{ background: '#f0f4f8', border: '1px solid #ccd6e0', color: '#2c3e50', padding: '3px 10px', borderRadius: '12px', fontSize: '9.5pt' }}>{h}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cursos Profissionalizantes */}
                        {cvData.cursos_prof?.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 className="cv-header-section">Cursos Profissionalizantes</h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {cvData.cursos_prof.map((item, i) => {
                                        const c = parseJsonItem(item, 'curso');
                                        if (!c) return null;
                                        return (
                                            <div key={i} style={{ marginBottom: '5px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11pt', color: '#111' }}>
                                                    <span>{typeof c === 'string' ? c : c.nome}</span>
                                                    <span style={s.muted}>{typeof c === 'object' && c.status ? (c.status === 'completo' ? 'Concluído' : 'Cursando') : ''}</span>
                                                </div>
                                                {typeof c === 'object' && c.instituicao && <div style={{ fontSize: '10pt', color: '#555' }}>{c.instituicao}</div>}
                                                {typeof c === 'object' && c.observacao && <div style={{ fontSize: '9pt', color: '#777', fontStyle: 'italic' }}>{c.observacao}</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Ensino Médio */}
                        {cvData.ensino_medio?.status && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 className="cv-header-section">Ensino Médio</h2>
                                {cvData.ensino_medio.status === 'cursando' ? (
                                    <p style={{ fontSize: '11pt' }}>Cursando — {cvData.ensino_medio.ano_cursando}{cvData.ensino_medio.turno ? ` · Turno ${cvData.ensino_medio.turno}` : ''}</p>
                                ) : cvData.ensino_medio.status === 'incompleto' ? (
                                    <p style={{ fontSize: '11pt' }}>Incompleto</p>
                                ) : (
                                    <p style={{ fontSize: '11pt' }}>Completo — Concluído em {cvData.ensino_medio.ano_conclusao || '—'}</p>
                                )}
                            </div>
                        )}

                        {/* Formação Acadêmica */}
                        {cvData.formacoes?.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 className="cv-header-section">Formação Acadêmica</h2>
                                {cvData.formacoes.map((item, i) => {
                                    const form = parseJsonItem(item, 'formacao');
                                    if (!form) return null;
                                    return (
                                        <div key={i} style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11.5pt', color: '#111' }}>
                                                <span>{form.curso}</span>
                                                <span style={s.muted}>
                                                    {form.status === 'cursando'
                                                        ? `Cursando${form.semestre ? ` · ${form.semestre} sem` : ''}${form.turno ? ` · ${form.turno}` : ''}`
                                                        : form.status === 'trancado' ? 'Trancado'
                                                            : form.fim ? new Date(form.fim).getUTCFullYear() : ''}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '10.5pt', color: '#444', fontStyle: 'italic' }}>{form.instituicao}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Experiência Profissional */}
                        {cvData.experiencias?.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 className="cv-header-section">Experiência Profissional</h2>
                                {cvData.experiencias.map((item, i) => {
                                    const exp = parseJsonItem(item, 'experiencia');
                                    if (!exp) return null;
                                    return (
                                        <div key={i} style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11.5pt', color: '#111' }}>
                                                <span>{exp.cargo}</span>
                                                <span style={s.muted}>
                                                    {exp.mes_inicio && exp.ano_inicio ? `${exp.mes_inicio}/${exp.ano_inicio}` : ''} —{' '}
                                                    {exp.atual ? 'Atual' : (exp.mes_fim && exp.ano_fim ? `${exp.mes_fim}/${exp.ano_fim}` : '')}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '10.5pt', color: '#444', fontStyle: 'italic', marginBottom: '4px' }}>{exp.empresa}</div>
                                            {exp.descricao && <p style={{ fontSize: '10pt', lineHeight: 1.5, color: '#555', marginTop: '5px' }}>{exp.descricao}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
