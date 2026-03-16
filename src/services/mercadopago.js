// SEGURANÇA LOW-03: Serviço de integração com o Mercado Pago.
// Esta função DEVE ser implementada como uma Edge Function no Supabase ou em um backend dedicado.
// NUNCA coloque o Access Token do Mercado Pago no código frontend (ele viola o TOS e expõe sua conta).

export const createPreference = async (userId, userEmail) => {
    // SEGURANÇA: Garante que o mock nunca rode em produção
    if (import.meta.env.PROD) {
        throw new Error(
            '[mercadopago.js] Integração real não implementada. ' +
            'Crie uma Edge Function no Supabase para processar pagamentos com segurança. ' +
            'Nunca exponha o Access Token do Mercado Pago no frontend.'
        );
    }

    // Mock apenas para desenvolvimento local
    console.warn('[DEV ONLY] mercadopago.js: retornando preferência mockada.');
    return {
        id: 'PREF-123456-DEV',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123456'
    };
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
