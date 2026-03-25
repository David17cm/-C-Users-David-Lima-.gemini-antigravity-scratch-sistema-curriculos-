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
        // SEGURANÇA CRIT-01: Role NÃO é mais lida do localStorage.
        // A fonte de verdade é sempre o banco de dados (tabela user_roles).
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user || null;
            
            // Se o usuário mudou (ou é o primeiro carregamento)
            if (currentUser?.id !== user?.id) {
                setUser(currentUser);
                
                if (currentUser) {
                    await fetchUserRole(currentUser.id);
                } else {
                    setRole(null);
                    setPago(false);
                    setLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setRole(null);
                setLoading(false);
            } else {
                // Se o usuário é o mesmo e não é logout, apenas garantimos que loading pare
                // (útil para eventos como TOKEN_REFRESHED que não mudam o ID)
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [user?.id]);

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
