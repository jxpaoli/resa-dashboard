import { useMemo } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { updateReservation } from '../utils/supabase.js';
import { useToast } from '../context/ToastContext.jsx';

// Rang de tri par état de présence (cf. brief) :
// 1. présent (arrivé, service pas encore validé)
// 2. pas encore arrivé
// 3. validé (en bas, opacité réduite)
const rank = (p) => (p === 'present' ? 0 : p === 'validated' ? 2 : 1);

export default function Arrivee() {
  const { reservations, loading } = useReservations();
  const { notify } = useToast();

  const liste = useMemo(() => {
    return reservations
      .filter((r) => r.status === 'validated' && r.numero_table != null)
      .sort((a, b) => rank(a.presence) - rank(b.presence) || (a.heure || '').localeCompare(b.heure || ''));
  }, [reservations]);

  const marquer = async (r, presence, msg) => {
    await updateReservation(r.id, { presence });
    notify(msg, { type: 'success' });
  };

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Liste d'arrivée</h1>
        <p className="page__sub">Réservations validées avec table attribuée.</p>
      </header>

      {loading ? (
        <p className="muted">Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="muted">Aucune réservation prête à l'arrivée.</p>
      ) : (
        <div className="tiles">
          {liste.map((r) => {
            const state = r.presence === 'validated' ? 'valide' : r.presence === 'present' ? 'present' : 'attente';
            return (
              <div key={r.id} className={`arr-tile arr-tile--${state}`}>
                <div className="arr-tile__main">
                  <div className="arr-tile__table">#{r.numero_table}</div>
                  <div className="arr-tile__info">
                    <div className="arr-tile__nom">{r.nom}</div>
                    <div className="arr-tile__meta">
                      {r.date} · {r.heure} · {r.couverts} couv.
                    </div>
                  </div>
                  {r.presence === 'present' && <span className="tag tag--live">Arrivé</span>}
                  {r.presence === 'validated' && <span className="tag tag--ok">Service OK</span>}
                </div>

                {r.presence !== 'validated' && (
                  <div className="arr-tile__actions">
                    <button
                      className="btn btn--present"
                      disabled={r.presence === 'present'}
                      onClick={() => marquer(r, 'present', `${r.nom} marqué arrivé`)}
                    >
                      Arrivé
                    </button>
                    <button
                      className="btn btn--validate"
                      onClick={() => marquer(r, 'validated', `${r.nom} — service validé`)}
                    >
                      Validation
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
