import DateStepper from './DateStepper.jsx';

// Filtre commun Date (− / +) + Service (utilisé par Plan).
export default function ServiceFilters({ date, setDate, service, setService }) {
  return (
    <div className="filters">
      <DateStepper date={date} setDate={setDate} />
      <div className="seg">
        {[
          ['midi', 'Midi'],
          ['soir', 'Soir'],
        ].map(([s, label]) => (
          <button key={s} className={`seg__btn ${service === s ? 'is-active' : ''}`} onClick={() => setService(s)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
