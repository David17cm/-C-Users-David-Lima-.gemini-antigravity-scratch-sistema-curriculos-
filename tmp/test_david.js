import dotenv from 'dotenv';
dotenv.config();

async function testDavid() {
  const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/send-delayed-email`;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  const payload = { 
      notificationId: '26819aff-950c-44fa-ba44-41b050f736a8', 
      userEmail: 'david.oficialstm@gmail.com', 
      type: 'sem_curriculo' 
  };
  
  console.log('Enviando teste para David:', payload.userEmail);
  
  try {
      const res = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`
          },
          body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      console.log('Status:', res.status);
      console.log('Response:', data);
      
  } catch (err) {
      console.error('Falha no teste:', err);
  }
}

testDavid();
