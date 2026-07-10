import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createReservation } from '../utils/supabase.js';
import { requestNotificationPermission, showSystemNotification } from '../utils/notifications.js';
import { serviceFromHeure, serviceLabel, REMISES } from '../utils/constants.js';
import HeureSelect from '../components/HeureSelect.jsx';

const empty = {
  nom: '',
  email: '',
  telephone: '',
  date: new Date().toISOString().slice(0, 10),
  heure: '',
  couverts: '',
  remise: 'plein',
  notes: '',
};

export default function Formulaire() {
  const { user, isDirecteur } = useAuth();
  const { notify } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.email || !form.telephone || !form.date || !form.heure || !form.couverts) {
      notify('Merci de remplir tous les champs obligatoires', { type: 'error' });
      return;
    }
    if (Number(form.couverts) <= 0) {
      notify('Le nombre de couverts doit être supérieur à 0', { type: 'error' });
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const isDir = isDirecteur;

    const payload = {
      ...form,
      couverts: Number(form.couverts),
      service: serviceFromHeure(form.heure), // déduit de l'heure
      source: isDir ? 'directeur' : 'staff',
      status: isDir ? 'validated' : 'proposed',
      created_by: user.id,
      validated_by: isDir ? user.id : null,
      validated_at: isDir ? now : null,
    };

    await createReservation(payload);
    setSaving(false);

    if (!isDir) {
      // Staff → notifier le Directeur : toast + notif système (si permission)
      notify('Réservation proposée envoyée au Directeur ✅', { type: 'success' });
      showSystemNotification(
        'Nouvelle réservation proposée',
        `${payload.nom} — ${payload.heure} — ${payload.couverts} couv.`
      );
    } else {
      notify('Réservation validée créée ✅', { type: 'success' });
    }

    setForm(empty); // retour formulaire vide
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Nouvelle réservation</h1>
        <p className="page__sub">
          {isDirecteur
            ? 'Créée directement en validée.'
            : 'Créée en proposée → envoyée au Directeur.'}
        </p>
      </header>

      <form className="form-card" onSubmit={submit}>
        <label className="field">
          <span className="field__label">Nom *</span>
          <input className="field__input" value={form.nom} onChange={set('nom')} required />
        </label>

        <label className="field">
          <span className="field__label">Email *</span>
          <input type="email" className="field__input" value={form.email} onChange={set('email')} required />
        </label>

        <label className="field">
          <span className="field__label">Téléphone *</span>
          <input type="tel" className="field__input" value={form.telephone} onChange={set('telephone')} required />
        </label>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Date *</span>
            <input type="date" className="field__input" value={form.date} onChange={set('date')} required />
          </label>
          <label className="field">
            <span className="field__label">Heure *</span>
            <HeureSelect value={form.heure} onChange={set('heure')} required />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Couverts *</span>
            <input type="number" min="1" inputMode="numeric" className="field__input"
              value={form.couverts} onChange={set('couverts')} required />
          </label>
        </div>

        {form.heure && (
          <p className="hint">
            Service : <strong>{serviceLabel(serviceFromHeure(form.heure))}</strong>
            <span className="hint__soft"> (déduit de l'heure)</span>
          </p>
        )}

        <fieldset className="field">
          <span className="field__label">Remise *</span>
          <div className="radio-row">
            {REMISES.map((r) => (
              <label key={r.value}
                className={`radio-pill ${form.remise === r.value ? 'is-active' : ''}`}
                style={form.remise === r.value ? { borderColor: r.color, color: r.color } : undefined}>
                <input type="radio" name="remise" value={r.value} checked={form.remise === r.value} onChange={set('remise')} />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span className="field__label">Notes (allergies, demandes…)</span>
          <textarea className="field__input" rows="3" value={form.notes} onChange={set('notes')} />
        </label>

        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={saving}>
          {saving ? '…' : 'Créer'}
        </button>

        {!isDirecteur && (
          <button type="button" className="btn btn--ghost btn--block" onClick={requestNotificationPermission}>
            Activer les notifications
          </button>
        )}
      </form>
    </div>
  );
}
