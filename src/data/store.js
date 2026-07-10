// ---------------------------------------------------------------------------
// STORE MOCK (localStorage)
// ---------------------------------------------------------------------------
// Couche de données de démo. Mime une API async (Promises) pour que le passage
// à Supabase plus tard = remplacer utils/supabase.js sans toucher aux pages.
// Toutes les mutations sont persistées dans localStorage + notifient les
// abonnés (pub/sub) pour que l'UI se rafraîchisse en temps réel.
// ---------------------------------------------------------------------------

const RES_KEY = 'resto.reservations.v1';
const USERS_KEY = 'resto.users.v1';

const uid = () =>
  (crypto?.randomUUID && crypto.randomUUID()) ||
  'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

// -- Helpers dates : mock toujours "à venir" par rapport à aujourd'hui --------
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};
const TODAY = iso(new Date());

// -- Comptes de démo ----------------------------------------------------------
const SEED_USERS = [
  { id: 'u-dir', email: 'directeur@resto.fr', password: 'directeur', role: 'directeur', nom: 'Le Directeur' },
  { id: 'u-staff', email: 'staff@resto.fr', password: 'staff', role: 'staff', nom: 'Camille (Staff)' },
];

// -- Réservations de démo -----------------------------------------------------
function seedReservations() {
  const now = new Date().toISOString();
  const base = (o) => ({
    id: uid(),
    nom: '',
    email: '',
    telephone: '',
    date: TODAY,
    heure: '20:00',
    couverts: 2,
    remise: 'plein',
    notes: '',
    numero_table: null,
    status: 'validated',
    source: 'directeur',
    created_by: 'u-dir',
    created_at: now,
    validated_by: 'u-dir',
    validated_at: now,
    updated_at: now,
    service: 'soir',
    presence: null,
    ...o,
  });

  return [
    // --- Validées, service soir aujourd'hui ---
    base({ nom: 'Famille Martin', email: 'martin@mail.fr', telephone: '0611223344', date: TODAY, heure: '19:30', couverts: 4, remise: '-30%', source: 'thefork', numero_table: 12, service: 'soir' }),
    base({ nom: 'M. Dubois', email: 'dubois@mail.fr', telephone: '0622334455', date: TODAY, heure: '20:00', couverts: 2, remise: 'plein', source: 'wix', numero_table: 5, service: 'soir' }),
    base({ nom: 'Sophie Laurent', email: 'sophie@mail.fr', telephone: '0633445566', date: TODAY, heure: '20:15', couverts: 3, remise: '-50%', source: 'thefork', numero_table: null, service: 'soir' }),
    base({ nom: 'Groupe Anniv', email: 'anniv@mail.fr', telephone: '0644556677', date: TODAY, heure: '21:00', couverts: 6, remise: '-30%', source: 'directeur', numero_table: null, service: 'soir', notes: 'Gâteau prévu, allergie fruits à coque' }),
    // --- Validées, service midi aujourd'hui ---
    base({ nom: 'Déj. Pro Legrand', email: 'legrand@mail.fr', telephone: '0655667788', date: TODAY, heure: '12:30', couverts: 2, remise: 'plein', source: 'wix', numero_table: 8, service: 'midi' }),
    base({ nom: 'Table Petit', email: 'petit@mail.fr', telephone: '0666778899', date: TODAY, heure: '13:00', couverts: 3, remise: '-30%', source: 'thefork', numero_table: null, service: 'midi' }),
    // --- Jours suivants ---
    base({ nom: 'Réunion Moreau', email: 'moreau@mail.fr', telephone: '0677889900', date: addDays(1), heure: '20:30', couverts: 5, remise: 'plein', source: 'directeur', numero_table: null, service: 'soir' }),
    base({ nom: 'Couple Bernard', email: 'bernard@mail.fr', telephone: '0688990011', date: addDays(2), heure: '19:45', couverts: 2, remise: '-50%', source: 'thefork', numero_table: null, service: 'soir', notes: 'Demande table calme' }),

    // --- Proposées par le Staff (en attente de validation) ---
    base({ nom: 'Client Rousseau', email: 'rousseau@mail.fr', telephone: '0699001122', date: TODAY, heure: '20:45', couverts: 4, remise: 'plein', source: 'staff', created_by: 'u-staff', status: 'proposed', validated_by: null, validated_at: null, service: 'soir', notes: 'Appelé pour confirmer' }),
    base({ nom: 'Table Girard', email: 'girard@mail.fr', telephone: '0610101010', date: TODAY, heure: '12:45', couverts: 2, remise: 'plein', source: 'staff', created_by: 'u-staff', status: 'proposed', validated_by: null, validated_at: null, service: 'midi' }),
    base({ nom: 'Groupe Fontaine', email: 'fontaine@mail.fr', telephone: '0620202020', date: addDays(1), heure: '21:15', couverts: 8, remise: 'plein', source: 'staff', created_by: 'u-staff', status: 'proposed', validated_by: null, validated_at: null, service: 'soir', notes: 'Grande tablée' }),
  ];
}

// -- Persistance --------------------------------------------------------------
function load(key, seedFn) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const seeded = seedFn();
  localStorage.setItem(key, JSON.stringify(seeded));
  return seeded;
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let reservations = load(RES_KEY, seedReservations);
let users = load(USERS_KEY, () => SEED_USERS);

// -- Pub/Sub ------------------------------------------------------------------
const listeners = new Set();
function emit() {
  save(RES_KEY, reservations);
  listeners.forEach((fn) => fn());
}
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Petite latence simulée pour rester réaliste (et repérer les états loading)
const delay = (v, ms = 120) => new Promise((r) => setTimeout(() => r(v), ms));

// -- API Réservations ---------------------------------------------------------
export const db = {
  async getReservations() {
    return delay([...reservations]);
  },

  async createReservation(data) {
    const now = new Date().toISOString();
    const row = {
      id: uid(),
      numero_table: null,
      presence: null,
      validated_by: null,
      validated_at: null,
      created_at: now,
      updated_at: now,
      ...data,
    };
    reservations = [row, ...reservations];
    emit();
    return delay(row);
  },

  async updateReservation(id, patch) {
    const now = new Date().toISOString();
    reservations = reservations.map((r) =>
      r.id === id ? { ...r, ...patch, updated_at: now } : r
    );
    emit();
    return delay(reservations.find((r) => r.id === id));
  },

  // Doublon N° table sur même date + service (hors résa courante)
  tableConflict(numero_table, date, service, exceptId) {
    return reservations.some(
      (r) =>
        r.id !== exceptId &&
        r.numero_table != null &&
        Number(r.numero_table) === Number(numero_table) &&
        r.date === date &&
        r.service === service &&
        r.status === 'validated'
    );
  },

  // -- Users / Auth mock ------------------------------------------------------
  async findUser(email, password) {
    const u = users.find(
      (x) => x.email.toLowerCase() === String(email).toLowerCase() && x.password === password
    );
    return delay(u ? { id: u.id, email: u.email, role: u.role, nom: u.nom } : null);
  },
  getUserById(id) {
    const u = users.find((x) => x.id === id);
    return u ? { id: u.id, email: u.email, role: u.role, nom: u.nom } : null;
  },
};
