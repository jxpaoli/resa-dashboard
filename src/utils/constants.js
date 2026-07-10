// Options de remise + couleurs badges (source unique de vérité)
export const REMISES = [
  { value: 'plein', label: 'Plein tarif', short: 'Plein', color: '#06b6d4' }, // Cyan
  { value: '-30%', label: '-30%', short: '-30%', color: '#4f46e5' },          // Indigo
  { value: '-50%', label: '-50%', short: '-50%', color: '#f97316' },          // Orange
];

export const REMISE_INDEFINIE = { label: 'À définir', color: '#9ca3af' }; // Gris

export function remiseMeta(value) {
  return REMISES.find((r) => r.value === value) || null;
}

export const SOURCE_LABELS = {
  thefork: 'TheFork',
  wix: 'Wix',
  directeur: 'Directeur',
  staff: 'Staff',
};

// Tri par heure croissante ("HH:MM")
export const byHeure = (a, b) => (a.heure || '').localeCompare(b.heure || '');

// Le service (midi / soir) découle de l'heure de la réservation.
// Frontière : avant 17:00 = midi, à partir de 17:00 = soir.
export const SERVICE_CUTOFF = '17:00';
export function serviceFromHeure(heure) {
  if (!heure) return 'soir';
  return heure < SERVICE_CUTOFF ? 'midi' : 'soir';
}
export const serviceLabel = (s) => (s === 'midi' ? 'Midi' : 'Soir');

// Créneaux horaires proposés : 09:00 → 23:00, pas de 15 min.
export const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 9; h <= 23; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 23 && m > 0) break; // dernier créneau = 23:00
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();
