import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { updateReservation } from '../utils/supabase.js';
import { SOURCE_LABELS, byHeure } from '../utils/constants.js';
import RemiseBadge from '../components/RemiseBadge.jsx';
import ModalEditResa from '../components/ModalEditResa.jsx';
import ServiceFilters from '../components/ServiceFilters.jsx';
import { TableIcon } from '../components/icons.jsx';

const today = () => new Date().toISOString().slice(0, 10);

// Page LISTE (Directeur) : réservations proposées (à valider) + validées (à éditer).
export default function Liste() {
  const { reservations, loading } = useReservations();
  const { user } = useAuth();
  const { notify } = useToast();

  const [date, setDate] = useState(today());
  const [service, setService] = useState('soir');
  const [editResa, setEditResa] = useState(null);

  const scoped = useMemo(
    () => reservations.filter((r) => r.date === date && r.service === service),
    [reservations, date, service]
  );
  const proposees = useMemo(
    () => scoped.filter((r) => r.status === 'proposed' && r.source === 'staff').sort(byHeure),
    [scoped]
  );
  const validees = useMemo(
    () => scoped.filter((r) => r.status === 'validated').sort(byHeure),
    [scoped]
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
        <h1 className="page__title">Liste</h1>
      </header>

      <ServiceFilters date={date} setDate={setDate} service={service} setService={setService} />

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : (
        <>
          <section className="section">
            <h2 className="section__title">
              Proposées <span className="count">{proposees.length}</span>
            </h2>
            {proposees.length === 0 ? (
              <p className="muted">Aucune proposition en attente.</p>
            ) : (
              <div className="tiles">
                {proposees.map((r) => (
                  <div key={r.id} className="res-tile res-tile--proposed">
                    <div className="res-tile__head">
                      <span className="res-tile__nom">{r.nom}</span>
                      <RemiseBadge value={r.remise} />
                    </div>
                    <div className="res-tile__meta">
                      {r.date} · {r.heure} · {r.couverts} couv. · <span className="src">Staff</span>
                      {r.numero_table != null && (
                        <span className="tablepill"><TableIcon className="ic-sm" />{r.numero_table}</span>
                      )}
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
          </section>

          <section className="section">
            <h2 className="section__title">
              Validées <span className="count">{validees.length}</span>
            </h2>
            {validees.length === 0 ? (
              <p className="muted">Aucune réservation validée pour ce service.</p>
            ) : (
              <div className="tiles">
                {validees.map((r) => (
                  <div key={r.id} className="res-tile">
                    <div className="res-tile__head">
                      <span className="res-tile__nom">{r.nom}</span>
                      <span className="res-tile__badges">
                        <RemiseBadge value={r.remise} />
                        {r.numero_table != null && (
                          <span className="tablepill"><TableIcon className="ic-sm" />{r.numero_table}</span>
                        )}
                      </span>
                    </div>
                    <div className="res-tile__meta">
                      {r.date} · {r.heure} · {r.couverts} couv. ·{' '}
                      <span className="src">{SOURCE_LABELS[r.source] || r.source}</span>
                    </div>
                    {r.notes && <div className="res-tile__notes">📝 {r.notes}</div>}
                    <button className="btn btn--ghost btn--block" onClick={() => setEditResa(r)}>
                      Éditer la réservation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {editResa && <ModalEditResa reservation={editResa} onClose={() => setEditResa(null)} />}
    </div>
  );
}
