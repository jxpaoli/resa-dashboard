import { useState, useEffect } from 'react';
import { updateReservation, tableConflict } from '../utils/supabase.js';
import { useToast } from '../context/ToastContext.jsx';
import { REMISES } from '../utils/constants.js';

// Modal SERVICE (onglet Tableau de service) : gère la REMISE + le N° de TABLE.
// Warning non bloquant si le n° de table est déjà pris (même date + service).
export default function ModalTable({ reservation, onClose }) {
  const { notify } = useToast();
  const [numero, setNumero] = useState(reservation.numero_table ?? '');
  const [remise, setRemise] = useState(reservation.remise ?? null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const num = numero === '' ? null : Number(numero);
  const conflit =
    num != null && num > 0 &&
    tableConflict(num, reservation.date, reservation.service, reservation.id);

  const submit = async (e) => {
    e.preventDefault();
    if (numero !== '' && (Number.isNaN(num) || num <= 0)) {
      notify('Numéro de table invalide', { type: 'error' });
      return;
    }
    setSaving(true);
    await updateReservation(reservation.id, { numero_table: num, remise });
    setSaving(false);
    notify(`${reservation.nom} — service mis à jour`, { type: 'success' });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="modal__title">Service — {reservation.nom}</h2>
        <p className="modal__sub">
          {reservation.date} · {reservation.service} · {reservation.heure} · {reservation.couverts} couv.
        </p>

        <form onSubmit={submit}>
          <div className="field">
            <span className="field__label">REMISE</span>
            <div className="radio-row">
              <button
                type="button"
                className={`radio-pill ${remise == null ? 'is-active' : ''}`}
                onClick={() => setRemise(null)}
              >
                À définir
              </button>
              {REMISES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`radio-pill ${remise === r.value ? 'is-active' : ''}`}
                  style={remise === r.value ? { borderColor: r.color, color: r.color } : undefined}
                  onClick={() => setRemise(r.value)}
                >
                  {r.short}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field__label">N° TABLE</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              className="field__input field__input--big"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="ex. 12"
            />
          </label>

          {conflit && (
            <div className="warning" role="alert">
              ⚠️ Numéro de table déjà attribué pour ce service. Tu peux confirmer quand même.
            </div>
          )}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? '…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
