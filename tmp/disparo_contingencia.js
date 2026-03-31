const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function processarPendentes() {
  console.log('--- Iniciando Processamento de E-mails Pendentes (120) ---');
  
  try {
    // 1. Buscar registros pending
    const { data: pending, error: fetchError } = await supabase
      .from('notificacoes_enviadas')
      .select('id, candidato_email, tipo')
      .eq('status', 'pending');

    if (fetchError) throw fetchError;

    if (!pending || pending.length === 0) {
      console.log('Nenhum e-mail pendente encontrado no banco.');
      return;
    }

    console.log(`Foram encontrados ${pending.length} registros pendentes. Iniciando disparos...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        process.stdout.write(`[${i + 1}/${pending.length}] Enviando ${item.tipo} para ${item.candidato_email}... `);
        
        try {
            const { data, error: fnError } = await supabase.functions.invoke('send-delayed-email', {
                body: { 
                    notificationId: item.id, 
                    userEmail: item.candidato_email, 
                    type: item.tipo 
                }
            });
            
            if (fnError) {
              console.log('ERRO:', fnError.message);
              failCount++;
            } else {
              console.log('OK (ID: ' + (data?.data?.id || 'N/A') + ')');
              successCount++;
            }
        } catch (e) {
            console.log('FALHA CATASTRÓFICA:', e.message);
            failCount++;
        }
        
        // Pequeno intervalo para respeitar taxas de limite de API do Resend (100ms)
        await new Promise(res => setTimeout(res, 100));
    }

    console.log('--- Processamento Concluído ---');
    console.log(`Sucessos: ${successCount}`);
    console.log(`Falhas: ${failCount}`);
    console.log(`Total: ${pending.length}`);

  } catch (err) {
    console.error('Erro crítico no script:', err);
  }
}

processarPendentes();
