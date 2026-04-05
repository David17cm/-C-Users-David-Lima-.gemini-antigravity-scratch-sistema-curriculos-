/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

// ─────────────────────────────────────────────────────────────────
// Chave do cache de sessão (sessionStorage — dura até fechar o aba)
// ─────────────────────────────────────────────────────────────────
const ROLE_CACHE_KEY = 'norte_user_role_cache';

const saveRoleCache = (userId, role, pago, vip_vagas) => {
    try {
        localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify({ userId, role, pago, vip_vagas, ts: Date.now() }));
    } catch (_) { /* Ignora erros de storage (modo privado etc.) */ }
};


const loadRoleCache = (userId) => {
    try {
        const raw = localStorage.getItem(ROLE_CACHE_KEY);
        if (!raw) return null;
        const cache = JSON.parse(raw);
        // Cache válido por até 20 minutos — cobre instabilidade de rede de celular
        const TWENTY_MIN = 20 * 60 * 1000;
        if (cache.userId === userId && Date.now() - cache.ts < TWENTY_MIN) {
            return { role: cache.role, pago: cache.pago, vip_vagas: cache.vip_vagas };
        }
    } catch (_) { /* Ignora */ }
    return null;
};


const clearRoleCache = () => {
    try { localStorage.removeItem(ROLE_CACHE_KEY); } catch (_) { /* Ignora */ }
};


// ─────────────────────────────────────────────────────────────────
// Retry com backoff exponencial (adaptado para Wi-Fi e 4G/5G)
// Tentativas: imediata → 800ms → 2s → 4s
// ─────────────────────────────────────────────────────────────────
const fetchWithRetry = async (userId, maxRetries = 3) => {
    const delays = [0, 800, 2000, 4000];
    let lastErr = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (attempt > 0) {
            await new Promise(res => setTimeout(res, delays[attempt] ?? 4000));
        }

        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role, pago, vip_vagas')
                .eq('user_id', userId)
                .maybeSingle();

            if (error) {
                lastErr = error;
                continue; // Tenta de novo
            }

            return { data, error: null };
        } catch (err) {
            lastErr = err;
        }
    }

    return { data: null, error: lastErr };
};

export const AuthProvider = ({ children }) => {
    // ESTADO ATÔMICO: Evita "flicker" onde o usuário aparece logado mas o loading está como false,
    // o que causava o erro falso de "Perfil não encontrado" no AuthPage.
    const [authState, setAuthState] = useState({
        user: null,
        role: null,
        loading: true,
        pago: false,
        vip_vagas: false
    });

    const lastFetchedUserId = useRef(null);
    const isFetchingRole = useRef(false);

    // ─────────────────────────────────────────────────────────────────
    // 1. Monitoramento de Sessão (Síncrono)
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!mounted) return;

            const currentUser = session?.user || null;

            if (event === 'SIGNED_OUT') {
                clearRoleCache();
                setAuthState({ user: null, role: null, pago: false, vip_vagas: false, loading: false });
                lastFetchedUserId.current = null;
                isFetchingRole.current = false;
            } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
                // Checa se o role já está em cache (evita dependência da rede no F5)
                const cached = currentUser ? loadRoleCache(currentUser.id) : null;
                if (cached && currentUser?.id === lastFetchedUserId.current) {
                    // Já processado e cacheado: apenas atualiza o user sem resetar o loading
                    setAuthState(prev => ({ ...prev, user: currentUser }));
                } else {
                    setAuthState(prev => ({
                        ...prev,
                        user: currentUser,
                        // Se o usuário mudou, mantemos loading: true até o useEffect da role processar.
                        loading: currentUser ? (currentUser.id !== lastFetchedUserId.current) : false
                    }));
                }
            } else if (event === 'PASSWORD_RECOVERY') {
                // Durante a recuperação de senha, o Supabase nos loga automaticamente.
                // Forçamos o redirecionamento para garantir que o usuário caia na página de Reset.
                if (window.location.pathname !== '/reset-password') {
                    window.location.href = `${window.location.origin}/reset-password${window.location.hash}`;
                }
            }
        });

        return () => {
            mounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    // ─────────────────────────────────────────────────────────────────
    // 2. Busca de Perfil/Role com Retry + Cache
    // ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const { user } = authState;

        // Só busca no banco se houver usuário novo, diferente do último processado,
        // e se não houver uma busca já em andamento.
        if (!user || user.id === lastFetchedUserId.current || isFetchingRole.current) return;

        // Verifica o cache antes de ir ao banco (ideal para recarregamentos com rede instável)
        const cached = loadRoleCache(user.id);
        if (cached) {
            lastFetchedUserId.current = user.id;
            setAuthState(prev => ({
                ...prev,
                role: cached.role,
                pago: cached.pago ?? false,
                vip_vagas: cached.vip_vagas ?? false,
                loading: false
            }));
            return;
        }

        let mounted = true;
        isFetchingRole.current = true;

        const fetchUserRole = async () => {
            lastFetchedUserId.current = user.id;

            const { data, error } = await fetchWithRetry(user.id, 3);

            if (!mounted) return;

            if (!error && data) {
                saveRoleCache(user.id, data.role, data.pago ?? false, data.vip_vagas ?? false);
                setAuthState(prev => ({
                    ...prev,
                    role: data.role,
                    pago: data.pago ?? false,
                    vip_vagas: data.vip_vagas ?? false,
                    loading: false
                }));
            } else if (!error && !data) {
                // Usuário autenticado mas sem role — fallback como candidato
                saveRoleCache(user.id, 'candidato', false, false);
                setAuthState(prev => ({
                    ...prev,
                    role: 'candidato',
                    pago: false,
                    vip_vagas: false,
                    loading: false
                }));
            } else {
                // Todas as tentativas falharam (rede muito ruim ou servidor fora)
                setAuthState(prev => ({ ...prev, role: null, pago: false, vip_vagas: false, loading: false }));
            }

            isFetchingRole.current = false;
        };

        fetchUserRole();

        return () => { mounted = false; };
    }, [authState.user]);

    // ─────────────────────────────────────────────────────────────────
    // 3. refreshRole: Permite que o ProtectedRoute tente novamente
    //    sem recarregar a página (essencial em conexões de celular instáveis)
    // ─────────────────────────────────────────────────────────────────
    const refreshRole = useCallback(async () => {
        const { user } = authState;
        if (!user || isFetchingRole.current) return;

        clearRoleCache();
        isFetchingRole.current = true;

        setAuthState(prev => ({ ...prev, loading: true, role: null }));
        lastFetchedUserId.current = null; // força rebusca no useEffect

        const { data, error } = await fetchWithRetry(user.id, 3);

        if (!error && data) {
            saveRoleCache(user.id, data.role, data.pago ?? false, data.vip_vagas ?? false);
            setAuthState(prev => ({
                ...prev,
                role: data.role,
                pago: data.pago ?? false,
                vip_vagas: data.vip_vagas ?? false,
                loading: false
            }));
            lastFetchedUserId.current = user.id;
        } else if (!error && !data) {
            saveRoleCache(user.id, 'candidato', false, false);
            setAuthState(prev => ({ ...prev, role: 'candidato', pago: false, vip_vagas: false, loading: false }));
            lastFetchedUserId.current = user.id;
        } else {
            setAuthState(prev => ({ ...prev, role: null, pago: false, vip_vagas: false, loading: false }));
        }

        isFetchingRole.current = false;
    }, [authState]);

    // Helpers
    const setPago = (val) => setAuthState(prev => ({ ...prev, pago: val }));

    return (
        <AuthContext.Provider value={{ ...authState, setPago, refreshRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
