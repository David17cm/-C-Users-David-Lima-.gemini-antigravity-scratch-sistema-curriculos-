import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`--- Resumo de Disparos em ${today} ---`);

  // Buscar todos de hoje
  const { data, error } = await supabase
    .from('notificacoes_enviadas')
    .select('tipo, status, enviado_em')
    .gte('enviado_em', today);

  if (error) {
    console.error('Erro:', error);
    return;
  }

  const summary = data.reduce((acc, n) => {
    const key = `${n.tipo} [${n.status}]`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('Resumo por Tipo e Status:');
  console.log(JSON.stringify(summary, null, 2));

  // Verificar especificamente 'novas_vagas'
  const { count, error: countError } = await supabase
    .from('notificacoes_enviadas')
    .select('*', { count: 'exact', head: true })
    .eq('tipo', 'novas_vagas')
    .gte('enviado_em', today);

  if (countError) console.error('Erro novas_vagas:', countError);
  else console.log(`\nDisparos 'novas_vagas' hoje: ${count}`);

  const { data: lastFive } = await supabase
    .from('notificacoes_enviadas')
    .select('*')
    .order('enviado_em', { ascending: false })
    .limit(5);

  console.log('\nÚltimos 5 registros:');
  lastFive?.forEach(n => {
     console.log(`- ${n.enviado_em}: ${n.tipo} (${n.status}) -> ${n.candidato_email || 'n/a'}`);
  });
}

check();
