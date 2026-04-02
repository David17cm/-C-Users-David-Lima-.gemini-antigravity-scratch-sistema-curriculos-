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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', fontWeight: '900', color: 'var(--norte-dark-green)', letterSpacing: '1px' }}>
                    <BrandLogo size={32} /> NORTE EMPREGOS
                </div>
            </nav>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ maxWidth: '900px', width: '100%', textAlign: 'center' }}>
                    <div className="glass-panel" style={{ padding: '4rem 2rem', border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 0 40px rgba(0,0,0,0.3)' }}>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: 'var(--norte-dark-green)', marginBottom: '1.5rem', lineHeight: 1.1, fontWeight: 900 }}>
                            <span style={{ color: 'var(--norte-green)' }}>Norte</span> <br />
                            Empregos
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                            A plataforma definitiva para candidatos que buscam destaque e empresas que procuram excelência profissional.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                            {/* Card Login */}
                            <div className="card-hover" onClick={() => handleAction('login')} style={{ cursor: 'pointer', padding: '2.5rem', borderRadius: '20px', background: '#fff', border: '1px solid #e2e8f0', transition: 'all 0.3s ease' }}>
                                <LogIn size={40} color="var(--norte-green)" style={{ marginBottom: '1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--norte-dark-green)' }}>JÁ TENHO LOGIN</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Acesse seu painel, gerencie seu currículo ou vagas.</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--norte-green)', fontWeight: '800' }}>
                                    ENTRAR AGORA <ChevronRight size={18} />
                                </div>
                            </div>

                            {/* Card Registro */}
                            <div className="card-hover" onClick={() => handleAction('signup')} style={{ cursor: 'pointer', padding: '2.5rem', borderRadius: '20px', background: '#fff', border: '2px solid var(--norte-yellow)', transition: 'all 0.3s ease' }}>
                                <UserPlus size={40} color="var(--norte-yellow)" style={{ marginBottom: '1.5rem' }} />
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--norte-dark-green)' }}>PRIMEIRO ACESSO</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Crie seu perfil profissional e tenha acesso vitalício ao ecossistema de vagas.</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--norte-dark-green)', fontWeight: '800' }}>
                                    CRIAR MINHA CONTA <ChevronRight size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Simples */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--norte-teal)', fontWeight: '600', fontSize: '0.95rem' }}>
                            <GraduationCap size={20} /> +100 Cursos Categorizados
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--norte-teal)', fontWeight: '600', fontSize: '0.95rem' }}>
                            <Building size={20} /> Empresas Verificadas
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '2.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.07)', color: 'rgba(154,140,173,0.5)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', textAlign: 'left' }}>
                    {/* Coluna: Identidade */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--norte-green)', fontWeight: '900', fontSize: '1rem', marginBottom: '0.75rem' }}>
                            <BrandLogo size={20} /> Norte Empregos
                        </div>
                        <p style={{ margin: 0, lineHeight: 1.7 }}>
                            CNPJ: 00.000.000/0001-00<br />
                            Endereço: Rua Exemplo, 123, Centro<br />
                            Cidade - UF, CEP 00000-000
                        </p>
                    </div>

                    {/* Coluna: Legal */}
                    <div>
                        <p style={{ fontWeight: 'bold', color: 'rgba(154,140,173,0.8)', marginBottom: '0.75rem', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Legal</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <a href="/legal?doc=termos" style={{ color: 'rgba(154,140,173,0.6)', textDecoration: 'none' }}>Termos de Uso</a>
                            <a href="/legal?doc=privacidade" style={{ color: 'rgba(154,140,173,0.6)', textDecoration: 'none' }}>Política de Privacidade</a>
                        </div>
                    </div>

                    {/* Coluna: Contato */}
                    <div>
                        <p style={{ fontWeight: 'bold', color: 'rgba(154,140,173,0.8)', marginBottom: '0.75rem', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Contato</p>
                        <p style={{ margin: 0, lineHeight: 1.7 }}>
                            suporte@norteempregos.com.br<br />
                            Responsável pelos dados (DPO):<br />
                            dpo@norteempregos.com.br
                        </p>
                    </div>
                </div>

                <div style={{ maxWidth: '900px', margin: '2rem auto 0', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    &copy; 2026 Norte Empregos. Todos os direitos reservados.
                </div>
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
