const pad = (n) => String(n).padStart(2, '0');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
function label(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Sélecteur de date par − / + (min = aujourd'hui). Pas de saisie manuelle.
export default function DateStepper({ date, setDate }) {
  const shift = (delta) => {
    const [y, m, d] = (date || today()).split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + delta);
    let iso = dt.toISOString().slice(0, 10);
    if (iso < today()) iso = today();
    setDate(iso);
  };
  return (
    <div className="datestep">
      <button type="button" className="stepper__btn stepper__btn--sm" onClick={() => shift(-1)} disabled={date <= today()} aria-label="Jour précédent">−</button>
      <span className="datestep__label">{label(date)}</span>
      <button type="button" className="stepper__btn stepper__btn--sm" onClick={() => shift(1)} aria-label="Jour suivant">+</button>
    </div>
  );
}
