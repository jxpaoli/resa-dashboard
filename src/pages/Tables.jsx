import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import ModalTable from '../components/ModalTable.jsx';
import ServiceFilters from '../components/ServiceFilters.jsx';
import { TableIcon, CouvertIcon } from '../components/icons.jsx';
import { byHeure, remiseMeta, REMISE_INDEFINIE } from '../utils/constants.js';

const today = () => new Date().toISOString().slice(0, 10);

// Page TABLES (Directeur) : attribution des tables.
// Grille 2 colonnes. Bord de tuile = couleur de la remise.
// Fond blanc -> vert clair une fois la table attribuée (+ badge n° table).
export default function Tables() {
  const { reservations, loading } = useReservations();
  const [date, setDate] = useState(today());
  const [service, setService] = useState('soir');
  const [picked, setPicked] = useState(null);

  const validees = useMemo(
    () =>
      reservations
        .filter((r) => r.date === date && r.service === service && r.status === 'validated')
        .sort(byHeure),
    [reservations, date, service]
  );

  const recap = useMemo(() => {
    const map = new Map();
    validees.forEach((r) => map.set(r.couverts, (map.get(r.couverts) || 0) + 1));
    const rows = [...map.entries()].sort((a, b) => a[0] - b[0]);
    const total = validees.reduce((s, r) => s + Number(r.couverts), 0);
    return { rows, total };
  }, [validees]);

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Tables</h1>
      </header>

      <ServiceFilters date={date} setDate={setDate} service={service} setService={setService} />

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : validees.length === 0 ? (
        <p className="muted">Aucune réservation validée pour ce service.</p>
      ) : (
        <>
          <div className="place-grid">
            {validees.map((r) => {
              const meta = remiseMeta(r.remise) || REMISE_INDEFINIE;
              const placed = r.numero_table != null;
              return (
                <button
                  key={r.id}
                  className={`place-tile ${placed ? 'is-placed' : ''}`}
                  style={{ borderColor: meta.color }}
                  onClick={() => setPicked(r)}
                >
                  <div className="place-tile__top">
                    <span className="place-tile__h">{r.heure}</span>
                    {placed && (
                      <span className="place-tile__badge">
                        <TableIcon className="ic-sm" />
                        {r.numero_table}
                      </span>
                    )}
                  </div>
                  <div className="place-tile__nom">{r.nom}</div>
                  <div className="place-tile__cov">
                    <CouvertIcon className="ic-sm" />
                    {r.couverts} couv.
                  </div>
                </button>
              );
            })}
          </div>

          <div className="recap">
            <div className="recap__pills">
              {recap.rows.map(([couverts, n]) => (
                <span key={couverts} className="pill">
                  {n} de {couverts} couvert{couverts > 1 ? 's' : ''}
                </span>
              ))}
            </div>
            <div className="recap__total">TOTAL : {recap.total} couverts</div>
          </div>
        </>
      )}

      {picked && <ModalTable reservation={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}
