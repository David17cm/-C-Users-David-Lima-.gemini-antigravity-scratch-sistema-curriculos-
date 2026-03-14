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

const parseJsonItem = (item) => {
    if (typeof item === 'string' && item.trim().startsWith('{')) {
        try { return JSON.parse(item); } catch (e) { return item; }
    }
    return item;
};

export default function CVPreviewPage() {
    const { userId: paramId } = useParams();
    const [cvData, setCvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const componentRef = useRef();

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
            // Optional: You could set a loading state specifically for the image rendering here
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
                <div style={{ background: '#fff', color: '#333', width: '210mm', minHeight: '297mm', padding: '15mm', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e5e7eb', boxSizing: 'border-box', marginBottom: '2rem' }}>
                    <div ref={componentRef} style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
                        <style type="text/css" media="print">
                            {`
                                @page { size: A4 portrait; margin: 15mm; }
                                body { margin: 0; padding: 0; }
                                /* Remove paddings para não sobrar espaço na folha quando impresso */
                                .print-container { padding: 0 !important; width: 100% !important; max-width: none !important; }
                            `}
                        </style>
                        <div className="print-container" style={{ padding: '0 1rem' }}>
                            {/* Cabeçalho */}
                            <div style={{ borderBottom: '2px solid #2c3e50', paddingBottom: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                {cvData.foto_url && (
                                    <img src={cvData.foto_url} alt="Foto" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #7c3aed' }} />
                                )}
                                <div style={{ width: '100%', textAlign: 'center' }}>
                                    <h1 style={{ color: '#2c3e50', margin: '0 0 12px 0', fontSize: '2rem', letterSpacing: 'normal', textShadow: 'none', textAlign: 'center' }}>
                                        {cvData.nome?.toUpperCase()}
                                    </h1>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.75rem 1.5rem', color: '#555', fontSize: '0.9rem' }}>
                                        {cvData.data_nascimento && <span>🎂 {calcularIdade(cvData.data_nascimento)} anos</span>}
                                        {cvData.bairro && <span>📍 {cvData.bairro}{cvData.cidade ? ` - ${cvData.cidade}` : ''}</span>}
                                        {!cvData.bairro && cvData.cidade && <span>📍 {cvData.cidade}</span>}
                                        {cvData.email && <span>✉ {cvData.email}</span>}
                                        {cvData.telefone && <span>📱 {cvData.telefone}</span>}
                                        {cvData.cnh?.possui && cvData.cnh.categorias?.length > 0 && <span>🚗 CNH {cvData.cnh.categorias.join(' / ')}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Resumo */}
                            {cvData.resumo && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h2 style={s.h2}>Resumo Profissional</h2>
                                    <p style={{ fontSize: '11pt', lineHeight: 1.6, textAlign: 'justify' }}>{cvData.resumo}</p>
                                </div>
                            )}

                            {/* Habilidades */}
                            {cvData.habilidades?.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h2 style={s.h2}>Habilidades</h2>
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
                                    <h2 style={s.h2}>Cursos Profissionalizantes</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {cvData.cursos_prof.map((item, i) => {
                                            const c = parseJsonItem(item);
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
                                    <h2 style={s.h2}>Ensino Médio</h2>
                                    {cvData.ensino_medio.status === 'cursando'
                                        ? <p style={{ fontSize: '11pt' }}>Cursando — {cvData.ensino_medio.ano_cursando}{cvData.ensino_medio.turno ? ` · Turno ${cvData.ensino_medio.turno}` : ''}</p>
                                        : <p style={{ fontSize: '11pt' }}>Completo — Concluído em {cvData.ensino_medio.ano_conclusao || '—'}</p>
                                    }
                                </div>
                            )}

                            {/* Formação Acadêmica */}
                            {cvData.formacoes?.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h2 style={s.h2}>Formação Acadêmica</h2>
                                    {cvData.formacoes.map((item, i) => {
                                        const form = parseJsonItem(item);
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
                                    <h2 style={s.h2}>Experiência Profissional</h2>
                                    {cvData.experiencias.map((item, i) => {
                                        const exp = parseJsonItem(item);
                                        return (
                                            <div key={i} style={{ marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '11.5pt', color: '#111' }}>
                                                    <span>{exp.cargo}</span>
                                                    <span style={s.muted}>
                                                        {exp.inicio ? new Date(exp.inicio).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : ''} —{' '}
                                                        {exp.atual ? 'Atual' : exp.fim ? new Date(exp.fim).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : ''}
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
                </div>
            )}
        </div>
    );
}
