import { useMemo, useState } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { updateReservation } from '../utils/supabase.js';
import ModalEditResa from '../components/ModalEditResa.jsx';
import { TableIcon, CouvertIcon } from '../components/icons.jsx';
import { byHeure, remiseMeta, REMISE_INDEFINIE } from '../utils/constants.js';

const pad3 = (n) => String(n).padStart(3, '0');
const fmtLong = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// Page À VALIDER (Directeur) : propositions du staff, modèle visuel Liste,
// avec Valider / Refuser directement sur chaque tuile.
export default function Validation() {
  const { reservations, loading } = useReservations();
  const { user } = useAuth();
  const { notify } = useToast();
  const [editResa, setEditResa] = useState(null);

  const groups = useMemo(() => {
    const props = reservations.filter((r) => r.status === 'proposed' && r.source === 'staff');
    const byDate = new Map();
    props.forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, []);
      byDate.get(r.date).push(r);
    });
    return [...byDate.keys()].sort().map((date) => ({ date, list: byDate.get(date).sort(byHeure) }));
  }, [reservations]);

  const valider = async (r) => {
    await updateReservation(r.id, {
      status: 'validated',
      validated_by: user.id,
      validated_at: new Date().toISOString(),
    });
    notify(`${r.nom} validée`, { type: 'success' });
  };
  const refuser = async (r) => {
    await updateReservation(r.id, { status: 'archived' });
    notify(`${r.nom} refusée`, { type: 'info' });
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">À valider</h1>
        <p className="page__sub">Propositions du staff — valide ou refuse directement.</p>
      </header>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : groups.length === 0 ? (
        <p className="muted">Aucune réservation à valider. 🎉</p>
      ) : (
        groups.map((g, i) => (
          <div key={g.date}>
            {i > 0 && <div className="agenda-day-sep" />}
            <div className="agenda-svc-label">{fmtLong(g.date)}</div>
            {g.list.map((r) => (
              <ValTile key={r.id} r={r} onValider={valider} onRefuser={refuser} onEdit={setEditResa} />
            ))}
          </div>
        ))
      )}

      {editResa && <ModalEditResa reservation={editResa} onClose={() => setEditResa(null)} />}
    </div>
  );
}

function ValTile({ r, onValider, onRefuser, onEdit }) {
  const meta = remiseMeta(r.remise) || REMISE_INDEFINIE;
  const placed = r.numero_table != null;
  return (
    <div className="agenda-rowwrap">
      <span className="agenda-strip" style={{ background: meta.color }} aria-hidden="true" />
      <div className="val-tile" onClick={() => onEdit(r)}>
        <div className="val-info">
          <span className="agenda-row__h">{r.heure}</span>
          <span className="val-nom">{r.nom}{r.prenom ? ` ${r.prenom}` : ''}</span>
          <span className="rbadge rbadge--couv"><CouvertIcon className="ic-sm" />{r.couverts}</span>
          {placed ? (
            <span className="rbadge rbadge--table"><TableIcon className="ic-sm" />{pad3(r.numero_table)}</span>
          ) : (
            <span className="rbadge rbadge--empty">—</span>
          )}
        </div>
        <div className="val-actions">
          <button className="btn btn--validate" onClick={(e) => { e.stopPropagation(); onValider(r); }}>Valider</button>
          <button className="btn btn--reject" onClick={(e) => { e.stopPropagation(); onRefuser(r); }}>Refuser</button>
        </div>
      </div>
    </div>
  );
}
