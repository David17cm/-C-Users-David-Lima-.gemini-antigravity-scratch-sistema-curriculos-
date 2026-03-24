import { useState, useEffect } from 'react';
import { Cookie, CheckCircle2 } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'cookie_consent_status';

export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const status = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!status) setVisible(true);
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setVisible(false);
    };

    const handleReject = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '94%',
            maxWidth: '800px',
            zIndex: 99999,
            background: 'rgba(10, 10, 20, 0.8)',
            border: '1px solid rgba(0, 240, 255, 0.15)',
            borderRadius: '24px',
            padding: '1.25rem 2rem',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 240, 255, 0.05)',
            animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(30px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                .cookie-btn-reject:hover {
                    background: rgba(255, 255, 255, 0.05) !important;
                    border-color: rgba(255, 255, 255, 0.3) !important;
                }
            `}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 300px' }}>
                <div style={{ 
                    background: 'rgba(0, 240, 255, 0.1)', 
                    padding: '10px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid rgba(0, 240, 255, 0.2)'
                }}>
                    <Cookie size={24} color="#00f0ff" />
                </div>
                <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                    Valorizamos sua privacidade. Utilizamos cookies para otimizar sua experiência e analisar o tráfego da plataforma.
                    Ao continuar, você aceita nossa{' '}
                    <a href="/privacidade" target="_blank" style={{ color: '#00f0ff', textDecoration: 'none', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', fontWeight: '500' }}>
                        Política de Privacidade
                    </a>.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, alignItems: 'center' }}>
                <button
                    onClick={handleReject}
                    className="cookie-btn-reject"
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        padding: '10px 20px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                    }}
                >
                    Recusar
                </button>
                <button
                    onClick={handleAccept}
                    style={{
                        background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(124, 58, 237, 0.3)';
                    }}
                >
                    <CheckCircle2 size={16} /> Aceitar Tudo
                </button>
            </div>
        </div>
    );

}
