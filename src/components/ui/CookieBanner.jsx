import { useState, useEffect } from 'react';
import { Cookie, X, CheckCircle2 } from 'lucide-react';

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
            width: '90%',
            maxWidth: '720px',
            zIndex: 99999,
            background: 'rgba(15, 15, 30, 0.97)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 24px rgba(0, 240, 255, 0.06)',
            animation: 'slideUp 0.4s ease',
        }}>
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>

            <Cookie size={28} color="var(--neon-blue)" style={{ flexShrink: 0 }} />

            <p style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, minWidth: '200px' }}>
                Utilizamos cookies para melhorar sua experiência na plataforma e análise de desempenho.
                Ao continuar, você concorda com a nossa{' '}
                <a href="/privacidade" target="_blank" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>
                    Política de Privacidade
                </a>
                .
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                <button
                    onClick={handleReject}
                    style={{
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'var(--text-muted)',
                        padding: '8px 18px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                    }}
                >
                    <X size={14} /> Rejeitar
                </button>
                <button
                    onClick={handleAccept}
                    className="neon-button"
                    style={{
                        margin: 0,
                        padding: '8px 20px',
                        fontSize: '0.85rem',
                        width: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    <CheckCircle2 size={14} /> Aceitar
                </button>
            </div>
        </div>
    );
}
