import { precacheAndRoute } from 'workbox-precaching';

// Precache de assets do Vite
precacheAndRoute(self.__WB_MANIFEST);

// Lógica de Recebimento de Push (Notificação Remota)
self.addEventListener('push', function(event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/vagas' // Direciona para vagas por padrão
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Lógica de Cliue na Notificação (Redirecionamento)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Abre a página de vagas ao clicar
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
