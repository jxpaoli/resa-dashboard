/* Service Worker — prêt pour la Web Push.
 * Aujourd'hui : gère les clics sur notification.
 * Demain : l'event 'push' recevra les messages envoyés par ton backend. */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Réception d'un push (nécessite backend + VAPID pour fonctionner app fermée)
self.addEventListener('push', (event) => {
  let data = { title: 'Nouvelle réservation', body: '' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      vibrate: [120, 60, 120],
      tag: 'resa-proposee',
    })
  );
});

// Clic sur la notif → ouvre / focus la page réservations
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate('/reservations');
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('/reservations');
    })
  );
});
