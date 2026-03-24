import { api } from './api';

export const createPreference = async (userId, userEmail) => {
    try {
        const data = await api.post('/api/checkout/preference', { userId, userEmail });
        return data;
    } catch (error) {
        console.error('[mercadopago.js] Erro ao criar preferência:', error);
        throw error;
    }
};

// === COMO IMPLEMENTAR EM PRODUÇÃO ===
// 
// 1. Crie uma Edge Function no Supabase:
//    supabase functions new create-payment-preference
//
// 2. Na Edge Function, use o SDK do Mercado Pago com o Access Token via secrets:
//    import MercadoPago from 'npm:mercadopago';
//    const mp = new MercadoPago({ accessToken: Deno.env.get('MP_ACCESS_TOKEN') });
//    const preference = await mp.preferences.create({ ... });
//
// 3. Configure o secret no Supabase:
//    supabase secrets set MP_ACCESS_TOKEN=APP_USR-xxxxx
//
// 4. No frontend, substitua esta função por:
//    const { data, error } = await supabase.functions.invoke('create-payment-preference', {
//        body: { userId, userEmail }
//    });
