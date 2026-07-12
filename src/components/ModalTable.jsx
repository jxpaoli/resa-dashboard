import { useState, useEffect, useRef } from 'react';
import { updateReservation, tableConflict } from '../utils/supabase.js';
import { useToast } from '../context/ToastContext.jsx';
import { REMISES, ZONES } from '../utils/constants.js';

// Modal SERVICE (page Plan) : gère la REMISE + le N° de TABLE.
// Warning non bloquant si le n° de table est déjà pris (même date + service).
export default function ModalTable({ reservation, onClose }) {
  const { notify } = useToast();
  const [numero, setNumero] = useState(reservation.numero_table ?? '');
  const [remise, setRemise] = useState(reservation.remise ?? null);
  const [zone, setZone] = useState(reservation.zone ?? null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // À l'ouverture : focus + sélection du n° de table (juste à saisir pour changer)
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.focus(); el.select(); }
  }, []);

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
    await updateReservation(reservation.id, { numero_table: num, remise, zone });
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
          <fieldset className="field">
            <span className="field__label">Remise</span>
            <div className="radio-row">
              {REMISES.map((r) => {
                const active = remise === r.value;
                return (
                  <label key={r.value}
                    className={`radio-pill remise-pill ${active ? 'is-active' : ''}`}
                    style={{ background: r.pale, color: r.color, borderColor: active ? r.color : 'transparent' }}>
                    <input type="radio" name="remise-plan" value={r.value} checked={active} onChange={() => setRemise(r.value)} />
                    {r.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="field">
            <span className="field__label">N° TABLE</span>
            <input
              ref={inputRef}
              type="number"
              min="1"
              inputMode="numeric"
              className="field__input field__input--big"
              value={numero}
              onChange={(e) => { const v = e.target.value; setNumero(v); if (v !== '') setZone(null); }}
              placeholder="ex. 12"
            />
          </label>

          <fieldset className="field">
            <span className="field__label">Zone</span>
            <div className="zone-grid">
              {ZONES.map((z) => (
                <button
                  key={z}
                  type="button"
                  className={`zone-btn ${zone === z ? 'is-active' : ''}`}
                  onClick={() => setZone((cur) => { const next = cur === z ? null : z; if (next) setNumero(''); return next; })}
                >
                  {z}
                </button>
              ))}
            </div>
          </fieldset>

          {conflit && (
            <div className="warning" role="alert">
              ⚠️ Numéro de table déjà attribué pour ce service. Tu peux confirmer quand même.
            </div>
          )}

          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? '…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
