import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.error('Falha ao inicializar Supabase Client', e);
    }
}

// Rota de Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(), 
        environment: 'vercel',
        config: {
            supabase: !!supabase,
            frontend_url: !!process.env.FRONTEND_URL
        }
    });
});

// Exportar o app para a Vercel
export default app;
