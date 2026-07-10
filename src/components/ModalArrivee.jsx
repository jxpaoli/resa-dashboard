import { useEffect } from 'react';

const STATUS = {
  present: ['Arrivé', 'arr-badge--present'],
  validated: ['Installé', 'arr-badge--installe'],
  noshow: ['No show', 'arr-badge--noshow'],
  annule: ['Annulé', 'arr-badge--annule'],
};

// Modal ouvert au clic sur une résa (page Arrivée) : note d'info + boutons d'action.
// Boutons inactifs = grisés à leur place (No show / Annulé réservés au directeur).
export default function ModalArrivee({ reservation: r, isDirecteur, onAction, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const p = r.presence ?? null;
  const processed = p === 'validated' || p === 'noshow' || p === 'annule';
  const st = STATUS[p];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="modal__title">{r.nom}{r.prenom ? ` ${r.prenom}` : ''}</h2>
        <p className="modal__sub">
          {r.heure} · {r.couverts} couv. ·{' '}
          {r.numero_table != null ? `Table ${String(r.numero_table).padStart(3, '0')}` : 'pas de table'}
        </p>

        {st && <span className={`arr-badge ${st[1]}`}>{st[0]}</span>}
        {r.notes && <div className="res-tile__notes" style={{ marginTop: 12 }}>📝 {r.notes}</div>}

        <div className="arr-modal-actions">
          <button className="btn btn--present" disabled={p !== null} onClick={() => onAction('present')}>Arrivé</button>
          <button className="btn btn--validate" disabled={!(p === null || p === 'present')} onClick={() => onAction('validated')}>Installé</button>
          <button className="btn btn--reject" disabled={!(isDirecteur && p === null)} onClick={() => onAction('noshow')}>No show</button>
          <button className="btn btn--annule" disabled={!(isDirecteur && (p === null || p === 'present'))} onClick={() => onAction('annule')}>Annulé</button>
        </div>

        {processed && (
          <button className="btn btn--ghost btn--block" onClick={() => onAction(null)}>↩ Rétablir (remettre en attente)</button>
        )}
        <button className="btn btn--ghost btn--block" style={{ marginTop: 8 }} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}
