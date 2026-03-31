/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    // ESTADO ATÔMICO: Evita "flicker" onde o usuário aparece logado mas o loading está como false,
    // o que causava o erro falso de "Perfil não encontrado" no AuthPage.
    const [authState, setAuthState] = useState({
        user: null,
        role: null,
        loading: true,
        pago: false
    });

    const lastFetchedUserId = useRef(null);

    // ─────────────────────────────────────────────────────────────────
    // 1. Monitoramento de Sessão (Síncrono)
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            const currentUser = session?.user || null;

            if (event === 'SIGNED_OUT') {
                setAuthState({ user: null, role: null, pago: false, loading: false });
                lastFetchedUserId.current = null;
            } else {
                // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
                setAuthState(prev => ({
                    ...prev,
                    user: currentUser,
                    // Se temos um NOVO usuário, mantemos loading=true até o fetch da role terminar.
                    // Se não há usuário, liberamos o loading.
                    loading: !!currentUser && (currentUser.id !== lastFetchedUserId.current)
                }));
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // 2. Busca de Perfil/Role (Independente)
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const { user, role } = authState;
        
        // Só busca no banco se houver usuário e ele for diferente do último processado
        if (!user || user.id === lastFetchedUserId.current) return;

        let mounted = true;

        const fetchUserRole = async () => {
            lastFetchedUserId.current = user.id;

            try {
                const { data, error } = await supabase
                    .from('user_roles')
                    .select('role, pago')
                    .eq('user_id', user.id)
                    .limit(1)
                    .maybeSingle();

                if (!mounted) return;

                if (!error && data) {
                    setAuthState(prev => ({
                        ...prev,
                        role: data.role,
                        pago: data.pago ?? true,
                        loading: false
                    }));
                } else {
                    console.warn('AuthContext: Role não encontrada.', error?.message);
                    setAuthState(prev => ({ ...prev, role: null, pago: false, loading: false }));
                }
            } catch (err) {
                console.error('AuthContext: Erro ao buscar role:', err.message);
                if (mounted) {
                    setAuthState(prev => ({ ...prev, role: null, pago: false, loading: false }));
                }
            }
        };

        fetchUserRole();

        return () => { mounted = false; };
    }, [authState.user]);

    // Helpers
    const setPago = (val) => setAuthState(prev => ({ ...prev, pago: val }));

    return (
        <AuthContext.Provider value={{ ...authState, setPago }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
