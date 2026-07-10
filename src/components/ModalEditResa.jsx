import { useState, useEffect } from 'react';
import { updateReservation } from '../utils/supabase.js';
import { useToast } from '../context/ToastContext.jsx';
import ReservationForm from './ReservationForm.jsx';

// Modal d'édition — MÊME formulaire que la création (ReservationForm),
// pré-rempli. + bouton « Annuler cette réservation » (résa validée).
export default function ModalEditResa({ reservation, onClose }) {
  const { notify } = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const canCancel = reservation.status === 'validated';

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (values) => {
    await updateReservation(reservation.id, values);
    notify(`${values.nom} — réservation mise à jour`, { type: 'success' });
    onClose();
  };

  const doCancel = async () => {
    await updateReservation(reservation.id, { status: 'archived' });
    notify(`${reservation.nom} — réservation annulée`, { type: 'info' });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal modal--wide modal--form ${canCancel ? 'modal--cancelable' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {canCancel && (
          <div className="cancel-corner">
            <button type="button" className="cancel-x" onClick={() => setConfirmCancel(true)} aria-label="Annuler cette réservation">✕</button>
            <span className="cancel-label">Annuler cette réservation</span>
          </div>
        )}
        <h2 className="modal__title">Éditer la réservation</h2>
        <ReservationForm initial={reservation} submitLabel="Enregistrer" onSubmit={handleSubmit} onCancel={onClose} enforceFuture={false} />
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
