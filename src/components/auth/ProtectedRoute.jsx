import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role, loading } = useAuth();

    // SEGURANÇA CRIT-02: Bloqueia SEMPRE enquanto carrega, independente de ter user ou não.
    // Isso previne o race condition onde user=true mas role=null permite acesso indevido.
    if (loading) {
        return (
            <div className="flex-center" style={{ color: 'var(--neon-blue)', minHeight: '100vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', border: '3px solid rgba(0,240,255,0.2)',
                        borderTop: '3px solid var(--neon-blue)', borderRadius: '50%',
                        animation: 'spin 1s linear infinite', margin: '0 auto 1rem'
                    }} />
                    Verificando acessos...
                </div>
            </div>
        );
    }

    // Usuário não autenticado → página de login
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // SEGURANÇA CRIT-02: role=null após loading significa erro ao buscar perfil.
    // Em vez de expulsar o usuário deslogando, mostramos um aviso.
    if (!role) {
        return (
            <div className="flex-center" style={{ color: 'var(--neon-blue)', minHeight: '100vh', padding: '2rem' }}>
                <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.4)', padding: '2rem', borderRadius: '12px', border: '1px solid #ff4444' }}>
                    <h3 style={{ color: '#ff4444', marginBottom: '1rem' }}>⚠️ Perfil não identificado</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
                        Seu usuário está conectado, mas não conseguimos confirmar seu nível de acesso (Candidato/Admin). 
                        Por favor, tente recarregar a página (F5).
                    </p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="neon-button secondary" 
                        style={{ marginTop: '1.5rem', width: 'auto' }}
                    >
                        🔄 RECARREGAR PÁGINA
                    </button>
                    <button 
                        onClick={() => supabase.auth.signOut()} 
                        style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'block', width: '100%', textDecoration: 'underline' }}
                    >
                        Sair da conta
                    </button>
                </div>
            </div>
        );
    }

    // Verifica se o role do usuário está na lista de roles permitidas para esta rota
    if (allowedRoles && !allowedRoles.includes(role)) {
        // Redireciona para o dashboard correto conforme o role real
        if (role === 'admin' || role === 'master') return <Navigate to="/admin" replace />;
        if (role === 'empresa') return <Navigate to="/empresa" replace />;
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
