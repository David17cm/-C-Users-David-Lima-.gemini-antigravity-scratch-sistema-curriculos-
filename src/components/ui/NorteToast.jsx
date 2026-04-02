import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export function NorteToast({ message, type = 'info', onClose, duration = 4000 }) {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const icons = {
        success: <CheckCircle size={22} color="var(--norte-green)" />,
        error: <AlertCircle size={22} color="#ef4444" />,
        info: <Info size={22} color="var(--norte-yellow)" />
    };

    return (
        <div className="norte-toast-container">
            <div className={`norte-toast ${type}`}>
                <div style={{ flexShrink: 0 }}>
                    {icons[type] || icons.info}
                </div>
                <div style={{ flex: 1, color: '#1e293b', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 }}>
                    {message}
                </div>
                <button 
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', transition: 'color 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.color = '#475569'}
                    onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
