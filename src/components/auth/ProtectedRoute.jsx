import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role, loading, refreshRole } = useAuth();
    const [retrying, setRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [retryFailed, setRetryFailed] = useState(false);

    // Função que aciona o refreshRole sem recarregar a página
    const handleRetry = async () => {
        setRetrying(true);
        setRetryFailed(false);
        setRetryCount(c => c + 1);

        try {
            await refreshRole();
        } catch (_) {
            setRetryFailed(true);
        } finally {
            setRetrying(false);
        }
    };

    // SEGURANÇA CRIT-02: Bloqueia SEMPRE enquanto carrega, independente de ter user ou não.
    if (loading || retrying) {
        return (
            <div className="flex-center" style={{ color: 'var(--neon-blue)', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '3px solid rgba(0,240,255,0.2)',
                        borderTop: '3px solid var(--neon-blue)', borderRadius: '50%',
                        animation: 'spin 1s linear infinite', margin: '0 auto 1rem'
                    }} />
                    {retrying
                        ? `Tentando novamente... (${retryCount}ª tentativa)`
                        : 'Verificando acessos...'
                    }
                </div>
            </div>
        );
    }

    // Usuário não autenticado → página de login
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // role=null após loading e retentativas → problema de conectividade
    if (!role) {
        return (
            <div className="flex-center" style={{ color: 'var(--neon-blue)', minHeight: '100vh', padding: '2rem' }}>
                <div style={{
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '2rem',
                    borderRadius: '12px',
                    border: '1px solid #ff4444',
                    maxWidth: '440px',
                    width: '100%'
                }}>
                    <h3 style={{ color: '#ff4444', marginBottom: '1rem' }}>⚠️ Perfil não identificado</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Seu usuário está conectado, mas não conseguimos confirmar seu nível de acesso.
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Isso pode acontecer em redes de celular (4G/5G) ou Wi-Fi instável.
                        Clique em <strong>"Tentar Novamente"</strong> — o sistema vai tentar 3 vezes automaticamente.
                    </p>

                    {retryFailed && (
                        <p style={{ color: '#ffaa00', fontSize: '0.85rem', margin: '0.75rem 0 0' }}>
                            ⚠️ Não foi possível recuperar o perfil após {retryCount} tentativa(s). Conecte-se a uma rede melhor ou recarregue a página.
                        </p>
                    )}

                    <button
                        id="btn-retry-role"
                        onClick={handleRetry}
                        className="neon-button secondary"
                        style={{ marginTop: '1.5rem', width: 'auto' }}
                    >
                        🔄 Tentar Novamente
                    </button>

                    <button
                        id="btn-force-reload"
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '0.75rem',
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'block',
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem'
                        }}
                    >
                        Recarregar Página (F5)
                    </button>

                    <button
                        id="btn-signout-fallback"
                        onClick={() => supabase.auth.signOut()}
                        style={{
                            marginTop: '0.5rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'block',
                            width: '100%',
                            textDecoration: 'underline',
                            fontSize: '0.8rem'
                        }}
                    >
                        Sair da conta
                    </button>
                </div>
            </div>
        );
    }

    // Verifica se o role do usuário está na lista de roles permitidas para esta rota
    if (allowedRoles && !allowedRoles.includes(role)) {
        if (role === 'admin' || role === 'master') return <Navigate to="/admin" replace />;
        if (role === 'empresa') return <Navigate to="/empresa" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
