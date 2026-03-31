import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const { count: userCount } = await supabase.from('user_roles').select('*', { count: 'exact', head: true });
  const { count: accessCount } = await supabase.from('access_logs').select('*', { count: 'exact', head: true });
  const { count: sentCount } = await supabase.from('notificacoes_enviadas').select('*', { count: 'exact', head: true });
  
  console.log(`Dados Globais:`);
  console.log(`- Total de usuários: ${userCount || 0}`);
  console.log(`- Total de logs de acesso: ${accessCount || 0}`);
  console.log(`- Total de notificações enviadas: ${sentCount || 0}`);
  
  // Ver as 5 últimas notificações independentemente da data
  const { data: lastShots } = await supabase
    .from('notificacoes_enviadas')
    .select('*')
    .order('enviado_em', { ascending: false })
    .limit(5);
    
  if (lastShots && lastShots.length > 0) {
      console.log('Últimas notificações na história:');
      lastShots.forEach(s => console.log(`- ${s.candidato_email} em ${s.enviado_em}`));
  } else {
      console.log('Nenhuma notificação encontrada em todo o histórico.');
  }
}

check();
