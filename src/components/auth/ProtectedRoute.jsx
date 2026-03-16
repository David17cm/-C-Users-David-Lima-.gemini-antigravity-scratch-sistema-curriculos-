import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
    // Nunca permite acesso com role indefinida — redireciona para login.
    if (!role) {
        return <Navigate to="/auth" replace />;
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
