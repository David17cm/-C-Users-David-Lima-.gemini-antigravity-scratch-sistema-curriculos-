import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';

/**
 * HealthCheck — Badge de status do Supabase.
 * Exibe 🟢 Online / 🟡 Lento / 🔴 Instável com base no tempo de resposta do banco.
 * Destinado apenas ao AdminDashboard.
 */
export default function HealthCheck() {
    const [status, setStatus] = useState('checking'); // 'ok' | 'slow' | 'error' | 'checking'
    const [latency, setLatency] = useState(null);

    const checkHealth = async () => {
        setStatus('checking');
        const start = Date.now();
        try {
            const { error } = await supabase
                .from('user_roles')
                .select('user_id')
                .limit(1)
                .maybeSingle();

            const elapsed = Date.now() - start;
            setLatency(elapsed);

            if (error) {
                setStatus('error');
            } else if (elapsed > 3000) {
                setStatus('slow');
            } else {
                setStatus('ok');
            }
        } catch {
            setStatus('error');
        }
    };

    useEffect(() => {
        checkHealth();
        // Re-verifica a cada 60 segundos
        const interval = setInterval(checkHealth, 60_000);
        return () => clearInterval(interval);
    }, []);

    const config = {
        ok:       { icon: '🟢', label: 'Online',   color: '#22c55e' },
        slow:     { icon: '🟡', label: 'Lento',    color: '#f59e0b' },
        error:    { icon: '🔴', label: 'Instável', color: '#ef4444' },
        checking: { icon: '⚪', label: 'Verificando...', color: '#94a3b8' },
    };

    const current = config[status];

    return (
        <div
            title={latency ? `Latência: ${latency}ms` : 'Verificando...'}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                border: `1px solid ${current.color}33`,
                background: `${current.color}11`,
                fontSize: '0.75rem',
                fontWeight: 700,
                color: current.color,
                cursor: 'pointer',
                userSelect: 'none',
            }}
            onClick={checkHealth}
        >
            {current.icon} Supabase: {current.label}
            {latency && status !== 'checking' && (
                <span style={{ opacity: 0.7, fontWeight: 400 }}>({latency}ms)</span>
            )}
        </div>
    );
}
