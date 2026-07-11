import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import { searchClients } from '../utils/supabase.js';
import {
  serviceFromHeure, serviceLabel, REMISES, SLOTS_MIDI, SLOTS_SOIR, TIME_SLOTS,
} from '../utils/constants.js';

const pad = (n) => String(n).padStart(2, '0');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const nowHM = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const CIVILITES = ['M.', 'Mme', 'Entreprise'];

function weekdayLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const EMPTY = {
  civilite: '', nom: '', prenom: '', email: '', telephone: '',
  date: today(), heure: '', couverts: '', remise: 'plein', notes: '',
};

// Formulaire réservation partagé (création + édition).
// `enforceFuture` : bloque les dates/créneaux passés (création). Faux en édition.
export default function ReservationForm({ initial, submitLabel = 'Enregistrer', onSubmit, onCancel, enforceFuture = true }) {
  const { notify } = useToast();
  const [form, setForm] = useState(() =>
    initial
      ? {
          civilite: initial.civilite || '',
          nom: initial.nom || '',
          prenom: initial.prenom || '',
          email: initial.email || '',
          telephone: initial.telephone || '',
          date: initial.date || today(),
          heure: initial.heure || '',
          couverts: initial.couverts != null ? String(initial.couverts) : '',
          remise: initial.remise ?? null,
          notes: initial.notes || '',
        }
      : { ...EMPTY }
  );
  const [event, setEvent] = useState(initial?.evenement || initial?.service === 'evenement' || false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Auto-complétion clients : recherche par nom (débounce)
  useEffect(() => {
    const q = form.nom;
    if (!showSug || !q || q.trim().length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => setSuggestions(await searchClients(q)), 250);
    return () => clearTimeout(t);
  }, [form.nom, showSug]);

  const pickClient = (c) => {
    setForm((f) => ({
      ...f,
      civilite: c.civilite || f.civilite,
      nom: c.nom || '',
      prenom: c.prenom || '',
      email: c.email || '',
      telephone: c.telephone || '',
    }));
    setSuggestions([]);
    setShowSug(false);
  };

  const shiftDate = (delta) =>
    setForm((f) => {
      const [y, m, dd] = (f.date || today()).split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, dd));
      dt.setUTCDate(dt.getUTCDate() + delta);
      let iso = dt.toISOString().slice(0, 10);
      if (iso < today()) iso = today();
      return { ...f, date: iso };
    });

  const isToday = form.date === today();
  const slotOk = (t) => !enforceFuture || !isToday || t > nowHM();
  const midiSlots = SLOTS_MIDI.filter(slotOk);
  const soirSlots = SLOTS_SOIR.filter(slotOk);
  const wideSlots = TIME_SLOTS.filter(slotOk);
  const shown = event ? wideSlots : [...midiSlots, ...soirSlots];
  const orphan = form.heure && !shown.includes(form.heure) ? form.heure : null; // garde l'heure actuelle en édition
  const noSlotToday = enforceFuture && isToday && shown.length === 0;

  const touchCouverts = () => setForm((f) => (f.couverts === '' ? { ...f, couverts: '2' } : f));
  const stepCouverts = (delta) =>
    setForm((f) => {
      const n = f.couverts === '' ? 2 : Math.max(1, Number(f.couverts) + delta);
      return { ...f, couverts: String(n) };
    });

  const handle = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.date || !form.heure) {
      notify('Nom, date et heure sont obligatoires', { type: 'error' });
      return;
    }
    if (enforceFuture) {
      if (form.date < today()) { notify('Impossible de réserver sur une date passée', { type: 'error' }); return; }
      if (form.date === today() && form.heure <= nowHM()) { notify('Ce créneau est déjà passé', { type: 'error' }); return; }
    }
    if (!form.telephone && !form.email) {
      notify('Indique au moins un téléphone ou un email', { type: 'error' });
      return;
    }
    if (form.couverts === '' || Number(form.couverts) <= 0) {
      notify('Indique le nombre de couverts', { type: 'error' });
      return;
    }
    const values = {
      ...form,
      couverts: Number(form.couverts),
      service: event ? 'evenement' : serviceFromHeure(form.heure),
      evenement: event,
    };
    setSaving(true);
    try { await onSubmit(values); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handle}>
      <fieldset className="field">
        <span className="field__label">Civilité</span>
        <div className="radio-row radio-row--sm">
          {CIVILITES.map((c) => (
            <label key={c} className={`radio-pill radio-pill--sm ${form.civilite === c ? 'is-active' : ''}`}>
              <input type="radio" name="civilite" value={c} checked={form.civilite === c} onChange={set('civilite')} />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field-row">
        <label className="field field--autocomplete">
          <span className="field__label">Nom *</span>
          <input
            className="field__input"
            value={form.nom}
            onChange={(e) => { set('nom')(e); setShowSug(true); }}
            onFocus={() => setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
            autoFocus
            autoComplete="off"
          />
          {showSug && suggestions.length > 0 && (
            <ul className="autocomplete">
              {suggestions.map((c) => (
                <li key={c.id}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickClient(c)}>
                    <strong>{c.nom}{c.prenom ? ` ${c.prenom}` : ''}</strong>
                    <span>{c.telephone || c.email || ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <label className="field">
          <span className="field__label">Prénom</span>
          <input className="field__input" value={form.prenom} onChange={set('prenom')} />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field__label">Email</span>
          <input type="email" className="field__input" value={form.email} onChange={set('email')} />
        </label>
        <label className="field">
          <span className="field__label">Téléphone</span>
          <input type="tel" className="field__input" value={form.telephone} onChange={set('telephone')} />
        </label>
      </div>

      <div className="field">
        <span className="field__label">Couverts *</span>
        <div className="stepper stepper--couverts">
          <button type="button" className="stepper__btn" onClick={() => stepCouverts(-1)} aria-label="Moins">−</button>
          <input type="number" min="1" inputMode="numeric" className="field__input stepper__num"
            value={form.couverts} placeholder="—" onFocus={touchCouverts} onChange={set('couverts')} />
          <button type="button" className="stepper__btn" onClick={() => stepCouverts(1)} aria-label="Plus">+</button>
        </div>
      </div>

      <div className="field">
        <span className="field__label">Date * · <span className="weekday">{weekdayLabel(form.date)}</span></span>
        <div className="stepper">
          <button type="button" className="stepper__btn" onClick={() => shiftDate(-1)} disabled={form.date <= today()} aria-label="Jour précédent">−</button>
          <input type="date" className="field__input" value={form.date} min={today()} onChange={set('date')} />
          <button type="button" className="stepper__btn" onClick={() => shiftDate(1)} aria-label="Jour suivant">+</button>
        </div>
      </div>

      <div className="field">
        <span className="field__label">Heure *</span>
        <div className="heure-row">
          <select className="field__input heure-select" value={form.heure || ''} onChange={set('heure')}>
            <option value="" disabled>—</option>
            {orphan && <option value={orphan}>{orphan}</option>}
            {event ? (
              wideSlots.map((t) => <option key={t} value={t}>{t}</option>)
            ) : (
              <>
                {midiSlots.length > 0 && (
                  <optgroup label="Midi">{midiSlots.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
                )}
                {soirSlots.length > 0 && (
                  <optgroup label="Soir">{soirSlots.map((t) => <option key={t} value={t}>{t}</option>)}</optgroup>
                )}
              </>
            )}
          </select>
          <label className="evt-check">
            <input type="checkbox" checked={event} onChange={(e) => setEvent(e.target.checked)} />
            Événement spécial
          </label>
        </div>
        {noSlotToday && <p className="hint hint--tight">Plus de créneaux aujourd'hui — choisis un autre jour (+).</p>}
        {form.heure && (
          <p className="hint hint--tight">
            {event ? 'Catégorie : ' : 'Service : '}
            <strong>{event ? 'Événement' : serviceLabel(serviceFromHeure(form.heure))}</strong>
          </p>
        )}
      </div>

      <fieldset className="field">
        <span className="field__label">Remise</span>
        <div className="radio-row">
          {REMISES.map((r) => {
            const active = form.remise === r.value;
            return (
              <label key={r.value}
                className={`radio-pill remise-pill ${active ? 'is-active' : ''}`}
                style={{ background: r.pale, color: r.color, borderColor: active ? r.color : 'transparent' }}>
                <input type="radio" name="remise" value={r.value} checked={active} onChange={set('remise')} />
                {r.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="field">
        <span className="field__label">Notes (allergies, demandes…)</span>
        <textarea className="field__input" rows="3" value={form.notes} onChange={set('notes')} />
      </label>

      <div className="modal__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? '…' : submitLabel}</button>
      </div>
    </form>
  );
}
