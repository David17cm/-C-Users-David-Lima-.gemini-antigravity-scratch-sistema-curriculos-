import { useNavigate } from 'react-router-dom';
import { Compass, UserPlus, LogIn, ChevronRight, GraduationCap, Building, ShieldCheck } from 'lucide-react';
import BrandLogo from '../components/layout/BrandLogo';

export default function LandingPage() {
    const navigate = useNavigate();

    const handleAction = (mode) => {
        navigate(`/auth?mode=${mode}`);
    };

    return (
        <div className="landing-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Background Decorativo - Amazonian Feel */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1, overflow: 'hidden', background: '#f8fafc' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(0,141,76,0.08) 0%, transparent 70%)' }}></div>
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(235,191,33,0.08) 0%, transparent 70%)' }}></div>
            </div>

            {/* Header / Logo */}
            <nav style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem', fontWeight: '900', color: 'var(--norte-dark-green)', letterSpacing: '-0.5px' }}>
                    <div style={{ background: 'var(--norte-green)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,141,76,0.3)' }}>
                        <BrandLogo size={24} color="#fff" />
                    </div>
                    <span>NORTE <span style={{ color: 'var(--norte-green)' }}>EMPREGOS</span></span>
                </div>
            </nav>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center' }}>
                    <div className="glass-panel" style={{ padding: '4rem 2rem', border: '1.5px solid var(--norte-green)', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)' }}>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: 'var(--norte-dark-green)', marginBottom: '1.5rem', lineHeight: 1.0, fontWeight: 900 }}>
                            Conectando <br />
                            <span style={{ color: 'var(--norte-green)' }}>Grandes Talentos</span>
                        </h1>
                        <p style={{ color: '#4a5568', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3.5rem', lineHeight: 1.6, fontWeight: 500 }}>
                            A plataforma definitiva da Amazônia para quem busca destaque e empresas que procuram o <span style={{ color: 'var(--norte-green)', fontWeight: 700 }}>match perfeito</span>.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                            {/* Card Login */}
                            <div className="card-hover" onClick={() => handleAction('login')} style={{ cursor: 'pointer', padding: '2.5rem', borderRadius: '24px', background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                                <div style={{ background: 'rgba(0,141,76,0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <LogIn size={30} color="var(--norte-green)" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--norte-dark-green)', fontWeight: 800 }}>JÁ TENHO LOGIN</h3>
                                <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Acesse seu painel, gerencie seu currículo ou suas vagas abertas.</p>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--norte-green)', fontWeight: '800', fontSize: '1rem' }}>
                                    ENTRAR AGORA <ChevronRight size={18} />
                                </div>
                            </div>

                            {/* Card Registro */}
                            <div className="card-hover" onClick={() => handleAction('signup')} style={{ cursor: 'pointer', padding: '2.5rem', borderRadius: '24px', background: 'var(--norte-dark-green)', border: 'none', boxShadow: '0 10px 30px rgba(0, 48, 25, 0.2)', textAlign: 'center', color: '#fff' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', width: '60px', height: '60px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                    <UserPlus size={30} color="var(--norte-green)" />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff', fontWeight: 800 }}>CRIAR CONTA</h3>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Cadastre seu currículo ou sua empresa para começar agora.</p>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--norte-green)', fontWeight: '800', fontSize: '1rem' }}>
                                    COMEÇAR GRÁTIS <ChevronRight size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Simples */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--norte-dark-green)', fontWeight: '700', fontSize: '1rem' }}>
                            <div style={{ background: 'var(--norte-green)', width: '8px', height: '8px', borderRadius: '50%' }}></div>
                            Matching Inteligente
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--norte-dark-green)', fontWeight: '700', fontSize: '1rem' }}>
                            <div style={{ background: 'var(--norte-green)', width: '8px', height: '8px', borderRadius: '50%' }}></div>
                            Currículo A4 Profissional
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '3rem 2rem', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem', background: '#fff' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'left' }}>
                    {/* Coluna: Identidade */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--norte-dark-green)', fontWeight: '900', fontSize: '1.2rem', marginBottom: '1rem' }}>
                            <BrandLogo size={24} /> Norte Empregos
                        </div>
                        <p style={{ margin: 0, lineHeight: 1.7, color: '#94a3b8' }}>
                            A maior plataforma de recrutamento e <br />
                            seleção estratégica da região Norte.
                        </p>
                    </div>

                    {/* Coluna: Legal */}
                    <div>
                        <p style={{ fontWeight: '800', color: 'var(--norte-dark-green)', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Legal</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <a href="/legal?doc=termos" style={{ color: '#64748b', textDecoration: 'none' }}>Termos de Uso</a>
                            <a href="/legal?doc=privacidade" style={{ color: '#64748b', textDecoration: 'none' }}>Privacidade</a>
                        </div>
                    </div>

                    {/* Coluna: Contato */}
                    <div>
                        <p style={{ fontWeight: '800', color: 'var(--norte-dark-green)', marginBottom: '1rem', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Suporte</p>
                        <p style={{ margin: 0, lineHeight: 1.7 }}>
                            suporte@nortevagas.online<br />
                            Santarém - Pará - Amazônia
                        </p>
                    </div>
                </div>

                <div style={{ maxWidth: '1000px', margin: '3rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9', textAlign: 'center', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ fontWeight: 600 }}>&copy; 2026 Norte Vagas. Todos os direitos reservados.</span>
                    <span style={{ background: 'var(--norte-green)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>VERSÃO 2.5 ATUALIZADA ✅</span>
                </div>
            </footer>

            <style>{`
                .card-hover {
                    transition: all 0.3s ease;
                }
                .card-hover:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 40px rgba(0, 48, 25, 0.15) !important;
                    filter: brightness(1.08);
                }
            `}</style>
        </div>
    );
}
