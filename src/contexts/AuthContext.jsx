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
                console.error("Erro na inicialização da autenticação:", err);
                setLoading(false);
            }
        };

        const cachedRole = localStorage.getItem('user_role');
        const cachedPago = localStorage.getItem('user_pago') === 'true';
        if (cachedRole) {
            setRole(cachedRole);
            setPago(cachedPago);
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('AuthContext: Evento ->', _event);

            // Em caso de SIGN_IN, limpa o cache antigo para forçar espera da role real do banco
            if (_event === 'SIGNED_IN') {
                setRole(null);
                setPago(false);
                localStorage.removeItem('user_role');
                localStorage.removeItem('user_pago');
            }

            if (session?.user) {
                setLoading(true); // Bloqueia redirecionamentos até a role ser confirmada
                setUser(session.user);
                fetchUserRole(session.user.id);
            } else {
                localStorage.clear();
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
        const start = Date.now();
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .single();

            console.log(`AuthContext: Role carregada em ${Date.now() - start}ms`);

            if (error) {
                console.error("AuthContext: Erro da API Supabase ao buscar role:", error);
            }

            if (!error && data) {
                setRole(data.role);
                setPago(true); // Forçado true conforme solicitado anteriormente
                localStorage.setItem('user_role', data.role);
                localStorage.setItem('user_pago', 'true');
            } else {
                console.warn("AuthContext: Role não encontrada ou erro, definindo como candidato pelo fallback.");
                setRole('candidato');
                setPago(true);
                localStorage.setItem('user_role', 'candidato');
                localStorage.setItem('user_pago', 'true');
            }
        } catch (err) {
            console.error('AuthContext: Erro ao buscar role:', err);
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
