import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkShots() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const { data, count, error } = await supabase
    .from('notificacoes_enviadas')
    .select('*', { count: 'exact' })
    .gte('enviado_em', todayStart.toISOString());

  if (error) {
    console.error('Error fetching shots:', error);
    return;
  }

  console.log(`Foram encontrados ${count} disparos hoje.`);
  if (count > 0) {
    console.log('Últimos disparos:');
    data.slice(0, 5).forEach(shot => {
      console.log(`- ${shot.candidato_email} em ${shot.enviado_em} (Status: ${shot.status})`);
    });
  }
}

checkShots();
