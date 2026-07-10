import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { updateReservation } from '../utils/supabase.js';
import { SOURCE_LABELS, byHeure } from '../utils/constants.js';
import RemiseBadge from '../components/RemiseBadge.jsx';
import ModalTable from '../components/ModalTable.jsx';
import ModalEditResa from '../components/ModalEditResa.jsx';

const today = () => new Date().toISOString().slice(0, 10);

export default function Reservations() {
  const { reservations, loading } = useReservations();
  const { user } = useAuth();
  const { notify } = useToast();

  const [tab, setTab] = useState('listes');
  const [date, setDate] = useState(today());
  const [service, setService] = useState('soir');
  const [serviceResa, setServiceResa] = useState(null); // modal remise + table (onglet 2)
  const [editResa, setEditResa] = useState(null);        // modal édition complète (onglet 1)

  // Filtre commun date + service
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
        <h1 className="page__title">Réservations</h1>
      </header>

      {/* Filtres communs */}
      <div className="filters">
        <label className="field field--inline">
          <span className="field__label">Date</span>
          <input type="date" className="field__input" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="seg">
          {['midi', 'soir'].map((s) => (
            <button key={s} className={`seg__btn ${service === s ? 'is-active' : ''}`} onClick={() => setService(s)}>
              {s === 'midi' ? 'Midi' : 'Soir'}
            </button>
          ))}
        </div>
      </div>

      {/* Onglets */}
      <div className="tabs">
        <button className={`tab ${tab === 'listes' ? 'is-active' : ''}`} onClick={() => setTab('listes')}>
          Listes
        </button>
        <button className={`tab ${tab === 'service' ? 'is-active' : ''}`} onClick={() => setTab('service')}>
          Tableau de service
        </button>
      </div>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : tab === 'listes' ? (
        <ListesTab
          proposees={proposees}
          validees={validees}
          onValider={valider}
          onRejeter={rejeter}
          onEdit={setEditResa}
        />
      ) : (
        <ServiceTab validees={validees} onPick={setServiceResa} />
      )}

      {serviceResa && <ModalTable reservation={serviceResa} onClose={() => setServiceResa(null)} />}
      {editResa && <ModalEditResa reservation={editResa} onClose={() => setEditResa(null)} />}
    </div>
  );
}

/* ------------------------- ONGLET 1 : LISTES ------------------------------ */
function ListesTab({ proposees, validees, onValider, onRejeter, onEdit }) {
  return (
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
                  {r.numero_table != null && <span className="tablepill">Table {r.numero_table}</span>}
                </div>
                {r.notes && <div className="res-tile__notes">📝 {r.notes}</div>}
                <div className="res-tile__actions">
                  <button className="btn btn--validate" onClick={() => onValider(r)}>Valider</button>
                  <button className="btn btn--reject" onClick={() => onRejeter(r)}>Rejeter</button>
                </div>
                <button className="btn btn--ghost btn--block" onClick={() => onEdit(r)}>Éditer</button>
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
                    {r.numero_table != null && <span className="tablepill">Table {r.numero_table}</span>}
                  </span>
                </div>
                <div className="res-tile__meta">
                  {r.date} · {r.heure} · {r.couverts} couv. ·{' '}
                  <span className="src">{SOURCE_LABELS[r.source] || r.source}</span>
                </div>
                {r.notes && <div className="res-tile__notes">📝 {r.notes}</div>}
                <button className="btn btn--ghost btn--block" onClick={() => onEdit(r)}>
                  Éditer la réservation
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/* --------------------- ONGLET 2 : TABLEAU DE SERVICE ---------------------- */
function ServiceCase({ title, color, resas, onPick }) {
  return (
    <div className="svc-case">
      <div className="svc-case__head" style={{ borderColor: color, color }}>
        {title} <span className="count">{resas.length}</span>
      </div>
      <div className="svc-case__body">
        {resas.length === 0 ? (
          <p className="muted small">—</p>
        ) : (
          resas.map((r) => (
            <button key={r.id} className="svc-item" onClick={() => onPick(r)}>
              <span className="svc-item__h">{r.heure}</span>
              <span className="svc-item__n">{r.nom}</span>
              <span className="svc-item__c">{r.couverts}c</span>
              {r.numero_table != null && <span className="svc-item__t">T{r.numero_table}</span>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function ServiceTab({ validees, onPick }) {
  const g30 = validees.filter((r) => r.remise === '-30%');
  const g50 = validees.filter((r) => r.remise === '-50%');
  const gPlein = validees.filter((r) => r.remise === 'plein' || r.remise == null);

  // Récap : groupé par nombre de couverts
  const recap = useMemo(() => {
    const map = new Map();
    validees.forEach((r) => map.set(r.couverts, (map.get(r.couverts) || 0) + 1));
    const rows = [...map.entries()].sort((a, b) => a[0] - b[0]);
    const total = validees.reduce((s, r) => s + Number(r.couverts), 0);
    return { rows, total };
  }, [validees]);

  return (
    <>
      <div className="svc-grid">
        <div className="svc-col-left">
          <ServiceCase title="Remise -30%" color="#4f46e5" resas={g30} onPick={onPick} />
        </div>
        <div className="svc-col-right">
          <ServiceCase title="Remise -50%" color="#f97316" resas={g50} onPick={onPick} />
          <ServiceCase title="Plein tarif" color="#06b6d4" resas={gPlein} onPick={onPick} />
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
  );
}
