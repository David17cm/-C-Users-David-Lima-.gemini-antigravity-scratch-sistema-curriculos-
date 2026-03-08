import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, role, loading, pago } = useAuth();

    if (loading && !user) {
        return <div className="flex-center" style={{ color: 'var(--neon-blue)' }}>Verificando acessos...</div>;
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // Se o usuário já estiver logado mas tentar acessar a URL raiz ou login, manda pro dashboard/admin
    // (Isso será tratado no main.jsx, mas a proteção aqui garante o correto)

    // Lógica de Paywall: DESATIVADA TEMPORARIAMENTE
    // if (role === 'candidato' && !pago && window.location.pathname === '/dashboard') {
    //     return <Navigate to="/pagamento" replace />;
    // }

    // Se a rota exige roles específicos e o usuário não tem, redireciona para a home dele
    if (allowedRoles && !allowedRoles.includes(role)) {
        if (role === 'admin' || role === 'master') {
            if (window.location.pathname === '/admin') return children; // Prevenção de loop
            return <Navigate to="/admin" replace />;
        }
        if (role === 'empresa') {
            if (window.location.pathname === '/empresa') return children;
            return <Navigate to="/empresa" replace />;
        }

        // Se já estiver no dashboard e o role for candidato, não redireciona (deixa passar se o includes falhou por algum motivo de timing)
        if (role === 'candidato' && window.location.pathname === '/dashboard') return children;

        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
