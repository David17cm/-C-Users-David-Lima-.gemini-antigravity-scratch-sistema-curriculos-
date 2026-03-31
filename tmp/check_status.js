import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkStatus() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const now = new Date();
  
  console.log(`Relatório de hoje: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
  
  // 1. Mensagens Enviadas
  const { count: sentCount, error: err1 } = await supabase
    .from('notificacoes_enviadas')
    .select('*', { count: 'exact', head: true })
    .gte('enviado_em', todayStart.toISOString());

  // 2. Acessos de Hoje
  const { count: accessCount, error: err2 } = await supabase
    .from('access_logs')
    .select('*', { count: 'exact', head: true })
    .gte('accessed_at', todayStart.toISOString());

  // 3. Candidatos sem currículo que acessaram hoje (Potenciais para disparo)
  // Nota: Isso requer um join ou subquery complexa via RPC, mas podemos aproximar
  const { data: recentAccesses, error: err3 } = await supabase
    .from('access_logs')
    .select('user_id, email')
    .gte('accessed_at', todayStart.toISOString());

  const userIds = [...new Set(recentAccesses?.map(a => a.user_id) || [])];
  
  let eligibleCount = 0;
  if (userIds.length > 0) {
      const { data: curriculos, error: err4 } = await supabase
        .from('curriculos')
        .select('user_id')
        .in('user_id', userIds);
      
      const finishedUsers = new Set(curriculos?.map(c => c.user_id) || []);
      eligibleCount = userIds.filter(id => !finishedUsers.has(id)).length;
  }

  console.log(`- Disparos realizados: ${sentCount || 0}`);
  console.log(`- Total de acessos: ${accessCount || 0}`);
  console.log(`- Candidatos pendentes (alvos potenciais): ${eligibleCount}`);
  
  if (err1 || err2 || err3) {
      console.error('Erros:', { err1, err2, err3 });
  }
}

checkStatus();
