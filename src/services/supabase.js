import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('As variáveis de ambiente do Supabase estão faltando!');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        // Força o token a ser gravado no localStorage (persiste entre abas e F5)
        storage: window.localStorage,
        // Garante que a sessão seja mantida mesmo após fechar e reabrir o navegador
        persistSession: true,
        // Renova o token automaticamente antes de expirar (a cada ~1h)
        autoRefreshToken: true,
        // Captura tokens de URLs (necessário para fluxos de e-mail como reset de senha)
        detectSessionInUrl: true,
    }
});
