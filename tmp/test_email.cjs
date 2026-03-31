const url = 'https://bkipegygwqexxztudcuu.supabase.co/functions/v1/send-delayed-email';
const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJraXBlZ3lnd3FleHh6dHVkY3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjE5MTksImV4cCI6MjA4ODUzNzkxOX0.0iN10M-751WIRSh57YeP3-JP79T8Pzwd1KpBR-0GKxM';

const data = {
  userEmail: 'david.oficialstm@gmail.com',
  type: 'sem_curriculo'
};

async function testEmail() {
  console.log('Enviando e-mail de teste para david.oficialstm@gmail.com...');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apikey
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resultado:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testEmail();
