import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building, ArrowLeft, Search, X, CheckCircle, AlertTriangle, ChevronRight, UserCheck, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import CandidateNavbar from '../components/layout/CandidateNavbar';
import { NorteToast } from '../components/ui/NorteToast';
import { calculateScore, getRequirementAnalysis } from '../utils/matchingEngine';
import HeatmapBadge from '../components/ui/HeatmapBadge';

const isVagaExpirada = (data_limite) => {
    if (!data_limite) return false;
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const limite = new Date(data_limite + 'T12:00:00Z');
    return hoje > limite;
};

export default function VagasPage() {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVaga, setSelectedVaga] = useState(null); // vaga aberta no modal
    const [hasCV, setHasCV] = useState(false);
    const [cvData, setCvData] = useState(null); // Guardar dados do CV para scoring
    const [candidaturas, setCandidaturas] = useState(new Set());
    const [candidatando, setCandidatando] = useState(false);
    const [reportingVaga, setReportingVaga] = useState(false);
    const [reportMotive, setReportMotive] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [showMotivModal, setShowMotivModal] = useState(false);
    const [scoreWarning, setScoreWarning] = useState(null); // { score, missing, vaga }
    
    // Estados para Paginação e Debounce
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            checkUserCV();
            fetchCandidaturas();
        }
    }, [user]);

    // Efeito de Debounce para a busca
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(0); // Volta para a primeira página ao buscar
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Efeito para buscar vagas quando a página ou a busca mudar
    useEffect(() => {
        if (user) {
            fetchVagas();
        }
    }, [user, currentPage, debouncedSearch]);


    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: 'info' }), 4000);
    };

    const checkUserCV = async () => {
        try {
            const { data } = await supabase.from('curriculos').select('*').eq('user_id', user.id).limit(1).maybeSingle();
            if (data) {
                setHasCV(true);
                setCvData(data);
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
        try {
            const from = currentPage * pageSize;
            const to = from + pageSize - 1;

            const today = new Date().toISOString().split('T')[0];
            let query = supabase
                .from('vagas')
                .select('*, empresas(*)', { count: 'exact' })
                .eq('status', 'aberta')
                .or(`data_limite.is.null,data_limite.gte.${today}`);

            if (debouncedSearch) {
                // Filtro por título ou descrição no banco (Case Insensitive)
                query = query.or(`titulo.ilike.%${debouncedSearch}%,descricao.ilike.%${debouncedSearch}%`);
            }

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            setVagas(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error('Erro ao buscar vagas:', err);
            showToast('Falha na conexão com o banco de dados.', 'error');
        } finally {
            setLoading(false);
        }
    };


    const fetchCandidaturas = async () => {
        const { data } = await supabase.from('candidaturas').select('vaga_id').eq('user_id', user.id);
        if (data) setCandidaturas(new Set(data.map(c => c.vaga_id)));
    };

    const handleCandidatar = async (vaga, bypassWarning = false) => {
        if (candidatando) return; // Trava de segurança contra cliques múltiplos
        if (!hasCV) {
            setShowMotivModal(true);
            return;
        }


        // --- NOVA LÓGICA DE SCORE (20% MATCH) ---
        if (!bypassWarning) {
            const { score } = calculateScore(cvData, vaga, 'vaga');
            if (score <= 20) {
                const { missing } = getRequirementAnalysis(cvData, vaga);
                setScoreWarning({ score, missing, vaga });
                return;
            }
        }

        setCandidatando(true);
        setScoreWarning(null); // Limpa aviso se houver
        try {
            const { error } = await supabase.from('candidaturas').insert([{ user_id: user.id, vaga_id: vaga.id }]);
            if (error) throw error;
            showToast('Candidatura enviada com sucesso! 🚀');
            fetchCandidaturas();
            if (selectedVaga?.id === vaga.id) setSelectedVaga(null); // Fecha modal de detalhes se estiver aberto
        } catch (err) {
            showToast('Erro ao se candidatar: ' + err.message, 'error');
        } finally {
            setCandidatando(false);
        }
    };

    const selectedScore = useMemo(() => {
        if (!selectedVaga || !cvData) return null;
        return calculateScore(cvData, selectedVaga, 'vaga');
    }, [selectedVaga, cvData]);


    const handleDenunciarInterno = async () => {
        if (submittingReport) return; // Trava contra cliques múltiplos
        if (!user) { setToast({ message: 'Faça login para denunciar.', type: 'info' }); return; }
        if (!reportMotive.trim()) { setToast({ message: 'Por favor, descreva o motivo da denúncia.', type: 'info' }); return; }


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
            setToast({ message: 'Erro ao enviar denúncia: ' + err.message, type: 'error' });
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
            {toast.message && (
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
                    <CheckCircle size={18} /> {toast.message}
                </div>
            )}

            {/* Modal de Detalhes de Score Baixo (Afinidade Consciente) */}
            {scoreWarning && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={(e) => e.target === e.currentTarget && setScoreWarning(null)}>
                    <div style={{ 
                        maxWidth: '480px', width: '100%', padding: window.innerWidth < 768 ? '2.5rem 1.75rem' : '3rem 2.5rem', textAlign: 'center', 
                        background: '#fff', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        border: '1px solid #e2e8f0',
                        position: 'relative',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ 
                            width: window.innerWidth < 768 ? '64px' : '80px', 
                            height: window.innerWidth < 768 ? '64px' : '80px', 
                            background: 'rgba(235, 191, 33, 0.1)', 
                            borderRadius: '50%', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', margin: '0 auto 1.5rem',
                            border: '2px solid rgba(235, 191, 33, 0.2)'
                        }}>
                            <AlertTriangle size={window.innerWidth < 768 ? 32 : 40} color="#f59e0b" />
                        </div>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ color: '#0f172a', fontSize: window.innerWidth < 768 ? '1.75rem' : '2.1rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>Afinidade de {scoreWarning.score}%</h2>
                            <p style={{ color: '#ef4444', fontSize: window.innerWidth < 768 ? '1rem' : '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>VOCÊ DEVE MELHORAR O SEU PERFIL</p>
                            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, maxWidth: '340px', margin: '0 auto' }}>
                                Compatibilidade de apenas {scoreWarning.score}%. Ajuste seu currículo para garantir sua contratação.
                            </p>
                        </div>

                        {scoreWarning.missing.length > 0 && (
                            <div style={{ 
                                background: '#f8fafc', 
                                border: '1px solid #e2e8f0', 
                                borderRadius: '24px', 
                                padding: window.innerWidth < 768 ? '1.5rem 1.25rem' : '2rem 1.5rem', 
                                marginBottom: '2.5rem', 
                                textAlign: 'left',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}>
                                <h4 style={{ margin: '0 0 1.25rem 0.25rem', fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>💡</span> O QUE FALTA NO SEU PERFIL:
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {scoreWarning.missing.slice(0, 3).map((m, i) => (
                                        <div key={i} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '12px',
                                            padding: '12px 14px',
                                            background: '#fff',
                                            borderRadius: '16px',
                                            border: '1px solid #edf2f7',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                                        }}>
                                            <div style={{ 
                                                width: '18px', 
                                                height: '18px', 
                                                borderRadius: '50%', 
                                                background: '#fffbeb', 
                                                border: '1px solid #fde68a', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                flexShrink: 0 
                                            }}>
                                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b' }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                                                {m}
                                            </span>
                                        </div>
                                    ))}
                                    {scoreWarning.missing.length > 3 && (
                                        <p style={{ margin: '8px 0 0 4px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                            + {scoreWarning.missing.length - 3} outros itens recomendados
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                onClick={() => navigate('/dashboard')} 
                                className="neon-button" 
                                style={{ 
                                    margin: 0, 
                                    background: 'var(--norte-green)', 
                                    color: '#fff',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '12px', 
                                    height: window.innerWidth < 768 ? '58px' : '64px',
                                    borderRadius: '18px',
                                    fontSize: '1rem',
                                    fontWeight: 800,
                                    boxShadow: '0 12px 24px rgba(0, 141, 76, 0.25)',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <Pencil size={window.innerWidth < 768 ? 18 : 20} /> EDITAR O CURRÍCULO
                            </button>
                            
                            <button 
                                onClick={() => { setScoreWarning(null); setSelectedVaga(null); }} 
                                style={{ 
                                    background: 'transparent', 
                                    color: '#64748b', 
                                    border: '1px solid #e2e8f0', 
                                    borderRadius: '18px', 
                                    padding: '14px', 
                                    fontWeight: 700, 
                                    cursor: 'pointer', 
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <Search size={18} /> VER OUTRAS VAGAS
                            </button>

                            <button 
                                onClick={() => handleCandidatar(scoreWarning.vaga, true)} 
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: '#ef4444', 
                                    fontSize: '0.82rem', 
                                    fontWeight: 700, 
                                    cursor: 'pointer',
                                    marginTop: '8px',
                                    padding: '10px',
                                    textDecoration: 'underline',
                                    opacity: 0.8
                                }}
                            >
                                SE CANDIDATAR MESMO ASSIM
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Motivador */}
            {showMotivModal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(15, 26, 15, 0.4)', backdropFilter:'blur(8px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}
                    onClick={e => e.target===e.currentTarget && setShowMotivModal(false)}>
                    <div style={{ 
                        background:'#ffffff', 
                        border:'1px solid #e2e8f0', 
                        borderRadius:'28px', 
                        width:'100%', 
                        maxWidth:'500px', 
                        padding:'3rem 2rem', 
                        position:'relative', 
                        textAlign:'center', 
                        boxShadow:'0 30px 60px -12px rgba(0,0,0,0.15)' 
                    }}>
                        <button onClick={() => setShowMotivModal(false)} style={{ position:'absolute', top:'20px', right:'20px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', color:'#64748b', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>✕</button>

                        {/* Ícone decorativo */}
                        <div style={{ display:'inline-flex', padding:'24px', background:'rgba(0,141,76,0.06)', borderRadius:'50%', marginBottom:'2rem', border:'2px solid rgba(0,141,76,0.12)' }}>
                            <span style={{ fontSize:'2.8rem' }}>📋</span>
                        </div>

                        <h2 style={{ fontSize:'1.85rem', fontWeight:900, marginBottom:'1rem', color:'var(--norte-dark-green)', lineHeight:1.2, letterSpacing:'-0.02em' }}>
                            Um passo antes de se candidatar!
                        </h2>
                        <p style={{ color:'var(--text-muted)', lineHeight:1.6, marginBottom:'2rem', fontSize:'1.05rem', fontWeight:500 }}>
                            Para se candidatar, você precisa ter um <strong style={{ color:'var(--norte-green)', fontWeight:800 }}>currículo completo</strong>. Criamos um processo rápido e guiado para você!
                        </p>

                        {/* Grade de Passos */}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'2.5rem' }}>
                            {[
                                { emoji:'👤', text:'Dados', time:'3 min' },
                                { emoji:'💼', text:'Exp.', time:'2 min' },
                                { emoji:'🎓', text:'Ensino', time:'1 min' },
                                { emoji:'⭐', text:'Skills', time:'1 min' },
                                { emoji:'🧠', text:'DISC', time:'4 min' },
                            ].map((item, i) => (
                                <div key={i} style={{ background:'#f8fafc', border:'1px solid #f1f5f9', borderRadius:'16px', padding:'12px 8px', textAlign:'center' }}>
                                    <div style={{ fontSize:'1.2rem', marginBottom:'4px' }}>{item.emoji}</div>
                                    <div style={{ color:'var(--norte-dark-green)', fontSize:'0.75rem', fontWeight:800 }}>{item.text}</div>
                                    <div style={{ color:'var(--norte-green)', fontSize:'0.65rem', fontWeight:700, marginTop:'2px' }}>{item.time}</div>
                                </div>
                            ))}
                            <div style={{ background:'rgba(235,191,33,0.08)', border:'1px solid rgba(235,191,33,0.2)', borderRadius:'16px', padding:'12px 8px', textAlign:'center', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                                <div style={{ color:'var(--norte-dark-green)', fontSize:'0.7rem', fontWeight:800, lineHeight:1.1 }}>Tempo Estimado</div>
                                <div style={{ color:'#856404', fontSize:'0.85rem', fontWeight:900, marginTop:'4px' }}>~11 min</div>
                            </div>
                        </div>

                        <div style={{ display:'flex', gap:'12px', flexDirection:'column' }}>
                            <button onClick={() => navigate('/cv-wizard')} style={{ background:'var(--norte-green)', color:'#fff', border:'none', borderRadius:'16px', padding:'18px', fontSize:'1.1rem', fontWeight:800, cursor:'pointer', boxShadow:'0 10px 20px rgba(0,141,76,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', transition:'transform 0.2s' }}>
                                🚀 Fazer meu currículo agora
                            </button>
                            <button onClick={() => setShowMotivModal(false)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', borderRadius:'16px', padding:'10px', fontSize:'0.95rem', cursor:'pointer', fontWeight:600, textDecoration:'underline' }}>
                                Voltar para as vagas
                            </button>
                        </div>
                    </div>
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
                            border: '1px solid #e5e7eb',
                            boxSizing: 'border-box'
                        }}>
                            {/* Header do Modal */}
                            <div style={{ 
                                padding: window.innerWidth < 768 ? '1.5rem 1rem 1rem' : '2rem 2rem 1.5rem', 
                                borderBottom: '1px solid #f1f5f9', 
                                position: 'sticky', 
                                top: 0, 
                                background: '#fff', 
                                zIndex: 10, 
                                borderRadius: '16px 16px 0 0' 
                            }}>
                                <button onClick={() => { setSelectedVaga(null); setReportingVaga(false); }} style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                    width: '36px', height: '36px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#64748b', fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1,
                                    zIndex: 20
                                }}>✕</button>
    
                                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', marginBottom: '1.5rem', paddingRight: '40px' }}>
                                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                        {selectedVaga.empresas?.logo_url ? (
                                            <img src={selectedVaga.empresas.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <Building size={28} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h2 style={{ color: '#0f172a', margin: 0, fontSize: '1.35rem', fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-word' }}>
                                            {selectedVaga.titulo}
                                        </h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                            <Building size={14} color="var(--neon-purple)" />
                                            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {selectedVaga.empresas?.razao_social || 'Empresa Confidencial'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            {/* Badges de info */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedVaga.modalidade && (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(124,58,237,0.1)', color: 'var(--neon-purple)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(124,58,237,0.2)' }}>
                                        🏢 {{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[selectedVaga.modalidade]}
                                    </span>
                                )}
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, background: '#f8fafc', color: '#475569', padding: '4px 12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                    📍 {selectedVaga.cidade || selectedVaga.empresas?.cidade || 'Não informada'}
                                </span>
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
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(34,197,94,0.08)', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    📦 {selectedVaga.quantidade || 1} {(selectedVaga.quantidade > 1) ? 'Vagas Disponíveis' : 'Vaga Única'}
                                </span>
                            </div>
                        </div>

                        {/* Corpo do Modal */}
                        <div style={{ padding: window.innerWidth < 768 ? '1rem' : '1.75rem 2rem' }}>
                            {/* Sobre a Empresa (Novo) */}
                            {selectedVaga.empresas?.historia && (
                                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#fdfaff', border: '1px solid #f3e8ff', borderRadius: '12px' }}>
                                    <h4 style={{ color: 'var(--neon-purple)', margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Sobre a Empresa</h4>
                                    <p style={{ color: '#5b21b6', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{selectedVaga.empresas.historia}</p>
                                </div>
                            )}

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

                            {/* Contatos e Localização (Novo) */}
                            {(selectedVaga.empresas?.email_contato || selectedVaga.empresas?.telefone || selectedVaga.empresas?.endereco) && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '4px', height: '20px', background: '#10b981', borderRadius: '4px' }}></div>
                                        <h4 style={{ color: '#0f172a', margin: 0, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Contatos e Localização</h4>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        {selectedVaga.empresas.email_contato && <div style={{ fontSize: '0.9rem' }}>✉ <span style={{ color: '#475569' }}>{selectedVaga.empresas.email_contato}</span></div>}
                                        {selectedVaga.empresas.telefone && <div style={{ fontSize: '0.9rem' }}>📱 <span style={{ color: '#475569' }}>{selectedVaga.empresas.telefone}</span></div>}
                                        {selectedVaga.empresas.endereco && <div style={{ fontSize: '0.9rem', gridColumn: '1 / -1' }}>📍 <span style={{ color: '#475569' }}>{selectedVaga.empresas.endereco}, {selectedVaga.empresas.bairro} - {selectedVaga.empresas.cidade}</span></div>}
                                    </div>
                                </div>
                            )}

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
                                            <button onClick={() => handleCandidatar(selectedVaga)} disabled={candidatando} className="neon-button" style={{ margin: 0, background: 'var(--neon-purple)', fontWeight: 700, fontSize: '1rem' }}>
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

                {vagas.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Nenhuma vaga encontrada.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                            {vagas.map((vaga) => (

                            <div key={vaga.id} className="glass-panel" style={{
                                padding: '1.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease',
                                border: '1px solid #eef2f6',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                            {vaga.empresas?.logo_url ? (
                                                <img src={vaga.empresas.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            ) : (
                                                <Building size={20} color="#94a3b8" />
                                            )}
                                        </div>
                                        <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                                            {vaga.titulo.toUpperCase()}
                                        </h3>
                                    </div>
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

                                    <span style={{ 
                                        fontSize: '0.7rem', 
                                        fontWeight: 800, 
                                        background: 'rgba(34,197,94,0.1)', 
                                        color: '#16a34a', 
                                        padding: '3px 9px', 
                                        borderRadius: '6px'
                                    }}>
                                        📦 {vaga.quantidade || 1} {vaga.quantidade > 1 ? 'VAGAS' : 'VAGA'}
                                    </span>
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

                    {/* Paginação */}
                    {totalCount > pageSize && (
                        <div style={{ 
                            marginTop: '3rem', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            gap: '1.5rem',
                            paddingBottom: '4rem'
                        }}>
                            <button 
                                disabled={currentPage === 0 || loading}
                                onClick={() => {
                                    setCurrentPage(p => p - 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="neon-button"
                                style={{ 
                                    margin: 0, 
                                    width: 'auto', 
                                    padding: '10px 20px',
                                    background: 'var(--neon-purple)',
                                    opacity: (currentPage === 0 || loading) ? 0.5 : 1,
                                    cursor: (currentPage === 0 || loading) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Anterior
                            </button>
                            
                            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                Página {currentPage + 1} de {Math.ceil(totalCount / pageSize)}
                            </div>

                            <button 
                                disabled={currentPage >= Math.ceil(totalCount / pageSize) - 1 || loading}
                                onClick={() => {
                                    setCurrentPage(p => p + 1);
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="neon-button"
                                style={{ 
                                    margin: 0, 
                                    width: 'auto', 
                                    padding: '10px 20px',
                                    background: 'var(--neon-purple)',
                                    opacity: (currentPage >= Math.ceil(totalCount / pageSize) - 1 || loading) ? 0.5 : 1,
                                    cursor: (currentPage >= Math.ceil(totalCount / pageSize) - 1 || loading) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                    </>
                )}

            </div>

            <NorteToast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast({ ...toast, message: '' })} 
            />
        </div>
    );
}
