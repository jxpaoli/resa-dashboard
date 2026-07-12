import { useState, useEffect, useRef } from 'react';
import { updateReservation, tableConflict } from '../utils/supabase.js';
import { useToast } from '../context/ToastContext.jsx';
import { REMISES, ZONES, serviceFromHeure } from '../utils/constants.js';
import { TableIcon } from './icons.jsx';

// Modal d'INSTALLATION (page Arrivée) : ouvert au clic sur « Installé ».
// Récap MODIFIABLE : couverts / remise / n° de table (pré-remplis, table focus + sélection).
// Valider = installe la résa ET enregistre couverts + remise + n° de table en base, en une fois.
export default function ModalInstall({ reservation: r, onDone, onClose }) {
  const { notify } = useToast();
  const [couverts, setCouverts] = useState(r.couverts ?? '');
  const [remise, setRemise] = useState(r.remise ?? null);
  const [numero, setNumero] = useState(r.numero_table ?? '');
  const [zone, setZone] = useState(r.zone ?? null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const service = r.service ?? serviceFromHeure(r.heure);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // À l'ouverture : focus + sélection du n° de table (juste à retaper si ce n'est pas le bon)
  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.focus(); el.select(); }
  }, []);

  const num = numero === '' ? null : Number(numero);
  const cov = couverts === '' ? null : Number(couverts);
  const conflit = num != null && num > 0 && tableConflict(num, r.date, service, r.id);

  const submit = async (e) => {
    e.preventDefault();
    if (numero !== '' && (Number.isNaN(num) || num <= 0)) {
      notify('Numéro de table invalide', { type: 'error' });
      return;
    }
    if (cov == null || Number.isNaN(cov) || cov <= 0) {
      notify('Nombre de couverts invalide', { type: 'error' });
      return;
    }
    setSaving(true);
    await updateReservation(r.id, { presence: 'validated', couverts: cov, remise, numero_table: num, zone });
    setSaving(false);
    notify(`${r.nom} — installé${num != null ? ` · table ${String(num).padStart(3, '0')}` : ''}`, { type: 'success' });
    onDone?.();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className="modal__title">{r.nom}{r.prenom ? ` ${r.prenom}` : ''}</h2>
        <p className="modal__sub">{r.heure} · installation</p>

        <form onSubmit={submit}>
          <label className="field">
            <span className="field__label">Couverts</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              className="field__input"
              value={couverts}
              onChange={(e) => setCouverts(e.target.value)}
              placeholder="ex. 4"
            />
          </label>

          <fieldset className="field">
            <span className="field__label">Remise</span>
            <div className="radio-row">
              {REMISES.map((opt) => {
                const active = remise === opt.value;
                return (
                  <label key={opt.value}
                    className={`radio-pill remise-pill ${active ? 'is-active' : ''}`}
                    style={{ background: opt.pale, color: opt.color, borderColor: active ? opt.color : 'transparent' }}>
                    <input type="radio" name="remise-install" value={opt.value} checked={active} onChange={() => setRemise(opt.value)} />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="field">
            <span className="field__label"><TableIcon className="ic-sm" /> N° TABLE</span>
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
            <button type="submit" className="btn btn--validate" disabled={saving}>
              {saving ? '…' : 'Valider l’installation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
