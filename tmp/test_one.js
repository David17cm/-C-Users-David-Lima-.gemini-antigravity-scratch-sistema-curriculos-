import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testOne() {
  const { data: list } = await supabase.from('notificacoes_enviadas')
    .select('id, candidato_email')
    .eq('status', 'pending')
    .limit(1);
    
  if (!list || list.length === 0) {
      console.log('No pending notifications found.');
      return;
  }
  
  const item = list[0];
  console.log('Testing one:', item.id, item.candidato_email);
  
  try {
      const response = await supabase.functions.invoke('send-delayed-email', {
          body: { 
              notificationId: item.id, 
              userEmail: item.candidato_email, 
              type: 'sem_curriculo' 
          }
      });
      
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      console.log('Response error:', JSON.stringify(response.error, null, 2));
      
  } catch (err) {
      console.error('Invocação falhou:', err);
  }
}

testOne();
