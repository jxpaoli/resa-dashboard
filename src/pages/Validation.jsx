import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { updateReservation } from '../utils/supabase.js';
import RemiseBadge from '../components/RemiseBadge.jsx';
import ModalEditResa from '../components/ModalEditResa.jsx';
import { serviceLabel } from '../utils/constants.js';

// Page VALIDATION (Directeur) : les réservations proposées par le Staff, à valider ou rejeter.
export default function Validation() {
  const { reservations, loading } = useReservations();
  const { user } = useAuth();
  const { notify } = useToast();
  const [editResa, setEditResa] = useState(null);

  const proposees = useMemo(
    () =>
      reservations
        .filter((r) => r.status === 'proposed' && r.source === 'staff')
        .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure)),
    [reservations]
  );

  const valider = async (r) => {
    await updateReservation(r.id, {
      status: 'validated',
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    });
    notify(`${r.nom} validée`, { type: 'success' });
  };
  const rejeter = async (r) => {
    await updateReservation(r.id, { status: 'archived' });
    notify(`${r.nom} rejetée`, { type: 'info' });
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">À valider</h1>
        <p className="page__sub">Réservations proposées par le staff.</p>
      </header>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : proposees.length === 0 ? (
        <p className="muted">Aucune réservation à valider. 🎉</p>
      ) : (
        <div className="tiles">
          {proposees.map((r) => (
            <div key={r.id} className="res-tile res-tile--proposed">
              <div className="res-tile__head">
                <span className="res-tile__nom">{r.nom}{r.prenom ? ` ${r.prenom}` : ''}</span>
                <RemiseBadge value={r.remise} />
              </div>
              <div className="res-tile__meta">
                {r.date} · {r.heure} · {r.couverts} couv. · {serviceLabel(r.service)}
              </div>
              {r.notes && <div className="res-tile__notes">📝 {r.notes}</div>}
              <div className="res-tile__actions">
                <button className="btn btn--validate" onClick={() => valider(r)}>Valider</button>
                <button className="btn btn--reject" onClick={() => rejeter(r)}>Rejeter</button>
              </div>
              <button className="btn btn--ghost btn--block" onClick={() => setEditResa(r)}>Éditer</button>
            </div>
          ))}
        </div>
      )}

      {editResa && <ModalEditResa reservation={editResa} onClose={() => setEditResa(null)} />}
    </div>
  );
}
