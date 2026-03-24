import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building, ArrowLeft, Search, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import CandidateNavbar from '../components/layout/CandidateNavbar';

const isVagaExpirada = (data_limite) => {
    if (!data_limite) return false;
    // Define a data limite as 23:59:59 do dia
    const limite = new Date(data_limite + 'T23:59:59');
    return new Date() > limite;
};

export default function VagasPage() {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVaga, setSelectedVaga] = useState(null); // vaga aberta no modal
    const [hasCV, setHasCV] = useState(false);
    const [candidaturas, setCandidaturas] = useState(new Set());
    const [candidatando, setCandidatando] = useState(false);
    const [reportingVaga, setReportingVaga] = useState(false);
    const [reportMotive, setReportMotive] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [toast, setToast] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            checkUserCV();
            fetchVagas();
            fetchCandidaturas();
        }
    }, [user]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const checkUserCV = async () => {
        try {
            const { data } = await supabase.from('curriculos').select('id, foto_url').eq('user_id', user.id).limit(1).maybeSingle();
            if (data) {
                setHasCV(true);
                setProfilePhoto(data.foto_url);
            } else {
                setHasCV(false);
            }
        } catch (err) {
            console.error('Erro ao verificar CV:', err);
        }
    };

    const fetchVagas = async () => {
        setLoading(true);
        const { data } = await supabase.from('vagas').select('*, empresas(razao_social)').eq('status', 'aberta').order('created_at', { ascending: false });
        if (data) setVagas(data);
        setLoading(false);
    };

    const fetchCandidaturas = async () => {
        const { data } = await supabase.from('candidaturas').select('vaga_id').eq('user_id', user.id);
        if (data) setCandidaturas(new Set(data.map(c => c.vaga_id)));
    };

    const handleCandidatar = async (vagaId) => {
        if (!hasCV) {
            navigate('/dashboard', { state: { alertCV: true } });
            return;
        }
        setCandidatando(true);
        try {
            const { error } = await supabase.from('candidaturas').insert([{ user_id: user.id, vaga_id: vagaId }]);
            if (error) throw error;
            showToast('Candidatura enviada com sucesso! 🚀');
            fetchCandidaturas();
        } catch (err) {
            alert('Erro ao se candidatar: ' + err.message);
        } finally {
            setCandidatando(false);
        }
    };

    const vagasFiltradas = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return vagas.filter(v =>
            v.titulo.toLowerCase().includes(q) ||
            v.empresas?.razao_social?.toLowerCase().includes(q) ||
            v.descricao.toLowerCase().includes(q)
        );
    }, [vagas, searchQuery]);

    const handleDenunciarInterno = async () => {
        if (!user) { alert('Faça login para denunciar.'); return; }
        if (!reportMotive.trim()) { alert('Por favor, descreva o motivo da denúncia.'); return; }

        setSubmittingReport(true);
        try {
            const { error } = await supabase.from('denuncias').insert([{
                user_id: user.id,
                vaga_id: selectedVaga.id,
                empresa_id: selectedVaga.empresa_id,
                motivo: reportMotive
            }]);

            if (error) throw error;

            showToast('Denúncia enviada com sucesso! Nossa equipe analisará o caso. ✓', 'success');
            setReportingVaga(false);
            setReportMotive('');
        } catch (err) {
            alert('Erro ao enviar denúncia: ' + err.message);
        } finally {
            setSubmittingReport(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div>
                <CandidateNavbar profilePhoto={profilePhoto} />
                <div className="container" style={{ marginTop: '2rem' }}>
                    <Skeleton width="300px" height="32px" style={{ marginBottom: '1rem' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                        <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Toast de feedback */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1rem', left: 'auto', zIndex: 9999,
                    maxWidth: 'calc(100vw - 2rem)',
                    padding: '1rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                    background: toast.type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(255,193,7,0.95)',
                    border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ffc107'}`,
                    color: toast.type === 'success' ? '#fff' : '#000',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <CheckCircle size={18} /> {toast.msg}
                </div>
            )}

            {/* Modal de detalhes */}
            {selectedVaga && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={(e) => e.target === e.currentTarget && setSelectedVaga(null)}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '640px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                        border: '1px solid #e5e7eb'
                    }}>
                        {/* Header do Modal */}
                        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderRadius: '16px 16px 0 0' }}>
                            <button onClick={() => { setSelectedVaga(null); setReportingVaga(false); }} style={{
                                position: 'absolute', top: '1.25rem', right: '1.25rem',
                                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                width: '36px', height: '36px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748b', fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1
                            }}>✕</button>

                            <h2 style={{ color: '#0f172a', marginBottom: '0.75rem', paddingRight: '3rem', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>
                                {selectedVaga.titulo}
                            </h2>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(124,58,237,0.1)', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Building size={14} color="var(--neon-purple)" />
                                    <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>
                                        {selectedVaga.empresas?.razao_social || 'Empresa Confidencial'}
                                    </span>
                                </div>
                            </div>

                            {/* Badges de info */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedVaga.modalidade && (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(124,58,237,0.1)', color: 'var(--neon-purple)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.2)' }}>
                                        🏢 {{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[selectedVaga.modalidade]}
                                    </span>
                                )}
                                {selectedVaga.cidade && (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f8fafc', color: '#475569', padding: '4px 12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                        📍 {selectedVaga.cidade}
                                    </span>
                                )}
                                {(selectedVaga.salario_min || selectedVaga.salario_max) && (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(22,163,74,0.08)', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(22,163,74,0.2)' }}>
                                        💰 R$ {selectedVaga.salario_min?.toLocaleString('pt-BR') || '?'} — {selectedVaga.salario_max?.toLocaleString('pt-BR') || '?'}
                                    </span>
                                )}
                                {selectedVaga.data_limite && (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, background: isVagaExpirada(selectedVaga.data_limite) ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245,158,11,0.1)', color: isVagaExpirada(selectedVaga.data_limite) ? '#ef4444' : '#f59e0b', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${isVagaExpirada(selectedVaga.data_limite) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                                        ⏳ {isVagaExpirada(selectedVaga.data_limite) ? 'Prazo Encerrado:' : 'Inscrições até:'} {new Date(selectedVaga.data_limite + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', padding: '4px 8px' }}>
                                    Publicada em {new Date(selectedVaga.created_at).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>

                        {/* Corpo do Modal */}
                        <div style={{ padding: '1.75rem 2rem' }}>

                            {/* Descrição */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                    <div style={{ width: '4px', height: '20px', background: 'var(--neon-purple)', borderRadius: '4px' }}></div>
                                    <h4 style={{ color: '#0f172a', margin: 0, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição das Atividades</h4>
                                </div>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                                    <p style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-line' }}>{selectedVaga.descricao || 'Nenhuma descrição fornecida.'}</p>
                                </div>
                            </div>

                            {/* Requisitos */}
                            {selectedVaga.requisitos && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '4px', height: '20px', background: '#2563eb', borderRadius: '4px' }}></div>
                                        <h4 style={{ color: '#0f172a', margin: 0, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requisitos / Diferenciais</h4>
                                    </div>
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem' }}>
                                        <p style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-line' }}>{selectedVaga.requisitos}</p>
                                    </div>
                                </div>
                            )}

                            {/* Sessão de Ação / Candidatura / Denúncia */}
                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {!reportingVaga ? (
                                    <>
                                        {candidaturas.has(selectedVaga.id) ? (
                                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '10px', color: '#16a34a', fontWeight: 700 }}>
                                                <CheckCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                                                CANDIDATURA ENVIADA
                                            </div>
                                        ) : isVagaExpirada(selectedVaga.data_limite) ? (
                                            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#ef4444', fontWeight: 700 }}>
                                                INSCRIÇÕES ENCERRADAS
                                            </div>
                                        ) : (
                                            <button onClick={() => handleCandidatar(selectedVaga.id)} disabled={candidatando} className="neon-button" style={{ margin: 0, background: 'var(--neon-purple)', fontWeight: 700, fontSize: '1rem' }}>
                                                {candidatando ? '⏳ ENVIANDO...' : '🚀 CANDIDATAR-SE'}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setReportingVaga(true)}
                                            style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', fontSize: '0.78rem', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
                                        >
                                            🚩 Denunciar esta vaga como suspeita
                                        </button>
                                    </>
                                ) : (
                                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ color: '#be123c', margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>DENUNCIAR VAGA</h4>
                                            <button onClick={() => setReportingVaga(false)} style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', fontWeight: 700 }}>CANCELAR</button>
                                        </div>
                                        <textarea
                                            placeholder="Descreva o motivo da denúncia (vaga falsa, golpe, preconceito, etc)..."
                                            value={reportMotive}
                                            onChange={(e) => setReportMotive(e.target.value)}
                                            style={{ width: '100%', minHeight: '100px', border: '1px solid #fecdd3', borderRadius: '8px', padding: '0.75rem', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                                        />
                                        <button
                                            onClick={handleDenunciarInterno}
                                            disabled={submittingReport}
                                            style={{ background: '#e11d48', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', opacity: submittingReport ? 0.7 : 1 }}
                                        >
                                            {submittingReport ? 'ENVIANDO...' : 'ENVIAR DENÚNCIA AGORA'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CandidateNavbar profilePhoto={profilePhoto} />

            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>EXPLORE OPORTUNIDADES</h2>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input className="neon-input" style={{ paddingLeft: '40px' }} placeholder="Cargo ou empresa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                {vagasFiltradas.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Nenhuma vaga encontrada.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                        {vagasFiltradas.map((vaga) => (
                            <div key={vaga.id} className="glass-panel" style={{
                                padding: '1.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                border: '1px solid #eef2f6',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 800, flex: 1, letterSpacing: '-0.03em' }}>
                                        {vaga.titulo.toUpperCase()}
                                    </h3>
                                    {candidaturas.has(vaga.id) && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 700,
                                            background: 'rgba(34,197,94,0.1)',
                                            color: '#16a34a',
                                            padding: '4px 10px',
                                            borderRadius: '20px',
                                            border: '1px solid rgba(34,197,94,0.2)',
                                            whiteSpace: 'nowrap',
                                            marginLeft: '8px'
                                        }}>
                                            ✓ CANDIDATADO
                                        </span>
                                    )}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '1rem',
                                    padding: '8px 12px',
                                    background: '#f8fafc',
                                    borderRadius: '10px',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Building size={16} color="var(--neon-purple)" />
                                        <span style={{ color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>
                                            {vaga.empresas?.razao_social || 'Empresa Confidencial'}
                                        </span>
                                    </div>

                                    {vaga.modalidade && (
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: 'rgba(124, 58, 237, 0.1)',
                                            color: 'var(--neon-purple)',
                                            padding: '3px 9px',
                                            borderRadius: '6px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[vaga.modalidade]}
                                        </span>
                                    )}

                                    {vaga.cidade && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            📍 {vaga.cidade}
                                        </span>
                                    )}
                                </div>

                                {(vaga.salario_min || vaga.salario_max) && (
                                    <div style={{
                                        fontSize: '0.85rem',
                                        color: '#16a34a',
                                        fontWeight: 700,
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        <span>💰</span> R$ {vaga.salario_min?.toLocaleString('pt-BR') || '?'} — {vaga.salario_max?.toLocaleString('pt-BR') || '?'}
                                    </div>
                                )}
                                {vaga.data_limite && (
                                    <div style={{
                                        fontSize: '0.8rem',
                                        color: isVagaExpirada(vaga.data_limite) ? '#ef4444' : '#f59e0b',
                                        fontWeight: 700,
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        ⏳ Inscrições até {new Date(vaga.data_limite + 'T12:00:00Z').toLocaleDateString('pt-BR')} {isVagaExpirada(vaga.data_limite) && '(Encerrado)'}
                                    </div>
                                )}

                                <p style={{
                                    color: 'var(--text-muted)',
                                    fontSize: '0.92rem',
                                    lineHeight: '1.6',
                                    marginBottom: '1.75rem',
                                    flex: 1,
                                    display: '-webkit-box',
                                    WebkitLineClamp: '3',
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                }}>
                                    {vaga.descricao}
                                </p>

                                <button onClick={() => setSelectedVaga(vaga)} className="neon-button" style={{
                                    margin: 0,
                                    padding: '12px',
                                    fontSize: '0.85rem',
                                    background: 'var(--neon-purple)'
                                }}>
                                    VER DETALHES
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
