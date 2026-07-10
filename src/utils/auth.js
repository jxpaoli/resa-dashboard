// ---------------------------------------------------------------------------
// AUTH — bascule mock (localStorage) ↔ Supabase Auth.
// En réel : le rôle (directeur/staff) vient de `memberships` pour CETTE app.
// ---------------------------------------------------------------------------
import { supabase, APP_ID, isMock } from './supabaseClient.js';
import { db as mockDb } from '../data/store.js';

const SESSION_KEY = 'resto.session.v1';

// ------------------------------ MOCK ---------------------------------------
async function mockLogin(email, password) {
  const u = await mockDb.findUser(email, password);
  if (!u) throw new Error('Email ou mot de passe incorrect');
  localStorage.setItem(SESSION_KEY, JSON.stringify(u));
  return u;
}
function mockLogout() { localStorage.removeItem(SESSION_KEY); }
function mockCurrent() {
  try { const r = localStorage.getItem(SESSION_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

// ------------------------------ RÉEL ---------------------------------------
// Construit l'utilisateur applicatif à partir de la session Supabase :
// vérifie l'appartenance à l'app + récupère le rôle et le nom.
async function buildUser(sessionUser) {
  const uid = sessionUser.id;
  const { data: mem } = await supabase
    .from('memberships').select('role').eq('user_id', uid).eq('app_id', APP_ID).maybeSingle();
  if (!mem) return null; // pas membre de cet établissement
  const { data: prof } = await supabase.from('profiles').select('nom').eq('id', uid).maybeSingle();
  return { id: uid, email: sessionUser.email, nom: prof?.nom || sessionUser.email, role: mem.role };
}

// ------------------------------ API ----------------------------------------
export async function login(email, password) {
  if (isMock) return mockLogin(email, password);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email ou mot de passe incorrect');
  const u = await buildUser(data.user);
  if (!u) { await supabase.auth.signOut(); throw new Error("Ce compte n'a pas accès à cet établissement"); }
  return u;
}

export async function logout() {
  if (isMock) return mockLogout();
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (isMock) return mockCurrent();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  return buildUser(data.session.user);
}

// Écoute les changements de session (réel). Retourne une fonction de désabonnement.
export function onAuthChange(cb) {
  if (isMock) return () => {};
  const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
    cb(session ? await buildUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}
