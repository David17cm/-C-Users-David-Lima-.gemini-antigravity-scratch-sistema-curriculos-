import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Eye, TrendingUp, Award, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CandidateNavbar from '../components/layout/CandidateNavbar';

export default function CandidateStats() {
    const { user, pago, refreshRole } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ total: 0, viewers: [] });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const fetchStats = async () => {
        try {
            // Busca visualizações com dados da empresa vinculada
            const { data, count, error } = await supabase
                .from('candidate_views')
                .select(`
                    id,
                    viewed_at,
                    empresa:empresas (
                        razao_social,
                        cidade
                    )
                `, { count: 'exact' })
                .eq('candidato_id', user.id)
                .order('viewed_at', { ascending: false });

            if (error) throw error;

            setStats({ 
                total: count || 0, 
                viewers: data || [] 
            });
        } catch (err) {
            console.error('Erro ao buscar estatísticas:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await refreshRole();
        await fetchStats();
        setTimeout(() => setRefreshing(false), 1000);
    };

    const StatCard = ({ icon: Icon, title, value, color }) => (
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: `${color}15`, padding: '12px', borderRadius: '12px' }}>
                <Icon color={color} size={24} />
            </div>
            <div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'block' }}>{title}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--norte-dark-green)' }}>{value}</span>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '100px' }}>
            <CandidateNavbar />
            
            <div className="container" style={{ marginTop: '2rem', padding: '0 15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 700 }}>
                    <ArrowLeft size={16} /> VOLTAR
                </button>

                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--norte-dark-green)', margin: 0 }}>DESEMPENHO DO SEU PERFIL 📈</h2>
                        <p style={{ color: '#64748b', marginTop: '5px' }}>Veja como as empresas estão interagindo com seu currículo.</p>
                    </div>
                    <button 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        className="neon-button secondary" 
                        style={{ width: 'auto', margin: 0, padding: '8px 15px', fontSize: '0.8rem' }}
                    >
                        {refreshing ? 'Sincronizando...' : '🔄 Atualizar'}
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <StatCard icon={Eye} title="Visualizações Totais" value={stats.total} color="#7c3aed" />
                    <StatCard icon={TrendingUp} title="Interesse em Alta" value="+12%" color="#10b981" />
                    <StatCard icon={Award} title="Ranking de Perfil" value="Top 15%" color="#fbbf24" />
                </div>

                {!pago ? (
                    <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.9)), url("https://www.transparenttextures.com/patterns/cubes.png")' }}>
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ background: '#7c3aed15', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Lock size={30} color="#7c3aed" />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>QUER SABER QUAIS EMPRESAS TE VIRAM?</h3>
                            <p style={{ color: '#64748b', margin: '1rem 0 2rem' }}>
                                Como candidato **Premium**, você tem acesso ao detalhamento de quais empresas visualizaram seu perfil, sugestões de melhoria e muito mais.
                            </p>
                            <button 
                                onClick={() => window.open(`https://pay.cakto.com.br/fzowxw7_836819?refId=${user.id}`, '_blank')}
                                className="neon-button" 
                                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: '#fff' }}
                            >
                                DESBLOQUEAR AGORA POR R$ 7,90 🚀
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <h4 style={{ fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <BarChart3 size={20} color="var(--norte-green)" /> QUEM VIU SEU CURRÍCULO
                        </h4>
                        
                        {stats.viewers.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {stats.viewers.map((v) => (
                                    <div key={v.id} style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'rgba(0,0,0,0.02)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(0,0,0,0.05)'
                                    }}>
                                        <div>
                                            <strong style={{ display: 'block', color: 'var(--norte-dark-green)' }}>
                                                {v.empresa?.razao_social || 'Empresa em Onboarding 🏢'}
                                            </strong>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {v.empresa?.cidade || 'Localização não informada'}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--norte-green)' }}>
                                                {new Date(v.viewed_at).toLocaleDateString('pt-BR')}
                                            </span>
                                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>
                                                às {new Date(v.viewed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                <p>Nenhuma visualização registrada ainda.</p>
                                <span style={{ fontSize: '0.8rem' }}>Dica: Complete 100% do seu perfil para atrair mais empresas!</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
