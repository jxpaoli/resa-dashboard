import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { createReservation } from '../utils/supabase.js';
import { showSystemNotification } from '../utils/notifications.js';
import ReservationForm from './ReservationForm.jsx';

// Modal de création (ouvert par le « + »). Réutilise ReservationForm.
export default function FormulaireModal({ onClose }) {
  const { user, isDirecteur } = useAuth();
  const { notify } = useToast();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (values) => {
    const now = new Date().toISOString();
    const isDir = isDirecteur;
    const payload = {
      ...values,
      source: isDir ? 'directeur' : 'staff',
      status: isDir ? 'validated' : 'proposed',
      created_by: user.id,
      validated_by: isDir ? user.id : null,
      validated_at: isDir ? now : null,
    };
    await createReservation(payload);
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
        <ReservationForm submitLabel="Créer" onSubmit={handleSubmit} onCancel={onClose} enforceFuture />
      </div>
    </div>
  );
}
