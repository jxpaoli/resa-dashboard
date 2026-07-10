// Filtre commun Date + Service (réutilisé par Liste et Tables).
export default function ServiceFilters({ date, setDate, service, setService }) {
  return (
    <div className="filters">
      <label className="field field--inline">
        <span className="field__label">Date</span>
        <input type="date" className="field__input" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="seg">
        {[
          ['midi', 'Midi'],
          ['soir', 'Soir'],
          ['evenement', 'Événement'],
        ].map(([s, label]) => (
          <button key={s} className={`seg__btn ${service === s ? 'is-active' : ''}`} onClick={() => setService(s)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
