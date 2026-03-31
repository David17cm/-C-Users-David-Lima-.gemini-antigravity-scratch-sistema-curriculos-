
const url = 'https://bkipegygwqexxztudcuu.supabase.co/functions/v1/send-delayed-email';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJraXBlZ3lnd3FleHh6dHVkY3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NjE5MTksImV4cCI6MjA4ODUzNzkxOX0.0iN10M-751WIRSh57YeP3-JP79T8Pzwd1KpBR-0GKxM';

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': key
    },
    body: JSON.stringify({
        userEmail: 'david.oficialstm@gmail.com',
        type: 'novas_vagas'
    })
})
.then(r => r.json().then(data => ({ status: r.status, data })))
.then(({ status, data }) => {
    console.log('Status:', status);
    console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(err => {
    console.error('Error:', err);
});
