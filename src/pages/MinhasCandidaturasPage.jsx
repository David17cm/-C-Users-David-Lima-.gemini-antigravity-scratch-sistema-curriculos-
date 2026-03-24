import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Building, Clock, MapPin, CheckCircle, ChevronRight } from 'lucide-react';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import CandidateNavbar from '../components/layout/CandidateNavbar';

export default function MinhasCandidaturasPage() {
    const [candidaturas, setCandidaturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const { user, loading: authLoading } = useAuth();

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
                        cidade,
                        modalidade,
                        salario_min,
                        salario_max,
                        empresas (
                            razao_social
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
            <CandidateNavbar profilePhoto={profilePhoto} />

            <div className="container" style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--neon-blue)', margin: 0 }}>MINHAS CANDIDATURAS</h2>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Acompanhe o histórico das vagas onde você se candidatou.</p>
                </div>

                {candidaturas.length === 0 ? (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <Briefcase size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Você ainda não se candidatou</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Explore as vagas disponíveis e comece sua jornada!</p>
                        <button 
                            onClick={() => window.location.href = '/vagas'} 
                            className="neon-button" 
                            style={{ width: 'auto', marginTop: '1.5rem', background: 'var(--neon-purple)' }}
                        >
                            VER VAGAS DISPONÍVEIS
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
                        {candidaturas.map((cand) => (
                            <div key={cand.id} className="glass-panel" style={{
                                padding: '1.5rem',
                                border: '1px solid rgba(124, 58, 237, 0.1)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                transition: 'transform 0.2s ease'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700, 
                                        color: '#16a34a', 
                                        background: 'rgba(22,163,74,0.1)', 
                                        padding: '4px 10px', 
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <CheckCircle size={12} /> CANDIDATADO
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} /> {new Date(cand.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>

                                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>
                                    {cand.vagas?.titulo?.toUpperCase()}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Building size={16} color="var(--neon-purple)" />
                                        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                                            {cand.vagas?.empresas?.razao_social || 'Empresa Confidencial'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <MapPin size={14} /> {cand.vagas?.cidade || 'Não especificado'}
                                        </span>
                                        <span style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                                            {{ presencial: 'Presencial', hibrido: 'Híbrido', remoto: 'Remoto' }[cand.vagas?.modalidade] || 'N/A'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ 
                                    marginTop: 'auto', 
                                    paddingTop: '1rem', 
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button 
                                        className="neon-button secondary" 
                                        style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
                                        onClick={() => window.location.href = `/vagas`}
                                    >
                                        VER VAGA <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
