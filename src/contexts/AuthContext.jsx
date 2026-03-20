/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [pago, setPago] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Inicialização: Tenta carregar sessão existente imediatamente
        // SEGURANÇA CRIT-01: Role NÃO é mais lida do localStorage.
        // A fonte de verdade é sempre o banco de dados (tabela user_roles).
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserRole(session.user.id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Erro na inicialização da autenticação:', err.message);
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setLoading(true); // Bloqueia redirecionamentos até a role ser confirmada
                setUser(session.user);
                fetchUserRole(session.user.id);
            } else {
                // SEGURANÇA HIGH-03: Remoção seletiva de chaves, não localStorage.clear()
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_pago');
                setUser(null);
                setRole(null);
                setPago(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserRole = async (userId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role, pago')
                .eq('user_id', userId)
                .limit(1)
                .maybeSingle();

            if (!error && data) {
                setRole(data.role);
                setPago(data.pago ?? true);
            } else {
                // SEGURANÇA HIGH-04: Em caso de erro, NÃO conceder role por padrão.
                // Define role como null para que o ProtectedRoute bloqueie o acesso.
                console.warn('AuthContext: Role não encontrada ou erro ao buscar. Acesso bloqueado.', error?.message);
                setRole(null);
                setPago(false);
            }
        } catch (err) {
            console.error('AuthContext: Erro ao buscar role:', err.message);
            // SEGURANÇA HIGH-04: Nenhuma role em caso de exceção — seguro por padrão.
            setRole(null);
            setPago(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, pago, loading, setPago }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
