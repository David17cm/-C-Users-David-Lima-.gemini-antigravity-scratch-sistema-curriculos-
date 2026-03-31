const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function executeUrgente() {
  console.log('--- Iniciando Disparo Total Urgente ---');
  
  // 1. Processar os 120 pendentes de recuperação
  const { data: pending, error: pendingError } = await supabase
    .from('notificacoes_enviadas')
    .select('id, candidato_email, tipo')
    .eq('status', 'pending')
    .limit(10); // Lote pequeno para teste inicial controlado

  if (pendingError) {
    console.error('Erro ao buscar pendentes:', pendingError);
  } else if (pending.length > 0) {
    console.log(`Processando lote de ${pending.length} pendentes...`);
    for (const item of pending) {
      console.log(`Enviando recuperação para: ${item.candidato_email}...`);
      const { data, error } = await supabase.functions.invoke('send-delayed-email', {
        body: { notificationId: item.id, userEmail: item.candidato_email, type: item.tipo }
      });
      if (error) {
        console.error(`Falha no item ${item.id}:`, error.message, data);
      } else {
        console.log(`Sucesso!`);
      }
      await new Promise(r => setTimeout(r, 500)); // Delay maior para segurança do rate limit
    }
  }

  // 2. Iniciar Novas Vagas (Exemplo para os 5 primeiros candidatos)
  console.log('\n--- Iniciando Novas Vagas (Lote Teste) ---');
  const { data: candidates, error: candError } = await supabase
    .from('curriculos')
    .select('email')
    .limit(5);

  if (candError) {
    console.error('Erro ao buscar candidatos:', candError);
  } else {
    for (const cand of candidates) {
        // Verifica se já não enviamos hoje para evitar spam
        console.log(`Enviando Novas Vagas para: ${cand.email}...`);
        const { error: fnError } = await supabase.functions.invoke('send-delayed-email', {
            body: { userEmail: cand.email, type: 'novas_vagas' }
        });
        if (fnError) console.error(`Falha no candidato ${cand.email}:`, fnError.message);
        else console.log(`Sucesso!`);
        await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log('\n--- Operação Concluída ---');
}

executeUrgente();
