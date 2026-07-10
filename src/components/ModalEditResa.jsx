import { useState, useEffect } from 'react';
import { updateReservation } from '../utils/supabase.js';
import { useToast } from '../context/ToastContext.jsx';
import { serviceFromHeure, serviceLabel } from '../utils/constants.js';
import HeureSelect from './HeureSelect.jsx';

// Modal d'édition COMPLÈTE de la réservation (onglet Listes).
// Édite toutes les infos client. Le service (midi/soir) est recalculé
// automatiquement depuis l'heure. Remise + table se gèrent en Tableau de service.
export default function ModalEditResa({ reservation, onClose }) {
  const { notify } = useToast();
  const [f, setF] = useState({
    nom: reservation.nom || '',
    email: reservation.email || '',
    telephone: reservation.telephone || '',
    date: reservation.date || '',
    heure: reservation.heure || '',
    couverts: reservation.couverts ?? '',
    notes: reservation.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const canCancel = reservation.status === 'validated'; // annulation = résa validée

  const doCancel = async () => {
    await updateReservation(reservation.id, { status: 'archived' });
    notify(`${reservation.nom} — réservation annulée`, { type: 'info' });
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const service = serviceFromHeure(f.heure);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.nom || !f.email || !f.telephone || !f.date || !f.heure || !f.couverts) {
      notify('Merci de remplir tous les champs obligatoires', { type: 'error' });
      return;
    }
    if (Number(f.couverts) <= 0) {
      notify('Le nombre de couverts doit être supérieur à 0', { type: 'error' });
      return;
    }
    setSaving(true);
    await updateReservation(reservation.id, {
      ...f,
      couverts: Number(f.couverts),
      service, // recalculé depuis l'heure
    });
    setSaving(false);
    notify(`${f.nom} — réservation mise à jour`, { type: 'success' });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal--wide ${canCancel ? 'modal--cancelable' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {canCancel && (
          <div className="cancel-corner">
            <button type="button" className="cancel-x" onClick={() => setConfirmCancel(true)} aria-label="Annuler cette réservation">✕</button>
            <span className="cancel-label">Annuler cette réservation</span>
          </div>
        )}
        <h2 className="modal__title">Éditer la réservation</h2>
        <p className="modal__sub">
          Service : <strong>{serviceLabel(service)}</strong> (déduit de l'heure)
        </p>

        <form onSubmit={submit}>
          <label className="field">
            <span className="field__label">Nom *</span>
            <input className="field__input" value={f.nom} onChange={set('nom')} autoFocus />
          </label>
          <label className="field">
            <span className="field__label">Email *</span>
            <input type="email" className="field__input" value={f.email} onChange={set('email')} />
          </label>
          <label className="field">
            <span className="field__label">Téléphone *</span>
            <input type="tel" className="field__input" value={f.telephone} onChange={set('telephone')} />
          </label>
          <div className="field-row">
            <label className="field">
              <span className="field__label">Date *</span>
              <input type="date" className="field__input" value={f.date} onChange={set('date')} />
            </label>
            <label className="field">
              <span className="field__label">Heure *</span>
              <HeureSelect value={f.heure} onChange={set('heure')} />
            </label>
          </div>
          <label className="field">
            <span className="field__label">Couverts *</span>
            <input type="number" min="1" inputMode="numeric" className="field__input"
              value={f.couverts} onChange={set('couverts')} />
          </label>
          <label className="field">
            <span className="field__label">Notes (allergies, demandes…)</span>
            <textarea className="field__input" rows="3" value={f.notes} onChange={set('notes')} />
          </label>

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? '…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {confirmCancel && (
        <div className="modal-overlay modal-overlay--top" onClick={() => setConfirmCancel(false)}>
          <div className="modal modal--confirm" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className="modal__title">Annuler la réservation ?</h2>
            <p className="modal__sub">
              {reservation.nom} — {reservation.date} · {reservation.heure}. La réservation sera retirée du service.
            </p>
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmCancel(false)}>Non</button>
              <button type="button" className="btn btn--reject" onClick={doCancel}>Oui, annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
