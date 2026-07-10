// ---------------------------------------------------------------------------
// AUTH (mock — localStorage)
// ---------------------------------------------------------------------------
// Stocke l'utilisateur connecté. Passage à Supabase Auth plus tard :
// remplacer login/logout/getStoredUser par supabase.auth.signInWithPassword etc.
// ---------------------------------------------------------------------------

import { findUser } from './supabase.js';

const SESSION_KEY = 'resto.session.v1';

export async function login(email, password) {
  const user = await findUser(email, password);
  if (!user) throw new Error('Email ou mot de passe incorrect');
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
