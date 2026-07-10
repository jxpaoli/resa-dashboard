import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import ModalTable from '../components/ModalTable.jsx';
import ServiceFilters from '../components/ServiceFilters.jsx';
import { TableIcon, CouvertIcon } from '../components/icons.jsx';
import { byHeure, remiseMeta, REMISE_INDEFINIE } from '../utils/constants.js';

const today = () => new Date().toISOString().slice(0, 10);

// Page TABLES (Directeur) : attribution des tables.
// Classement PAR REMISE en 2 colonnes (brief d'origine) :
//   gauche = -30%  ·  droite haut = -50%  ·  droite bas = Plein tarif
// Tuiles-cartes : bord = couleur remise, fond vert + badge quand table posée.
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

  const g30 = validees.filter((r) => r.remise === '-30%');
  const g50 = validees.filter((r) => r.remise === '-50%');
  const gPlein = validees.filter((r) => r.remise === 'plein' || r.remise == null);

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
      ) : (
        <>
          <div className="svc-grid">
            <div className="svc-col-left">
              <Zone title="Remise -30%" color="#4f46e5" resas={g30} onPick={setPicked} />
            </div>
            <div className="svc-col-right">
              <Zone title="Remise -50%" color="#f97316" resas={g50} onPick={setPicked} />
              <Zone title="Plein tarif" color="#06b6d4" resas={gPlein} onPick={setPicked} />
            </div>
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

function Zone({ title, color, resas, onPick }) {
  return (
    <div className="svc-case">
      <div className="svc-case__head" style={{ borderColor: color, color }}>
        {title} <span className="count">{resas.length}</span>
      </div>
      <div className="svc-case__body">
        {resas.length === 0 ? (
          <p className="muted small">—</p>
        ) : (
          resas.map((r) => <PlaceTile key={r.id} r={r} onPick={onPick} />)
        )}
      </div>
    </div>
  );
}

function PlaceTile({ r, onPick }) {
  const meta = remiseMeta(r.remise) || REMISE_INDEFINIE;
  const placed = r.numero_table != null;
  return (
    <button
      className={`place-tile ${placed ? 'is-placed' : ''}`}
      style={{ borderColor: meta.color }}
      onClick={() => onPick(r)}
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
}
