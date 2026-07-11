import { useState, useEffect } from 'react';
import { updateClient } from '../utils/supabase.js';
import { useReservations } from '../hooks/useReservations.js';
import { useToast } from '../context/ToastContext.jsx';
import { serviceLabel } from '../utils/constants.js';

const CIVILITES = ['M.', 'Mme', 'Entreprise'];

// Fiche client : édition + historique des réservations (rapproché par téléphone).
export default function ModalClient({ client, onClose, onSaved }) {
  const { reservations } = useReservations();
  const { notify } = useToast();
  const [f, setF] = useState({
    civilite: client.civilite || '',
    nom: client.nom || '',
    prenom: client.prenom || '',
    email: client.email || '',
    telephone: client.telephone || '',
    notes: client.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const history = reservations
    .filter((r) => client.telephone && r.telephone === client.telephone)
    .sort((a, b) => (b.date + b.heure).localeCompare(a.date + a.heure));

  const save = async () => {
    if (!f.nom) { notify('Le nom est obligatoire', { type: 'error' }); return; }
    setSaving(true);
    try {
      await updateClient(client.id, f);
      notify('Fiche client mise à jour', { type: 'success' });
      onSaved();
    } catch (e) {
      setSaving(false);
      notify('Erreur (numéro déjà utilisé ?)', { type: 'error' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide modal--form" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="modal__title">Fiche client</h2>

        <fieldset className="field">
          <span className="field__label">Civilité</span>
          <div className="radio-row radio-row--sm">
            {CIVILITES.map((c) => (
              <label key={c} className={`radio-pill radio-pill--sm ${f.civilite === c ? 'is-active' : ''}`}>
                <input type="radio" name="civ-client" value={c} checked={f.civilite === c} onChange={set('civilite')} />
                {c}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field-row">
          <label className="field"><span className="field__label">Nom *</span>
            <input className="field__input" value={f.nom} onChange={set('nom')} /></label>
          <label className="field"><span className="field__label">Prénom</span>
            <input className="field__input" value={f.prenom} onChange={set('prenom')} /></label>
        </div>
        <div className="field-row">
          <label className="field"><span className="field__label">Email</span>
            <input type="email" className="field__input" value={f.email} onChange={set('email')} /></label>
          <label className="field"><span className="field__label">Téléphone</span>
            <input type="tel" className="field__input" value={f.telephone} onChange={set('telephone')} /></label>
        </div>
        <label className="field"><span className="field__label">Notes</span>
          <textarea className="field__input" rows="2" value={f.notes} onChange={set('notes')} /></label>

        <div className="field">
          <span className="field__label">Historique ({history.length})</span>
          <div className="client-hist">
            {history.length === 0 ? (
              <p className="muted small" style={{ margin: 0 }}>Aucune réservation.</p>
            ) : (
              history.slice(0, 30).map((r) => (
                <div key={r.id} className="client-hist__row">
                  <span>{r.date} · {r.heure}</span>
                  <span>{r.couverts} couv. · {serviceLabel(r.service)}</span>
                  <span className="muted small">{r.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Fermer</button>
          <button type="button" className="btn btn--primary" disabled={saving} onClick={save}>{saving ? '…' : 'Enregistrer'}</button>
        </div>
      </div>
    </div>
  );
}
