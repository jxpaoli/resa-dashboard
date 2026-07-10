import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { updateReservation } from '../utils/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { TableIcon, CouvertIcon } from '../components/icons.jsx';
import ModalArrivee from '../components/ModalArrivee.jsx';
import { byHeure } from '../utils/constants.js';

const pad = (n) => String(n).padStart(2, '0');
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
const STATUS = {
  present: ['Arrivé', 'arr-badge--present'],
  validated: ['Installé', 'arr-badge--installe'],
  noshow: ['No show', 'arr-badge--noshow'],
  annule: ['Annulé', 'arr-badge--annule'],
};
const LABELS = { present: 'arrivé', validated: 'installé', noshow: 'no show', annule: 'annulé', null: 'remis en attente' };

// Page ARRIVÉE (Staff + Directeur) : les résas validées du jour, modèle Liste.
// Clic sur une tuile → modal avec les boutons d'action + la note.
export default function Arrivee() {
  const { reservations, loading } = useReservations();
  const { isDirecteur } = useAuth();
  const { notify } = useToast();
  const [picked, setPicked] = useState(null);

  const t = today();
  const jour = useMemo(() => {
    const list = reservations.filter((r) => r.status === 'validated' && r.date === t);
    const midi = list.filter((r) => periodOf(r.heure) === 'midi').sort(byHeure);
    const soir = list.filter((r) => periodOf(r.heure) === 'soir').sort(byHeure);
    return {
      midi,
      soir,
      couvMidi: midi.reduce((s, r) => s + Number(r.couverts), 0),
      couvSoir: soir.reduce((s, r) => s + Number(r.couverts), 0),
    };
  }, [reservations, t]);

  const setPresence = async (r, presence) => {
    await updateReservation(r.id, { presence });
    notify(`${r.nom} — ${LABELS[presence] ?? 'mis à jour'}`, { type: 'info' });
  };

  const total = jour.midi.length + jour.soir.length;

  return (
    <div className="page agenda">
      <div className="agenda-head">
        <div className="arr-headline">{fmtLong(t)}</div>
        <div className="agenda-recap">
          Midi : <strong>{jour.couvMidi}</strong> couv · Soir : <strong>{jour.couvSoir}</strong> couv
        </div>
      </div>

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>Chargement…</p>
      ) : total === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>Aucune réservation aujourd'hui.</p>
      ) : (
        <>
          {jour.midi.length > 0 && (
            <div className="agenda-svc">
              <div className="agenda-svc-label">Midi</div>
              {jour.midi.map((r) => <ArrRow key={r.id} r={r} onOpen={setPicked} />)}
            </div>
          )}
          {jour.midi.length > 0 && jour.soir.length > 0 && <div className="agenda-svc-sep" />}
          {jour.soir.length > 0 && (
            <div className="agenda-svc">
              <div className="agenda-svc-label">Soir</div>
              {jour.soir.map((r) => <ArrRow key={r.id} r={r} onOpen={setPicked} />)}
            </div>
          )}
        </>
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

function ArrRow({ r, onOpen }) {
  const st = STATUS[r.presence];
  const placed = r.numero_table != null;
  return (
    <button className="agenda-row" onClick={() => onOpen(r)}>
      <span className="agenda-row__h">{r.heure}</span>
      <span className="agenda-row__main">
        <span className="agenda-row__nom">{r.nom}{r.prenom ? ` ${r.prenom}` : ''}</span>
        {st && <span className={`arr-badge ${st[1]}`}>{st[0]}</span>}
      </span>
      <span className="rbadge rbadge--couv"><CouvertIcon className="ic-sm" />{r.couverts}</span>
      {placed ? (
        <span className="rbadge rbadge--table"><TableIcon className="ic-sm" />{String(r.numero_table).padStart(3, '0')}</span>
      ) : (
        <span className="rbadge rbadge--empty">—</span>
      )}
    </button>
  );
}
