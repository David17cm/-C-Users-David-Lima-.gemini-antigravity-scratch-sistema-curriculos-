import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Building, Clock, MapPin, CheckCircle, ChevronRight, X } from 'lucide-react';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import CandidateNavbar from '../components/layout/CandidateNavbar';
import { useNavigate } from 'react-router-dom';

const isVagaExpirada = (data_limite) => {
    if (!data_limite) return false;
    const [ano, mes, dia] = data_limite.split('-').map(Number);
    const limite = new Date(ano, mes - 1, dia, 23, 59, 59);
    return new Date() > limite;
};

export default function MinhasCandidaturasPage() {
    const [candidaturas, setCandidaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [selectedVaga, setSelectedVaga] = useState(null);
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchCandidaturas();
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data } = await supabase.from('curriculos').select('foto_url').eq('user_id', user.id).limit(1).maybeSingle();
            if (data) setProfilePhoto(data.foto_url);
        } catch (err) { console.error('Erro ao buscar foto:', err); }
    };

    const fetchCandidaturas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('candidaturas')
                .select(`
                    id,
                    created_at,
                    vagas (
                        id,
                        titulo,
                        descricao,
                        requisitos,
                        cidade,
                        modalidade,
                        salario_min,
                        salario_max,
                        quantidade,
                        data_limite,
                        empresas (
                            razao_social,
                            logo_url,
                            historia,
                            telefone,
                            email_contato,
                            cidade,
                            bairro,
                            endereco
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCandidaturas(data || []);
        } catch (err) {
            console.error('Erro ao buscar candidaturas:', err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative' }}>
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

    const vaga = selectedVaga?.vagas;

    return (
        <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative' }}>

            {/* ════════ MODAL DETALHES DA VAGA ════════ */}
            {selectedVaga && vaga && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15,26,15,0.4)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={e => e.target === e.currentTarget && setSelectedVaga(null)}
                >
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        width: '100%',
                        maxWidth: '660px',
                        maxHeight: '92vh',
                        overflowY: 'auto',
                        position: 'relative',
                        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.18)',
                        border: '1px solid #e2e8f0',
                    }}>
                        {/* Header fixo */}
                        <div style={{
                            padding: '1.75rem 2rem 1.25rem',
                            borderBottom: '1px solid #f1f5f9',
                            position: 'sticky',
                            top: 0,
                            background: '#fff',
                            zIndex: 10,
                            borderRadius: '20px 20px 0 0'
                        }}>
                            <button
                                onClick={() => setSelectedVaga(null)}
                                style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                                <X size={18} />
                            </button>

                            {/* Empresa + Título */}
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.25rem', paddingRight: '2.5rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                                    {vaga.empresas?.logo_url
                                        ? <img src={vaga.empresas.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        : <Building size={28} color="#94a3b8" />
                                    }
                                </div>
                                <div>
                                    <h2 style={{ color: 'var(--norte-dark-green)', margin: 0, fontSize: '1.4rem', fontWeight: 900, lineHeight: 1.2 }}>{vaga.titulo}</h2>
                                    <p style={{ color: '#64748b', fontSize: '0.95rem', fontWeight: 600, margin: '4px 0 0' }}>{vaga.empresas?.razao_social || 'Empresa Confidencial'}</p>
                                </div>
                            </div>

                            {/* Badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ background: 'rgba(0,141,76,0.06)', border: '1px solid rgba(0,141,76,0.15)', color: 'var(--norte-green)', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
                                    ✓ Candidatura Enviada
                                </span>
                                {vaga.modalidade && (
                                    <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' }}>
                                        🏢 {{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[vaga.modalidade]}
                                    </span>
                                )}
                                {vaga.cidade && (
                                    <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', fontSize: '0.75rem', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' }}>
                                        📍 {vaga.cidade}
                                    </span>
                                )}
                                {(vaga.salario_min || vaga.salario_max) && (
                                    <span style={{ background: 'rgba(0,141,76,0.06)', border: '1px solid rgba(0,141,76,0.15)', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
                                        💰 R$ {vaga.salario_min?.toLocaleString('pt-BR') || '?'} — {vaga.salario_max?.toLocaleString('pt-BR') || '?'}
                                    </span>
                                )}
                                {vaga.data_limite && (
                                    <span style={{ background: isVagaExpirada(vaga.data_limite) ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.08)', border: `1px solid ${isVagaExpirada(vaga.data_limite) ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`, color: isVagaExpirada(vaga.data_limite) ? '#ef4444' : '#d97706', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
                                        ⏳ {isVagaExpirada(vaga.data_limite) ? 'Prazo Encerrado' : `Até ${new Date(vaga.data_limite + 'T12:00:00Z').toLocaleDateString('pt-BR')}`}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Corpo */}
                        <div style={{ padding: '1.75rem 2rem' }}>
                            {/* Sobre a empresa */}
                            {vaga.empresas?.historia && (
                                <div style={{ marginBottom: '1.75rem', padding: '1.25rem', background: 'rgba(0,141,76,0.03)', border: '1px solid rgba(0,141,76,0.1)', borderRadius: '14px' }}>
                                    <h4 style={{ color: 'var(--norte-green)', margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sobre a Empresa</h4>
                                    <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>{vaga.empresas.historia}</p>
                                </div>
                            )}

                            {/* Descrição */}
                            <div style={{ marginBottom: '1.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                    <div style={{ width: '4px', height: '20px', background: 'var(--norte-green)', borderRadius: '4px' }} />
                                    <h4 style={{ color: 'var(--norte-dark-green)', margin: 0, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição das Atividades</h4>
                                </div>
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                                    <p style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-line' }}>{vaga.descricao || 'Nenhuma descrição fornecida.'}</p>
                                </div>
                            </div>

                            {/* Requisitos */}
                            {vaga.requisitos && (
                                <div style={{ marginBottom: '1.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '4px', height: '20px', background: '#3b82f6', borderRadius: '4px' }} />
                                        <h4 style={{ color: 'var(--norte-dark-green)', margin: 0, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requisitos / Diferenciais</h4>
                                    </div>
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                                        <p style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.95rem', margin: 0, whiteSpace: 'pre-line' }}>{vaga.requisitos}</p>
                                    </div>
                                </div>
                            )}

                            {/* Contatos da empresa */}
                            {(vaga.empresas?.email_contato || vaga.empresas?.telefone || vaga.empresas?.endereco) && (
                                <div style={{ marginBottom: '1.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '4px', height: '20px', background: '#10b981', borderRadius: '4px' }} />
                                        <h4 style={{ color: 'var(--norte-dark-green)', margin: 0, fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contatos e Localização</h4>
                                    </div>
                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {vaga.empresas.email_contato && <div style={{ fontSize: '0.9rem', color: '#334155' }}>✉ {vaga.empresas.email_contato}</div>}
                                        {vaga.empresas.telefone && <div style={{ fontSize: '0.9rem', color: '#334155' }}>📱 {vaga.empresas.telefone}</div>}
                                        {vaga.empresas.endereco && <div style={{ fontSize: '0.9rem', color: '#334155' }}>📍 {vaga.empresas.endereco}{vaga.empresas.bairro ? `, ${vaga.empresas.bairro}` : ''}{vaga.empresas.cidade ? ` - ${vaga.empresas.cidade}` : ''}</div>}
                                    </div>
                                </div>
                            )}

                            {/* Data de candidatura + botão fechar */}
                            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={14} /> Candidatura em {new Date(selectedVaga.created_at).toLocaleDateString('pt-BR')}
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => navigate('/vagas')}
                                        style={{ background: 'white', border: '2px solid #e2e8f0', color: 'var(--norte-dark-green)', borderRadius: '14px', padding: '12px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
                                    >
                                        Ver Outras Vagas
                                    </button>
                                    <button
                                        onClick={() => setSelectedVaga(null)}
                                        style={{ background: 'var(--norte-green)', border: 'none', color: '#fff', borderRadius: '14px', padding: '12px 24px', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 6px 14px rgba(0,141,76,0.2)' }}
                                    >
                                        Fechar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <CandidateNavbar profilePhoto={profilePhoto} />

            <div className="container" style={{ marginTop: '2rem', paddingBottom: '3rem' }}>
                {/* Cabeçalho */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h2 style={{ color: 'var(--norte-dark-green)', margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Minhas Candidaturas</h2>
                    <p style={{ color: '#64748b', marginTop: '0.5rem', fontWeight: 500 }}>Acompanhe o histórico das vagas onde você se candidatou.</p>
                </div>

                {candidaturas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'inline-flex', padding: '24px', background: 'rgba(0,141,76,0.05)', borderRadius: '50%', marginBottom: '1.5rem' }}>
                            <Briefcase size={40} color="var(--norte-green)" style={{ opacity: 0.6 }} />
                        </div>
                        <h3 style={{ color: 'var(--norte-dark-green)', marginBottom: '0.5rem', fontWeight: 900, fontSize: '1.4rem' }}>Você ainda não se candidatou</h3>
                        <p style={{ color: '#64748b', fontWeight: 500, marginBottom: '2rem' }}>Explore as vagas disponíveis e comece sua jornada!</p>
                        <button
                            onClick={() => navigate('/vagas')}
                            style={{ background: 'var(--norte-green)', color: '#fff', border: 'none', borderRadius: '14px', padding: '14px 32px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,141,76,0.2)' }}
                        >
                            Ver Vagas Disponíveis
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
                        {candidaturas.map((cand) => {
                            const encerrada = isVagaExpirada(cand.vagas?.data_limite);
                            return (
                                <div key={cand.id} style={{
                                    background: '#fff',
                                    borderRadius: '18px',
                                    border: encerrada ? '1px solid #fee2e2' : '1px solid #e2e8f0',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1rem',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                                    transition: 'box-shadow 0.2s, transform 0.2s',
                                    opacity: encerrada ? 0.85 : 1,
                                    position: 'relative'
                                }}>
                                    {/* Topo: status + data */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {encerrada ? (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 800,
                                                color: '#ef4444',
                                                background: 'rgba(239, 68, 68, 0.08)',
                                                padding: '4px 12px', borderRadius: '20px',
                                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <X size={11} /> VAGA ENCERRADA
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 800,
                                                color: 'var(--norte-green)',
                                                background: 'rgba(0,141,76,0.08)',
                                                padding: '4px 12px', borderRadius: '20px',
                                                border: '1px solid rgba(0,141,76,0.15)',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <CheckCircle size={11} /> CANDIDATADO
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                            <Clock size={12} /> {new Date(cand.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>

                                    {/* Título */}
                                    <h3 style={{ margin: 0, color: encerrada ? '#64748b' : 'var(--norte-dark-green)', fontSize: '1.15rem', fontWeight: 900, lineHeight: 1.2 }}>
                                        {cand.vagas?.titulo}
                                    </h3>

                                    {/* Info da empresa/vaga */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Building size={15} color={encerrada ? '#94a3b8' : "var(--norte-green)"} />
                                            <span style={{ color: encerrada ? '#64748b' : '#334155', fontWeight: 700, fontSize: '0.9rem' }}>
                                                {cand.vagas?.empresas?.razao_social || 'Empresa Confidencial'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            {cand.vagas?.cidade && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                                                    <MapPin size={13} /> {cand.vagas.cidade}
                                                </span>
                                            )}
                                            {cand.vagas?.modalidade && (
                                                <span style={{ background: '#f1f5f9', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: '6px', color: '#475569' }}>
                                                    {{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[cand.vagas.modalidade]}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Botão Ver Vaga */}
                                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                                        <button
                                            onClick={() => !encerrada && setSelectedVaga(cand)}
                                            disabled={encerrada}
                                            style={{
                                                width: '100%',
                                                background: encerrada ? '#f8fafc' : 'white',
                                                border: encerrada ? '2px solid #e2e8f0' : '2px solid var(--norte-green)',
                                                color: encerrada ? '#94a3b8' : 'var(--norte-green)',
                                                borderRadius: '12px',
                                                padding: '10px',
                                                cursor: encerrada ? 'not-allowed' : 'pointer',
                                                fontWeight: 800,
                                                fontSize: '0.9rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => { if(!encerrada) { e.currentTarget.style.background = 'var(--norte-green)'; e.currentTarget.style.color = '#fff'; } }}
                                            onMouseOut={e => { if(!encerrada) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--norte-green)'; } }}
                                        >
                                            {encerrada ? 'VAGA ENCERRADA' : 'Ver Detalhes da Vaga'} <ChevronRight size={16} />
                                        </button>
                                        
                                        {encerrada && (
                                            <div style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, marginTop: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Não é possível ver os detalhes desta vaga
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Barra inferior caso encerrada */}
                                    {encerrada && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                                            background: '#ef4444', borderRadius: '0 0 18px 18px', opacity: 0.6
                                        }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
