// ---------------------------------------------------------------------------
// COUCHE D'ACCÈS DONNÉES
// ---------------------------------------------------------------------------
// Aujourd'hui : redirige vers le store mock (localStorage).
// Demain (Supabase réel) : garder EXACTEMENT les mêmes signatures de fonctions
// ci-dessous, mais remplacer le corps par des appels @supabase/supabase-js.
// Les pages/composants n'importent QUE ce fichier — rien d'autre à changer.
//
// Exemple de bascule :
//   import { createClient } from '@supabase/supabase-js';
//   const supabase = createClient(
//     import.meta.env.VITE_SUPABASE_URL,
//     import.meta.env.VITE_SUPABASE_ANON_KEY
//   );
//   export async function getReservations() {
//     const { data } = await supabase.from('reservations').select('*');
//     return data;
//   }
// ---------------------------------------------------------------------------

import { db, subscribe as storeSubscribe } from '../data/store.js';

export const isMock =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const subscribeToChanges = storeSubscribe;

export const getReservations = () => db.getReservations();
export const createReservation = (data) => db.createReservation(data);
export const updateReservation = (id, patch) => db.updateReservation(id, patch);
export const tableConflict = (numero, date, service, exceptId) =>
  db.tableConflict(numero, date, service, exceptId);

export const findUser = (email, password) => db.findUser(email, password);
export const getUserById = (id) => db.getUserById(id);
