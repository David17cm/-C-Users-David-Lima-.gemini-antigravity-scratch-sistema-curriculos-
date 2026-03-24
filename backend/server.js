import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Preference } from 'mercadopago';
import { MercadoPagoConfig } from 'mercadopago';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar Service Role no Backend para bypass RLS se necessário
const supabase = createClient(supabaseUrl, supabaseKey);

// Mercado Pago Setup
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});
const preference = new Preference(client);

// Rota de Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Exemplo de Rota para Mercado Pago
app.post('/api/checkout/preference', async (req, res) => {
    const { userId, userEmail, items } = req.body;

    try {
        const body = {
            items: items || [
                {
                    title: 'Plano Premium - Sistema de Currículos',
                    quantity: 1,
                    unit_price: 29.90,
                    currency_id: 'BRL'
                }
            ],
            back_urls: {
                success: `${process.env.FRONTEND_URL}/payment/success`,
                failure: `${process.env.FRONTEND_URL}/payment/failure`,
                pending: `${process.env.FRONTEND_URL}/payment/pending`
            },
            auto_return: 'approved',
            metadata: { user_id: userId, user_email: userEmail }
        };

        const response = await preference.create({ body });
        res.json({ id: response.id, init_point: response.init_point });
    } catch (error) {
        console.error('Erro MP:', error);
        res.status(500).json({ error: 'Erro ao criar preferência de pagamento' });
    }
});

// Iniciando o servidor
app.listen(port, () => {
    console.log(`Backend rodando na porta ${port}`);
});
