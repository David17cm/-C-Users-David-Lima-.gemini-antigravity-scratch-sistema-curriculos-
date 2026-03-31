const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function reprocessarPendentes() {
  console.log('--- Iniciando Reprocessamento de Pendentes via Brevo ---');
  
  try {
    // 1. Buscar notificações pendentes
    console.log('Passo 1: Buscando registros pendentes no banco...');
    const { data: pendentes, error: selectError } = await supabase
      .from('notificacoes_enviadas')
      .select('id, candidato_email, tipo')
      .eq('status', 'pending');
    
    if (selectError) throw selectError;
    
    if (!pendentes || pendentes.length === 0) {
      console.log('Resultado: Nenhuma notificação pendente encontrada.');
      return;
    }

    console.log(`Resultado: ${pendentes.length} notificações identificadas.`);
    console.log('Passo 2: Disparando via Edge Function...');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pendentes.length; i++) {
        const item = pendentes[i];
        process.stdout.write(`Enviando ${i + 1} de ${pendentes.length} (${item.candidato_email})... `);
        
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
              console.log('OK');
              successCount++;
            }
        } catch (e) {
            console.log('FALHA CATASTRÓFICA:', e.message);
            failCount++;
        }
        
        // Delay de 200ms para respeitar limites do Brevo grátis
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('--- Fim do Processamento ---');
    console.log(`Sucesso: ${successCount}`);
    console.log(`Falha: ${failCount}`);
    console.log(`Total Processado: ${pendentes.length}`);

  } catch (err) {
    console.error('Erro crítico:', err);
  }
}

reprocessarPendentes();
