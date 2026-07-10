import { useMemo } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { updateReservation } from '../utils/supabase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { TableIcon, CouvertIcon } from '../components/icons.jsx';

// États de présence :
//   null        -> en attente        (haut, blanc)
//   'present'   -> arrivé en attente (haut, vert, badge)
//   'validated' -> installé          (bas, vert)
//   'noshow'    -> no show           (bas, rouge)   [directeur]
//   'annule'    -> annulé            (bas, orange)  [directeur]
const HAUT = new Set([null, undefined, 'present']);
const BADGE = {
  present: ['Arrivé en attente', 'arr-badge--present'],
  installe: ['Installé', 'arr-badge--installe'],
  noshow: ['No show', 'arr-badge--noshow'],
  annule: ['Annulé', 'arr-badge--annule'],
};
const stateOf = (p) =>
  p === 'present' ? 'present'
  : p === 'validated' ? 'installe'
  : p === 'noshow' ? 'noshow'
  : p === 'annule' ? 'annule'
  : 'attente';

export default function Arrivee() {
  const { reservations, loading } = useReservations();
  const { isDirecteur } = useAuth();
  const { notify } = useToast();

  const ordered = useMemo(() => {
    const liste = reservations.filter((r) => r.status === 'validated' && r.numero_table != null);
    // Haut : non validés (attente + arrivés) triés par nom (alphabétique)
    const haut = liste
      .filter((r) => HAUT.has(r.presence ?? null))
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
    // Bas : traités, ordre chronologique (ordre de traitement)
    const bas = liste
      .filter((r) => !HAUT.has(r.presence ?? null))
      .sort((a, b) => (a.updated_at || '').localeCompare(b.updated_at || ''));
    return [...haut, ...bas];
  }, [reservations]);

  const marquer = async (r, presence, msg) => {
    await updateReservation(r.id, { presence });
    notify(msg, { type: 'info' });
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Liste d'arrivée</h1>
        <p className="page__sub">Réservations validées avec table attribuée.</p>
      </header>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : ordered.length === 0 ? (
        <p className="muted">Aucune réservation prête à l'arrivée.</p>
      ) : (
        <div className="tiles">
          {ordered.map((r) => {
            const state = stateOf(r.presence);
            const badge = BADGE[state];
            return (
              <div key={r.id} className={`arr-tile arr-tile--${state}`}>
                <div className="arr-tile__body">
                  <div className="arr-tile__tabletag">
                    <TableIcon className="ic-sm" />
                    {r.numero_table}
                  </div>
                  <div className="arr-tile__nom">{r.nom}</div>
                  <div className="arr-tile__meta">
                    {r.heure} · <CouvertIcon className="ic-sm" />{r.couverts} couv.
                  </div>
                  {badge && <span className={`arr-badge ${badge[1]}`}>{badge[0]}</span>}
                </div>

                {state === 'attente' && (
                  <div className="arr-tile__actions">
                    <div className="arr-tile__row">
                      <button className="btn btn--present" onClick={() => marquer(r, 'present', `${r.nom} — arrivé`)}>
                        Arrivé
                      </button>
                      <button className="btn btn--validate" onClick={() => marquer(r, 'validated', `${r.nom} — installé`)}>
                        Validé
                      </button>
                    </div>
                    {isDirecteur && (
                      <div className="arr-tile__row">
                        <button className="btn btn--reject" onClick={() => marquer(r, 'noshow', `${r.nom} — no show`)}>
                          No show
                        </button>
                        <button className="btn btn--annule" onClick={() => marquer(r, 'annule', `${r.nom} — annulé`)}>
                          Annulé
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {state === 'present' && (
                  <div className="arr-tile__actions">
                    <button className="btn btn--validate btn--block" onClick={() => marquer(r, 'validated', `${r.nom} — installé`)}>
                      Validé
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
