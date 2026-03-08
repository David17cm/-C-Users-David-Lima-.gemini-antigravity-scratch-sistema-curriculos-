import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building, ArrowLeft, Search, X, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import Navbar from '../components/layout/Navbar';

export default function VagasPage() {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVaga, setSelectedVaga] = useState(null); // vaga aberta no modal
    const [hasCV, setHasCV] = useState(false);
    const [candidaturas, setCandidaturas] = useState(new Set());
    const [candidatando, setCandidatando] = useState(false);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => { fetchVagas(); }, []);
    useEffect(() => {
        if (user) {
            fetchMeusCandidaturas();
            checkHasCV();
        }
    }, [user]);

    const fetchVagas = async () => {
        try {
            const { data, error } = await supabase
                .from('vagas')
                .select('*, empresas(razao_social)')
                .eq('status', 'aberta')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setVagas(data || []);
        } catch (err) {
            console.error('Erro ao buscar vagas:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkHasCV = async () => {
        const { data } = await supabase.from('curriculos').select('id').eq('user_id', user.id).single();
        setHasCV(!!data);
    };

    const fetchMeusCandidaturas = async () => {
        const { data } = await supabase
            .from('candidaturas')
            .select('vaga_id')
            .eq('user_id', user.id);
        if (data) setCandidaturas(new Set(data.map(c => c.vaga_id)));
    };

    const handleCandidatar = async (vagaId) => {
        if (!user) { alert('Faça login para se candidatar.'); return; }

        if (!hasCV) {
            if (confirm('Você ainda não preencheu seu currículo profissional. Deseja ir para o Dashboard preenchê-lo agora?')) {
                navigate('/dashboard');
            }
            return;
        }

        setCandidatando(true);
        try {
            const { error } = await supabase
                .from('candidaturas')
                .insert([{ user_id: user.id, vaga_id: vagaId }]);

            if (error) {
                if (error.code === '23505') {
                    showToast('Você já se candidatou a esta vaga!', 'warn');
                } else {
                    throw error;
                }
            } else {
                setCandidaturas(prev => new Set([...prev, vagaId]));
                showToast('Candidatura enviada com sucesso! ✓', 'success');
                setSelectedVaga(null);
            }
        } catch (err) {
            alert('Erro ao se candidatar: ' + err.message);
        } finally {
            setCandidatando(false);
        }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const vagasFiltradas = vagas.filter(v =>
        v.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.empresas?.razao_social?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="container" style={{ marginTop: '2rem' }}>
                <Skeleton width="220px" height="32px" style={{ marginBottom: '2rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Toast de feedback */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
                    padding: '1rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                    background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(255,193,7,0.15)',
                    border: `1px solid ${toast.type === 'success' ? '#22c55e' : '#ffc107'}`,
                    color: toast.type === 'success' ? '#22c55e' : '#ffc107',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <CheckCircle size={18} /> {toast.msg}
                </div>
            )}

            {/* Modal de detalhes */}
            {selectedVaga && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
                    onClick={(e) => e.target === e.currentTarget && setSelectedVaga(null)}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => setSelectedVaga(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--neon-blue)', marginBottom: '0.5rem', paddingRight: '2rem' }}>{selectedVaga.titulo}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                <Building size={16} /> {selectedVaga.empresas?.razao_social}
                            </div>
                            {/* Badges de info */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '0.5rem' }}>
                                {selectedVaga.modalidade && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(181,53,246,0.12)', color: 'var(--neon-purple)', padding: '3px 10px', borderRadius: '12px' }}>
                                        🏢 {{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[selectedVaga.modalidade]}
                                    </span>
                                )}
                                {selectedVaga.cidade && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: '12px' }}>
                                        📍 {selectedVaga.cidade}
                                    </span>
                                )}
                                {(selectedVaga.salario_min || selectedVaga.salario_max) && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(34,197,94,0.12)', color: '#22c55e', padding: '3px 10px', borderRadius: '12px' }}>
                                        💰 R$ {selectedVaga.salario_min?.toLocaleString('pt-BR') || '?'} — {selectedVaga.salario_max?.toLocaleString('pt-BR') || '?'}
                                    </span>
                                )}
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                                    Publicada em {new Date(selectedVaga.created_at).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                            <h4 style={{ color: 'var(--neon-purple)', marginBottom: '0.75rem' }}>DESCRIÇÃO DAS ATIVIDADES</h4>
                            <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.95rem' }}>{selectedVaga.descricao}</p>
                        </div>

                        {selectedVaga.requisitos && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                                <h4 style={{ color: 'var(--neon-purple)', marginBottom: '0.75rem' }}>REQUISITOS / DIFERENCIAIS</h4>
                                <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.95rem' }}>{selectedVaga.requisitos}</p>
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                            {candidaturas.has(selectedVaga.id) ? (
                                <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '8px', color: '#22c55e', fontWeight: 600 }}>
                                    <CheckCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
                                    CANDIDATURA ENVIADA
                                </div>
                            ) : (
                                <button onClick={() => handleCandidatar(selectedVaga.id)} disabled={candidatando} className="neon-button" style={{ margin: 0, background: 'var(--neon-blue)', color: '#000' }}>
                                    {candidatando ? 'ENVIANDO...' : '🚀 CANDIDATAR-SE'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Navbar icon={<Briefcase size={24} />} title="VAGAS DISPONÍVEIS">
                <button onClick={() => navigate('/dashboard')} className="neon-button secondary" style={{ margin: 0, padding: '8px 16px', width: 'auto' }}>
                    <ArrowLeft size={16} style={{ marginRight: '5px', display: 'inline', verticalAlign: 'middle' }} /> VOLTAR
                </button>
            </Navbar>

            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>EXPLORE OPORTUNIDADES</h2>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input className="neon-input" style={{ paddingLeft: '40px' }} placeholder="Cargo ou empresa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                {vagasFiltradas.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Nenhuma vaga encontrada.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {vagasFiltradas.map((vaga) => (
                            <div key={vaga.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', flex: 1 }}>{vaga.titulo}</h3>
                                    {candidaturas.has(vaga.id) && (
                                        <span style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                            ✓ CANDIDATADO
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                    <Building size={15} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{vaga.empresas?.razao_social}</span>
                                    {vaga.modalidade && <span style={{ fontSize: '0.68rem', background: 'rgba(181,53,246,0.12)', color: 'var(--neon-purple)', padding: '2px 7px', borderRadius: '10px' }}>{{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[vaga.modalidade]}</span>}
                                    {vaga.cidade && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>📍 {vaga.cidade}</span>}
                                </div>
                                {(vaga.salario_min || vaga.salario_max) && (
                                    <p style={{ fontSize: '0.82rem', color: '#22c55e', marginBottom: '0.75rem' }}>💰 R$ {vaga.salario_min?.toLocaleString('pt-BR') || '?'} — {vaga.salario_max?.toLocaleString('pt-BR') || '?'}</p>
                                )}
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '1.5rem', flex: 1 }}>
                                    {vaga.descricao.length > 120 ? vaga.descricao.substring(0, 120) + '...' : vaga.descricao}
                                </p>

                                <button onClick={() => setSelectedVaga(vaga)} className="neon-button" style={{ margin: 0, padding: '10px' }}>
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
