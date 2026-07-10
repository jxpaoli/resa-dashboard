// ---------------------------------------------------------------------------
// COUCHE D'ACCÈS DONNÉES — bascule automatique mock (localStorage) ↔ Supabase.
// Les pages n'importent QUE ce fichier.
// ---------------------------------------------------------------------------
import { supabase, APP_ID, isMock } from './supabaseClient.js';
import { db as mockDb, subscribe as mockSubscribe } from '../data/store.js';

export { isMock };

// --- Cache local (mode réel) : sert tableConflict de façon synchrone ---------
let cache = [];
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

let channel = null;
function ensureRealtime() {
  if (isMock || channel) return;
  channel = supabase
    .channel(`resa-${APP_ID}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reservations', filter: `app_id=eq.${APP_ID}` },
      () => emit() // un abonné (hook) va refetch → met le cache à jour
    )
    .subscribe();
}

export function subscribeToChanges(fn) {
  if (isMock) return mockSubscribe(fn);
  listeners.add(fn);
  ensureRealtime();
  return () => listeners.delete(fn);
}

// --- Réservations -----------------------------------------------------------
export async function getReservations() {
  if (isMock) return mockDb.getReservations();
  const { data, error } = await supabase.from('reservations').select('*').eq('app_id', APP_ID);
  if (error) throw error;
  cache = data || [];
  return cache;
}

export async function createReservation(values) {
  if (isMock) return mockDb.createReservation(values);
  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...values, app_id: APP_ID })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateReservation(id, patch) {
  if (isMock) return mockDb.updateReservation(id, patch);
  const { data, error } = await supabase.from('reservations').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

// Doublon N° table (même date + service, hors résa courante) — synchrone via cache
export function tableConflict(numero, date, service, exceptId) {
  if (isMock) return mockDb.tableConflict(numero, date, service, exceptId);
  return cache.some(
    (r) =>
      r.id !== exceptId &&
      r.numero_table != null &&
      Number(r.numero_table) === Number(numero) &&
      r.date === date &&
      r.service === service &&
      r.status === 'validated'
  );
}
