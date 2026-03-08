import { useNavigate } from 'react-router-dom';
import { CircuitBoard, UserPlus, LogIn, ChevronRight, GraduationCap, Building, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    const handleAction = (mode) => {
        navigate(`/auth?mode=${mode}`);
    };

    return (
        <div className="landing-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Background Decorativo */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(0,240,255,0.07) 0%, transparent 70%)' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(181,53,246,0.07) 0%, transparent 70%)' }}></div>
            </div>

            {/* Header / Logo */}
            <nav style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--neon-blue)', letterSpacing: '2px' }}>
                    <CircuitBoard size={32} /> SISTEMA DE CURRÍCULOS PRO
                </div>
            </nav>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center' }}>
                    <div className="glass-panel" style={{ padding: '4rem 2rem', border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}>
                        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#fff', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                            Conectando <span style={{ color: 'var(--neon-blue)' }}>Talentos</span> ao <br />
                            <span style={{ color: 'var(--neon-purple)' }}>Futuro do Trabalho</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                            A plataforma definitiva para candidatos que buscam destaque e empresas que procuram excelência profissional.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                            {/* Card Login */}
                            <div className="card-hover" onClick={() => handleAction('login')} style={{ cursor: 'pointer', padding: '2.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.3s ease' }}>
                                <LogIn size={40} color="var(--neon-blue)" style={{ marginBottom: '1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>JÁ TENHO LOGIN</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Acesse seu painel administrativo, gerencie seu currículo ou suas vagas.</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--neon-blue)', fontWeight: 'bold' }}>
                                    ENTRAR AGORA <ChevronRight size={18} />
                                </div>
                            </div>

                            {/* Card Registro */}
                            <div className="card-hover" onClick={() => handleAction('signup')} style={{ cursor: 'pointer', padding: '2.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(181,53,246,0.3)', transition: 'all 0.3s ease' }}>
                                <UserPlus size={40} color="var(--neon-purple)" style={{ marginBottom: '1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>PRIMEIRO ACESSO</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Crie seu perfil profissional e tenha acesso vitalício ao ecossistema de vagas.</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--neon-purple)', fontWeight: 'bold' }}>
                                    CRIAR MINHA CONTA <ChevronRight size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Simples */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <GraduationCap size={20} /> +100 Cursos Categorizados
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <Building size={20} /> Empresas Verificadas
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            <ShieldCheck size={20} /> Acesso Vitalício Pago
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(154,140,173,0.5)', fontSize: '0.85rem' }}>
                &copy; 2026 Sistema de Currículos Pro. Desenvolvido para David Lima.
            </footer>

            <style>{`
                .card-hover:hover {
                    transform: translateY(-5px);
                    background: rgba(255,255,255,0.05) !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                }
            `}</style>
        </div>
    );
}
