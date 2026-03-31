import dotenv from 'dotenv';
dotenv.config();

async function testManual() {
  const url = `${process.env.VITE_SUPABASE_URL}/functions/v1/send-delayed-email`;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Testing manual fetch to:', url);
  
  const payload = { 
      notificationId: 'e0b35484-82f7-44fc-a333-97b38cfeaf46', 
      userEmail: 'paulaoliveira2711@gmail.com', 
      type: 'sem_curriculo' 
  };
  
  try {
      const res = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${anonKey}`
          },
          body: JSON.stringify(payload)
      });
      
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Body:', text);
      
  } catch (err) {
      console.error('Fetch failed:', err);
  }
}

testManual();
