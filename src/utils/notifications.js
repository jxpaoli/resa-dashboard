// ---------------------------------------------------------------------------
// NOTIFICATIONS
//  - Toast in-app (toujours) : géré par ToastContext.
//  - Push Web (app fermée) : abonnement enregistré dans Supabase, envoi via
//    l'Edge Function `notify-directeur` (déclenchée par un Database Webhook).
// ---------------------------------------------------------------------------
import { supabase, APP_ID, isMock } from './supabaseClient.js';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const pushSupported =
  typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

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

// Notification système locale (repli, quand l'app est ouverte)
export async function showSystemNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: '/icon.svg', badge: '/icon.svg', tag: 'resa-proposee', vibrate: [120, 60, 120] });
    else new Notification(title, { body });
    return true;
  } catch (e) {
    console.warn('Notification système échouée:', e);
    return false;
  }
}

// --- Push Web ---------------------------------------------------------------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushAvailable() {
  return pushSupported && !isMock && !!VAPID_PUBLIC && !!supabase;
}

export async function isPushEnabled() {
  if (!pushAvailable() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return !!sub;
}

// Demande la permission, s'abonne et enregistre l'abonnement dans Supabase.
export async function enablePush(user) {
  if (!pushAvailable()) return { ok: false, reason: 'unsupported' };
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return { ok: false, reason: 'denied' };

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });
  }
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ app_id: APP_ID, user_id: user.id, subscription: sub.toJSON() }, { onConflict: 'user_id,endpoint' });
  if (error) return { ok: false, reason: 'db', error };
  return { ok: true };
}

export async function disablePush() {
  if (!pushSupported) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  if (!isMock && supabase) await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
  await sub.unsubscribe();
}
