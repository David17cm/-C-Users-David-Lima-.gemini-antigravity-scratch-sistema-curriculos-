import { useNavigate } from 'react-router-dom';
import { Star, Rocket, Check, ArrowRight, ShieldCheck, Zap, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CandidateNavbar from '../components/layout/CandidateNavbar';
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export default function PremiumOfferPage() {
    const navigate = useNavigate();
    const { user, pago } = useAuth();
    const [profilePhoto, setProfilePhoto] = useState(null);

    useEffect(() => {
        if (pago) {
            navigate('/vagas'); 
            return;
        }
        if (user) {
            fetchProfile();
        }
    }, [user, pago]);

    const fetchProfile = async () => {
        const { data } = await supabase.from('curriculos').select('foto_url').eq('user_id', user.id).maybeSingle();
        if (data) setProfilePhoto(data.foto_url);
    };

    const benefits = [
        { icon: TrendingUp, title: "Modelos de Currículo Diferentes", desc: "Aumente suas chances com layouts profissionais exclusivos." },
        { icon: ShieldCheck, title: "Métricas de Visualização", desc: "Saiba exatamente quem viu seu currículo e quando." },
        { icon: Zap, title: "Selo de Perfil Completo", desc: "Ganhe destaque visual e credibilidade imediata com as empresas." },
        { icon: Clock, title: "PDF para Download", desc: "Baixe seu currículo em PDF de alta qualidade a qualquer hora." },
        { icon: TrendingUp, title: "Alertas Inteligentes", desc: "Receba notificações prioritárias de vagas que dão match perfeito." },
        { icon: ShieldCheck, title: "Checklist de Melhoria", desc: "Receba dicas personalizadas para deixar seu perfil imbatível." }
    ];

    const handleCaktosRedirect = () => {
        window.open(`https://pay.cakto.com.br/fzowxw7_836819?refId=${user.id}`, '_blank');
    };
    return (
        <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
            <CandidateNavbar profilePhoto={profilePhoto} />
            
            <div style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '650px', margin: '0 auto', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
                
                {/* 🚀 Momento Pós-Wizard */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ 
                        fontSize: window.innerWidth < 768 ? '2.2rem' : '3.5rem', 
                        fontWeight: 900, 
                        color: '#1e40af', 
                        lineHeight: 1,
                        marginBottom: '0.75rem',
                        letterSpacing: '-0.05em'
                    }}>
                        🚀 Seu currículo está pronto!
                    </h1>
                    <p style={{ 
                        fontSize: '1.15rem', 
                        color: '#64748b', 
                        fontWeight: 500,
                        lineHeight: 1.4,
                        marginBottom: '1.5rem'
                    }}>
                        Agora você já pode começar a se candidatar.
                    </p>

                    <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '16px', border: '1px solid #fde68a', textAlign: 'left' }}>
                        <p style={{ margin: 0, color: '#92400e', fontWeight: 700, fontSize: '1rem', lineHeight: 1.4 }}>
                            💡 Mas aqui vai um detalhe importante: <span style={{ fontWeight: 800 }}>perfis profissionais chamam mais atenção das empresas</span> quando têm o selo de verificação.
                        </p>
                    </div>
                </div>

                {/* 📊 5. MOSTRAR BENEFÍCIO (VISUAL SIMPLIFICADO) */}
                <div style={{ 
                    background: '#f8fafc', 
                    borderRadius: '24px', 
                    padding: '1.5rem', 
                    marginBottom: '2rem',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                            <span style={{ color: '#22c55e', fontSize: '1.4rem' }}>✔</span> Mais visibilidade
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                            <span style={{ color: '#22c55e', fontSize: '1.4rem' }}>✔</span> Perfil profissional
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                            <span style={{ color: '#22c55e', fontSize: '1.4rem' }}>✔</span> Mais chances de contratação
                        </div>
                    </div>
                </div>

                {/* 🔥 3. FOCO NO BOTÃO (NARANJA E GRANDE) */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '1rem', textDecoration: 'line-through', margin: '0 0 4px 0', fontWeight: 600 }}>
                            De R$ 29,90
                        </p>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            HOJE apenas R$ 7,90
                        </h2>
                        <p style={{ color: '#22c55e', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                            Economize 80%
                        </p>
                    </div>

                    <button 
                        onClick={handleCaktosRedirect}
                        style={{ 
                            width: '100%',
                            background: '#f97316', 
                            color: '#fff',
                            border: 'none',
                            padding: '24px',
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            borderRadius: '24px',
                            cursor: 'pointer',
                            boxShadow: '0 20px 40px rgba(249, 115, 22, 0.3)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        ATIVAR POR R$ 7,90 <Rocket size={24} />
                    </button>
                    
                    <button 
                        onClick={() => navigate('/vagas')}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: '#94a3b8', 
                            padding: '20px', 
                            marginTop: '1rem',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                        }}
                    >
                        Não, prefiro continuar sem destaque
                    </button>
                </div>

                {/* Social Proof Simples */}
                <div style={{ marginTop: '5rem', borderTop: '1px solid #f1f5f9', paddingTop: '2rem', textAlign: 'center', opacity: 0.6 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <ShieldCheck size={18} /> PAGAMENTO SEGURO VIA CAKTO
                    </p>
                </div>
            </div>
        </div>
    );
}
