import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, Eye, TrendingUp, Award, ArrowLeft, Lock, Crown, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CandidateNavbar from '../components/layout/CandidateNavbar';

export default function CandidateStats() {
    const { user, pago, vip_vagas, refreshRole } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ total: 0, viewers: [] });
    const [loading, setLoading] = useState(true);
    const [showVipModal, setShowVipModal] = useState(false);
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

                {/* SEÇÃO GRUPO VIP (ABACATEPAY) - OCULTO PARA REMOVER VENDA DIRETA 
                <div className="glass-panel" style={{ 
                    padding: '1.5rem 2rem', 
                    marginBottom: '2rem', 
                    background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
                    color: '#fff',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <Crown color="#fbbf24" fill="#fbbf24" size={24} />
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>GRUPO VIP DE VAGAS 💎</h3>
                        </div>
                        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem', maxWidth: '500px' }}>
                            Receba vagas exclusivas e antecipadas direto no seu celular.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', position: 'relative', zIndex: 2 }}>
                        <button 
                            onClick={() => setShowVipModal(true)}
                            style={{ 
                                background: 'rgba(255,255,255,0.1)', 
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                padding: '10px 20px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            VER VANTAGENS
                        </button>
                        
                        {!vip_vagas ? (
                            <button 
                                onClick={() => window.open(`https://app.abacatepay.com/pay/bill_ybBYnqhHP5RXJEpU3mAr34SL?userId=${user.id}`, '_blank')}
                                className="neon-button"
                                style={{ 
                                    background: '#fbbf24', 
                                    color: '#064e3b', 
                                    width: 'auto', 
                                    margin: 0, 
                                    padding: '10px 25px',
                                    fontWeight: 900,
                                    fontSize: '0.85rem',
                                    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
                                }}
                            >
                                QUERO ENTRAR AGORA 🚀
                            </button>
                        ) : (
                            <button 
                                onClick={() => window.open('https://chat.whatsapp.com/LAjyH1ZoYil9vofahhNaLw', '_blank')}
                                className="neon-button"
                                style={{ 
                                    background: '#10b981', 
                                    color: '#fff', 
                                    width: 'auto', 
                                    margin: 0, 
                                    padding: '10px 25px',
                                    fontWeight: 900,
                                    fontSize: '0.85rem'
                                }}
                            >
                                ACESSAR GRUPO VIP ✅
                            </button>
                        )}
                    </div>

                    <Zap size={120} style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1, color: '#fff' }} />
                </div>
                */}

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

            {/* MODAL DE VANTAGENS VIP */}
            {showVipModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div className="glass-panel" style={{ 
                        maxWidth: '500px', width: '100%', padding: '2rem',
                        position: 'relative', animation: 'modalSlideUp 0.3s ease-out'
                    }}>
                        <button 
                            onClick={() => setShowVipModal(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        >
                            <Lock size={20} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: '#ecfdf5', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Crown size={36} color="#059669" fill="#059669" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#064e3b' }}>VANTAGENS DO GRUPO VIP 💎</h2>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Aumente drasticamente suas chances de contratação.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
                            {[
                                { icon: '🔥', title: 'Vagas Antecipadas VIP', desc: 'Receba as vagas no seu celular antes de serem publicadas no site.' },
                                { icon: '🚀', title: 'Acesso Prioritário', desc: 'Tenha o link direto para se candidatar antes de todo mundo.' },
                                { icon: '💎', title: 'Grupo VIP Norte Vagas', desc: 'Acesso exclusivo ao grupo onde o RH busca os primeiros candidatos.' }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '15px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{item.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!vip_vagas ? (
                            <button 
                                onClick={() => window.open(`https://abacatepay.com/pay/prod_hRLXMt3FuEGs5kDMKEr0zBAx?userId=${user.id}`, '_blank')}
                                className="neon-button"
                                style={{ background: 'var(--norte-green)', color: '#fff', fontWeight: 900 }}
                            >
                                QUERO MEU ACESSO VIP AGORA 🚀
                            </button>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7' }}>
                                <CheckCircle2 color="#10b981" style={{ marginBottom: '8px' }} />
                                <p style={{ margin: 0, color: '#166534', fontWeight: 700 }}>Você já é um membro VIP! 🎉</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
