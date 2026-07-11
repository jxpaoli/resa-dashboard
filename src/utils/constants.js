// Options de remise + couleurs badges (source unique de vérité)
// `pale` = version claire du color, pour le fond des boutons du formulaire.
export const REMISES = [
  { value: 'plein', label: 'Plein tarif', short: 'Plein', color: '#06b6d4', pale: '#cffafe' }, // Cyan
  { value: '-30%', label: '-30%', short: '-30%', color: '#4f46e5', pale: '#e0e7ff' },          // Indigo
  { value: '-50%', label: '-50%', short: '-50%', color: '#f97316', pale: '#ffedd5' },          // Orange
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
// Frontière : avant 16:00 = midi, à partir de 16:00 = soir (aligné sur l'agenda).
export const SERVICE_CUTOFF = '16:00';
export function serviceFromHeure(heure) {
  if (!heure) return 'soir';
  return heure < SERVICE_CUTOFF ? 'midi' : 'soir';
}
export const serviceLabel = (s) =>
  s === 'midi' ? 'Midi' : s === 'evenement' ? 'Événement' : 'Soir';

// Créneaux horaires proposés dans le formulaire (pas de 15 min) :
//   Midi 11:30 → 14:30  ·  Soir 18:00 → 22:00
function buildSlots(start, end) {
  const res = [];
  let [h, m] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  while (h < eh || (h === eh && m <= em)) {
    res.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 15;
    if (m >= 60) { m -= 60; h += 1; }
  }
  return res;
}
export const SLOTS_MIDI = buildSlots('11:30', '14:30');
export const SLOTS_SOIR = buildSlots('18:00', '22:00');

// Créneaux larges (09:00 → 23:00) utilisés par le modal d'édition.
export const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 9; h <= 23; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 23 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();
