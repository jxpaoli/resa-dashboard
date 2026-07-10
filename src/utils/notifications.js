// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------
// Deux niveaux, dégradation propre :
//   1. Toast in-app (toujours dispo) → géré par ToastContext.
//   2. Notification système via service worker (Web Push) si permission OK.
//
// La VRAIE Web Push (notifs app fermée) nécessitera en plus :
//   - des clés VAPID,
//   - un abonnement pushManager.subscribe({ applicationServerKey }),
//   - un backend qui POST le message au endpoint push.
// Le service worker (public/sw.js) est déjà prêt à recevoir l'event 'push'.
// ---------------------------------------------------------------------------

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (e) {
    console.warn('SW non enregistré:', e);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

// Notification système locale (via SW si possible, sinon Notification directe).
export async function showSystemNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'resa-proposee',
        vibrate: [120, 60, 120],
      });
    } else {
      new Notification(title, { body });
    }
    return true;
  } catch (e) {
    console.warn('Notification système échouée:', e);
    return false;
  }
}
