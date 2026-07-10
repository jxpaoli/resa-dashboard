import { TIME_SLOTS } from '../utils/constants.js';

// Sélecteur d'heure en créneaux (09:00 → 23:00, pas de 15 min).
// Si la résa a une heure hors grille (ancienne donnée), on l'ajoute en tête
// pour ne pas la perdre à l'affichage.
export default function HeureSelect({ value, onChange, ...props }) {
  const slots = value && !TIME_SLOTS.includes(value) ? [value, ...TIME_SLOTS] : TIME_SLOTS;
  return (
    <select className="field__input" value={value || ''} onChange={onChange} {...props}>
      <option value="" disabled>—</option>
      {slots.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}
