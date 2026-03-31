const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function finishPending() {
  console.log('--- Iniciando Envio do Backlog Pendente ---');
  
  // 1. Buscar registros pendentes
  const { data: pending, error } = await supabase
    .from('notificacoes_enviadas')
    .select('id, candidato_email, tipo')
    .eq('status', 'pending');

  if (error) {
    console.error('Erro ao buscar pendentes:', error);
    return;
  }

  if (pending.length === 0) {
    console.log('Nenhum disparo pendente encontrado.');
    return;
  }

  console.log(`Encontrados ${pending.length} disparos pendentes. Iniciando processamento...`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    console.log(`[${i+1}/${pending.length}] Enviando para: ${item.candidato_email}...`);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-delayed-email', {
        body: { 
            notificationId: item.id, 
            userEmail: item.candidato_email, 
            type: item.tipo 
        }
      });

      if (!fnError) {
        success++;
      } else {
        console.error(`Falha no item ${item.id} (${item.candidato_email}):`, fnError.message);
        if (data) console.error('Resposta da Function:', data);
        fail++;
      }
    } catch (e) {
      console.error(`Erro catastrófico no item ${item.id}:`, e.message);
      fail++;
    }

    // Throttle de 150ms para evitar sobrecarga na API de e-mail
    await new Promise(res => setTimeout(res, 150));
  }

  console.log('\n--- Resultado Final ---');
  console.log(`Sucesso: ${success}`);
  console.log(`Falha: ${fail}`);
}

finishPending();
