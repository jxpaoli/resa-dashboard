import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { updateReservation } from '../utils/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { TableIcon, CouvertIcon } from '../components/icons.jsx';
import ModalArrivee from '../components/ModalArrivee.jsx';

const pad = (n) => String(n).padStart(2, '0');
const pad3 = (n) => String(n).padStart(3, '0');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const periodOf = (h) => ((h || '') < '16:00' ? 'midi' : 'soir');
const fmtLong = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const isDone = (p) => p === 'validated' || p === 'noshow' || p === 'annule';
const STATUS = {
  present: ['Arrivé', 'arr-badge--present'],
  validated: ['Installé', 'arr-badge--installe'],
  noshow: ['No show', 'arr-badge--noshow'],
  annule: ['Annulé', 'arr-badge--annule'],
};
const LABELS = { present: 'arrivé', validated: 'installé', noshow: 'no show', annule: 'annulé', null: 'remis en attente' };
const byNom = (a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr');

// Page ARRIVÉE : liste du service (midi OU soir), triée par nom.
// Non installés en haut (alpha) ; installés/no-show/annulés en bas, grisés.
export default function Arrivee() {
  const { reservations, loading } = useReservations();
  const { isDirecteur } = useAuth();
  const { notify } = useToast();
  const [picked, setPicked] = useState(null);
  const [service, setService] = useState(() => (new Date().getHours() < 16 ? 'midi' : 'soir'));

  const t = today();
  const { ordered, couv } = useMemo(() => {
    const list = reservations.filter(
      (r) => r.status === 'validated' && r.date === t && periodOf(r.heure) === service
    );
    const actifs = list.filter((r) => !isDone(r.presence)).sort(byNom);
    const finis = list.filter((r) => isDone(r.presence)).sort(byNom);
    return { ordered: [...actifs, ...finis], couv: list.reduce((s, r) => s + Number(r.couverts), 0) };
  }, [reservations, t, service]);

  const setPresence = async (r, presence) => {
    await updateReservation(r.id, { presence });
    notify(`${r.nom} — ${LABELS[presence] ?? 'mis à jour'}`, { type: 'info' });
  };

  return (
    <div className="page agenda">
      <div className="agenda-head">
        <div className="arr-headline">{fmtLong(t)}</div>
        <div className="arr-head-row">
          <div className="seg">
            {['midi', 'soir'].map((s) => (
              <button key={s} className={`seg__btn ${service === s ? 'is-active' : ''}`} onClick={() => setService(s)}>
                {s === 'midi' ? 'Midi' : 'Soir'}
              </button>
            ))}
          </div>
          <div className="arr-head-recap"><strong>{couv}</strong> couv.</div>
        </div>
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Chargement…</p>
      ) : ordered.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>Aucune réservation ce service.</p>
      ) : (
        <div className="arr2-list">
          {ordered.map((r) => (
            <ArrTile key={r.id} r={r} onOpen={setPicked} onInstall={(x) => setPresence(x, 'validated')} />
          ))}
        </div>
      )}

      {picked && (
        <ModalArrivee
          reservation={picked}
          isDirecteur={isDirecteur}
          onAction={async (presence) => { await setPresence(picked, presence); setPicked(null); }}
          onClose={() => setPicked(null)}
        />
      )}
    </div>
  );
}

function ArrTile({ r, onOpen, onInstall }) {
  const done = isDone(r.presence);
  const st = STATUS[r.presence];
  return (
    <div className={`arr2-tile ${done ? 'is-done' : ''}`} onClick={() => onOpen(r)}>
      <div className="arr2-top">
        <span className="arr2-nom">{r.nom}{r.prenom ? ` ${r.prenom}` : ''}</span>
        {r.numero_table != null ? (
          <span className="arr2-table"><TableIcon className="ic-md" />{pad3(r.numero_table)}</span>
        ) : (
          <span className="arr2-table arr2-table--none">—</span>
        )}
      </div>
      <div className="arr2-bottom">
        <span className="arr2-couv"><CouvertIcon className="ic-sm" />{r.couverts} couv.</span>
        <span className="arr2-heure">{r.heure}</span>
        {st && <span className={`arr-badge ${st[1]}`}>{st[0]}</span>}
        <span className="arr2-spacer" />
        {!done && (
          <button className="btn btn--present arr2-install" onClick={(e) => { e.stopPropagation(); onInstall(r); }}>
            Installé
          </button>
        )}
      </div>
    </div>
  );
}
