import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';

// Gera um ID de sessão único que expira se o usuário apagar os cookies/local storage.
// Ajuda a contar visitantes únicos de forma anônima e conforme à LGPD (sem usar IP).
const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem('s_tracker_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('s_tracker_id', sessionId);
    }
    return sessionId;
};

export function useTracker() {
    const location = useLocation();

    useEffect(() => {
        const trackPageView = async () => {
            try {
                // Recupera sessão anônima
                const sessionId = getOrCreateSessionId();

                // Identifica se há um usuário logado
                const { data: { session } } = await supabase.auth.getSession();
                const userId = session?.user?.id || null;

                // Salva no banco (não aguardamos a resposta para não travar a navegação)
                supabase.from('page_views').insert([{
                    session_id: sessionId,
                    path: location.pathname,
                    user_id: userId
                }]).then(({ error }) => {
                    if (error) console.error('Erro ao registrar page view:', error);
                });

            } catch (err) {
                console.error('Falha no tracker:', err);
            }
        };

        trackPageView();
    }, [location.pathname]);

    return null;
}
