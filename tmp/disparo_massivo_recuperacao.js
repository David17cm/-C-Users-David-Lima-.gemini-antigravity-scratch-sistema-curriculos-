import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function realizarDisparoMassivo() {
  console.log('--- Iniciando Disparo Massivo de Recuperação ---');
  
  try {
    // 1. Chamar a RPC para identificar alvos e criar registros de notificação
    console.log('Passo 1: Identificando alvos via RPC...');
    const { data: list, error: rpcError } = await supabase.rpc('preparar_notificacoes_recuperacao_total');
    
    if (rpcError) throw rpcError;
    
    if (!list || list.length === 0) {
      console.log('Resultado: Nenhum candidato pendente encontrado para o disparo.');
      return;
    }

    console.log(`Resultado: ${list.length} candidatos identificados.`);
    console.log('Passo 2: Processando envios individuais...');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        process.stdout.write(`Enviando ${i + 1} de ${list.length} (${item.user_email})... `);
        
        try {
            const { error: fnError } = await supabase.functions.invoke('send-delayed-email', {
                body: { 
                    notificationId: item.notification_id, 
                    userEmail: item.user_email, 
                    type: 'sem_curriculo' 
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
        
        // Pequeno delay para evitar overload (throttle) de 100ms
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('--- Fim do Disparo ---');
    console.log(`Sucesso: ${successCount}`);
    console.log(`Falha: ${failCount}`);
    console.log(`Total Processado: ${list.length}`);

  } catch (err) {
    console.error('Erro crítico no processo de disparo:', err);
  }
}

realizarDisparoMassivo();
