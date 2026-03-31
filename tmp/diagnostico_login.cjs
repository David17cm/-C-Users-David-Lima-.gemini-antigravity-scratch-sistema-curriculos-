const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  const email = 'admin@gmail.com';
  console.log(`--- Verificando usuário: ${email} ---`);
  
  // Como não temos acesso fácil à auth.users via anon key (precisa de service role),
  // vamos procurar nos logs de acesso ou tentar buscar a role via RPC se houver, 
  // ou simplesmente listar as roles.
  
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');

  if (rolesError) {
    console.error('Erro ao buscar roles:', rolesError);
  } else {
    console.log('Total de roles encontradas:', roles.length);
    // Tenta encontrar a role do admin@gmail.com cruzando com curriculos ou access_logs
    const { data: log } = await supabase.from('access_logs').select('user_id').eq('email', email).limit(1).maybeSingle();
    
    if (log) {
      const userRole = roles.find(r => r.user_id === log.user_id);
      console.log(`Role para ${email} (ID: ${log.user_id}):`, userRole || 'NÃO ENCONTRADA');
    } else {
      console.log(`Nenhum log de acesso encontrado para ${email}.`);
    }
  }
}

check();
