import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createReservation } from '../utils/supabase.js';
import { showSystemNotification } from '../utils/notifications.js';
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

const empty = {
  civilite: '',
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  date: today(),
  heure: '',
  couverts: '', // vide tant que l'utilisateur n'y touche pas
  remise: 'plein',
  notes: '',
};

const CIVILITES = ['M.', 'Mme', 'Entreprise'];

// Jour de la semaine + date (ex: "Vendredi 11 juillet")
function weekdayLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function FormulaireModal({ onClose }) {
  const { user, isDirecteur } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState(empty);
  const [event, setEvent] = useState(false); // catégorie « Événement » (heure élargie)
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Calcul en UTC pour éviter le décalage de fuseau (le + repartait au jour d'avant).
  const shiftDate = (delta) =>
    setForm((f) => {
      const [y, m, dd] = (f.date || today()).split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, dd));
      dt.setUTCDate(dt.getUTCDate() + delta);
      let iso = dt.toISOString().slice(0, 10);
      if (iso < today()) iso = today(); // pas de date passée
      return { ...f, date: iso };
    });

  // Créneaux : on masque ceux déjà passés si la date = aujourd'hui (service fini).
  const isToday = form.date === today();
  const slotOk = (t) => !isToday || t > nowHM();
  const midiSlots = SLOTS_MIDI.filter(slotOk);
  const soirSlots = SLOTS_SOIR.filter(slotOk);
  const wideSlots = TIME_SLOTS.filter(slotOk);
  const noSlotToday = isToday && (event ? wideSlots.length === 0 : midiSlots.length === 0 && soirSlots.length === 0);

  const touchCouverts = () => setForm((f) => (f.couverts === '' ? { ...f, couverts: '2' } : f));
  const stepCouverts = (delta) =>
    setForm((f) => {
      const n = f.couverts === '' ? 2 : Math.max(1, Number(f.couverts) + delta);
      return { ...f, couverts: String(n) };
    });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.date || !form.heure) {
      notify('Nom, date et heure sont obligatoires', { type: 'error' });
      return;
    }
    if (form.date < today()) {
      notify('Impossible de réserver sur une date passée', { type: 'error' });
      return;
    }
    if (form.date === today() && form.heure <= nowHM()) {
      notify('Ce créneau est déjà passé', { type: 'error' });
      return;
    }
    if (!form.telephone && !form.email) {
      notify('Indique au moins un téléphone ou un email', { type: 'error' });
      return;
    }
    if (form.couverts === '' || Number(form.couverts) <= 0) {
      notify('Indique le nombre de couverts', { type: 'error' });
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const isDir = isDirecteur;

    const payload = {
      ...form,
      couverts: Number(form.couverts),
      service: event ? 'evenement' : serviceFromHeure(form.heure),
      evenement: event,
      source: isDir ? 'directeur' : 'staff',
      status: isDir ? 'validated' : 'proposed',
      created_by: user.id,
      validated_by: isDir ? user.id : null,
      validated_at: isDir ? now : null,
    };

    await createReservation(payload);
    setSaving(false);

    if (!isDir) {
      notify('Réservation proposée envoyée au Directeur ✅', { type: 'success' });
      showSystemNotification('Nouvelle réservation proposée', `${payload.nom} — ${payload.heure} — ${payload.couverts} couv.`);
    } else {
      notify('Réservation validée créée ✅', { type: 'success' });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide modal--form" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="modal__title">Nouvelle réservation</h2>
        <p className="modal__sub">
          {isDirecteur ? 'Créée directement en validée.' : 'Créée en proposée → envoyée au Directeur.'}
        </p>

        <form onSubmit={submit}>
          {/* Civilité (petits boutons) */}
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

          {/* Nom / Prénom */}
          <div className="field-row">
            <label className="field">
              <span className="field__label">Nom *</span>
              <input className="field__input" value={form.nom} onChange={set('nom')} autoFocus />
            </label>
            <label className="field">
              <span className="field__label">Prénom</span>
              <input className="field__input" value={form.prenom} onChange={set('prenom')} />
            </label>
          </div>

          {/* Email / Téléphone */}
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

          {/* Couverts (avant date/heure) */}
          <div className="field">
            <span className="field__label">Couverts *</span>
            <div className="stepper stepper--couverts">
              <button type="button" className="stepper__btn" onClick={() => stepCouverts(-1)} aria-label="Moins">−</button>
              <input type="number" min="1" inputMode="numeric" className="field__input stepper__num"
                value={form.couverts} placeholder="—" onFocus={touchCouverts} onChange={set('couverts')} />
              <button type="button" className="stepper__btn" onClick={() => stepCouverts(1)} aria-label="Plus">+</button>
            </div>
          </div>

          {/* Date */}
          <div className="field">
            <span className="field__label">Date * · <span className="weekday">{weekdayLabel(form.date)}</span></span>
            <div className="stepper">
              <button type="button" className="stepper__btn" onClick={() => shiftDate(-1)} disabled={form.date <= today()} aria-label="Jour précédent">−</button>
              <input type="date" className="field__input" value={form.date} min={today()} onChange={set('date')} />
              <button type="button" className="stepper__btn" onClick={() => shiftDate(1)} aria-label="Jour suivant">+</button>
            </div>
          </div>

          {/* Heure (petit) + coche Événement */}
          <div className="field">
            <span className="field__label">Heure *</span>
            <div className="heure-row">
              <select className="field__input heure-select" value={form.heure || ''} onChange={set('heure')}>
                <option value="" disabled>—</option>
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
            {noSlotToday && (
              <p className="hint hint--tight">Plus de créneaux aujourd'hui — choisis un autre jour (+).</p>
            )}
            {form.heure && (
              <p className="hint hint--tight">
                {event ? 'Catégorie : ' : 'Service : '}
                <strong>{event ? 'Événement' : serviceLabel(serviceFromHeure(form.heure))}</strong>
              </p>
            )}
          </div>

          {/* Remise */}
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

          {/* Notes */}
          <label className="field">
            <span className="field__label">Notes (allergies, demandes…)</span>
            <textarea className="field__input" rows="3" value={form.notes} onChange={set('notes')} />
          </label>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? '…' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
