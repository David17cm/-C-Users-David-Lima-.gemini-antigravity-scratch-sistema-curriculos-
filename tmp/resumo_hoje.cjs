const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const today = new Date().toISOString().split('T')[0];
  console.log('--- RESUMO DE DISPAROS HOJE ---');
  
  const { data, error } = await supabase
    .from('notificacoes_enviadas')
    .select('tipo, status, enviado_em, candidato_email')
    .gte('enviado_em', today)
    .order('enviado_em', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Mensagens encontradas hoje: ${data.length}`);
  
  const stats = data.reduce((acc, n) => {
    const key = `${n.tipo} (${n.status})`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  
  console.log('Estatísticas:', stats);
  
  if (data.length > 0) {
    console.log('\nÚltimas 3 notificações:');
    data.slice(0, 3).forEach(n => {
      console.log(`- ${n.enviado_em}: ${n.tipo} -> Status: ${n.status}`);
    });
  }

  // Verificar se há algo do tipo 'novas_vagas' em qualquer data
  const { count: totalVagas } = await supabase
    .from('notificacoes_enviadas')
    .select('*', { count: 'exact', head: true })
    .eq('tipo', 'novas_vagas');
    
  console.log(`\nTotal histórico de disparos 'novas_vagas': ${totalVagas || 0}`);
}

check();
