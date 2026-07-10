import { useMemo, useState, useRef, useEffect } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import ModalEditResa from '../components/ModalEditResa.jsx';
import { TableIcon, CouvertIcon } from '../components/icons.jsx';
import { byHeure, remiseMeta, REMISE_INDEFINIE } from '../utils/constants.js';

const pad = (n) => String(n).padStart(2, '0');
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// Événements greffés midi/soir selon l'heure : < 16h = midi, sinon soir
const periodOf = (heure) => ((heure || '') < '16:00' ? 'midi' : 'soir');
const fmtLong = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const BANNER = 56; // hauteur du bandeau haut fixe

// Page LISTE (Directeur) : agenda déroulant des résas validées, à partir d'aujourd'hui.
export default function Liste() {
  const { reservations } = useReservations();
  const [query, setQuery] = useState('');
  const [editResa, setEditResa] = useState(null);
  const [current, setCurrent] = useState({ date: null, service: 'midi' });

  const stickyRef = useRef(null);
  const blockRefs = useRef({});
  const setBlockRef = (key) => (el) => {
    if (el) blockRefs.current[key] = el;
    else delete blockRefs.current[key];
  };

  const aValider = useMemo(
    () => reservations.filter((r) => r.status === 'proposed' && r.source === 'staff').length,
    [reservations]
  );

  const days = useMemo(() => {
    const q = query.trim().toLowerCase();
    const valid = reservations.filter(
      (r) =>
        r.status === 'validated' &&
        r.date >= today() &&
        (!q ||
          (r.nom || '').toLowerCase().includes(q) ||
          (r.prenom || '').toLowerCase().includes(q))
    );
    const byDate = new Map();
    valid.forEach((r) => {
      if (!byDate.has(r.date)) byDate.set(r.date, []);
      byDate.get(r.date).push(r);
    });
    return [...byDate.keys()].sort().map((date) => {
      const list = byDate.get(date);
      const midi = list.filter((r) => periodOf(r.heure) === 'midi').sort(byHeure);
      const soir = list.filter((r) => periodOf(r.heure) === 'soir').sort(byHeure);
      return {
        date,
        midi,
        soir,
        couvMidi: midi.reduce((s, r) => s + Number(r.couverts), 0),
        couvSoir: soir.reduce((s, r) => s + Number(r.couverts), 0),
      };
    });
  }, [reservations, query]);

  // Scroll-spy : détermine le jour + service en tête d'écran
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const stickyH = stickyRef.current?.offsetHeight || 0;
      const threshold = BANNER + stickyH + 6;
      let best = null;
      for (const [key, el] of Object.entries(blockRefs.current)) {
        const top = el.getBoundingClientRect().top;
        if (top <= threshold && (!best || top > best.top)) best = { key, top };
      }
      if (best) {
        const [date, service] = best.key.split('|');
        setCurrent((c) => (c.date === date && c.service === service ? c : { date, service }));
      } else if (days.length) {
        const d0 = days[0];
        const svc = d0.midi.length ? 'midi' : 'soir';
        setCurrent((c) => (c.date === d0.date && c.service === svc ? c : { date: d0.date, service: svc }));
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [days]);

  const scrollToKey = (key) => {
    const el = blockRefs.current[key];
    if (!el) return;
    const stickyH = stickyRef.current?.offsetHeight || 0;
    const y = el.getBoundingClientRect().top + window.scrollY - BANNER - stickyH - 6;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };

  const curDay = days.find((d) => d.date === current.date) || days[0] || null;
  const curIdx = curDay ? days.indexOf(curDay) : -1;

  const gotoDay = (delta) => {
    const idx = curIdx + delta;
    if (idx < 0 || idx >= days.length) return;
    const d = days[idx];
    scrollToKey(`${d.date}|${d.midi.length ? 'midi' : 'soir'}`);
  };
  const gotoService = (svc) => {
    if (!curDay) return;
    if (svc === 'midi' && !curDay.midi.length) return;
    if (svc === 'soir' && !curDay.soir.length) return;
    scrollToKey(`${curDay.date}|${svc}`);
  };

  return (
    <div className="page agenda">
      {/* En-tête collant */}
      <div className="agenda-head" ref={stickyRef}>
        <input
          className="agenda-search"
          placeholder="🔎  Chercher un nom"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {aValider > 0 && <div className="agenda-tovalidate">🔔 {aValider} à valider</div>}

        <div className="agenda-daybar">
          <button className="stepper__btn stepper__btn--sm" onClick={() => gotoDay(-1)} disabled={curIdx <= 0}>−</button>
          <span className="agenda-date">{curDay ? fmtLong(curDay.date) : '—'}</span>
          <button className="stepper__btn stepper__btn--sm" onClick={() => gotoDay(1)} disabled={curIdx < 0 || curIdx >= days.length - 1}>+</button>
          <div className="seg agenda-seg">
            <button className={`seg__btn ${current.service === 'midi' ? 'is-active' : ''}`} onClick={() => gotoService('midi')}>Midi</button>
            <button className={`seg__btn ${current.service === 'soir' ? 'is-active' : ''}`} onClick={() => gotoService('soir')}>Soir</button>
          </div>
        </div>

        <div className="agenda-recap">
          {curDay
            ? <>Midi : <strong>{curDay.couvMidi}</strong> couv · Soir : <strong>{curDay.couvSoir}</strong> couv</>
            : '—'}
        </div>
      </div>

      {/* Corps */}
      {days.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>Aucune réservation à venir.</p>
      ) : (
        days.map((d, i) => (
          <div key={d.date} className="agenda-day">
            {i > 0 && <div className="agenda-day-sep" />}
            {d.midi.length > 0 && (
              <div className="agenda-svc" ref={setBlockRef(`${d.date}|midi`)}>
                <div className="agenda-svc-label">{fmtLong(d.date)} — Midi</div>
                {d.midi.map((r) => <ResaRow key={r.id} r={r} onEdit={setEditResa} />)}
              </div>
            )}
            {d.midi.length > 0 && d.soir.length > 0 && <div className="agenda-svc-sep" />}
            {d.soir.length > 0 && (
              <div className="agenda-svc" ref={setBlockRef(`${d.date}|soir`)}>
                <div className="agenda-svc-label">{fmtLong(d.date)} — Soir</div>
                {d.soir.map((r) => <ResaRow key={r.id} r={r} onEdit={setEditResa} />)}
              </div>
            )}
          </div>
        ))
      )}

      {editResa && <ModalEditResa reservation={editResa} onClose={() => setEditResa(null)} />}
    </div>
  );
}

function ResaRow({ r, onEdit }) {
  const meta = remiseMeta(r.remise) || REMISE_INDEFINIE; // bordure = remise
  const placed = r.numero_table != null;
  return (
    <button
      className={`agenda-row ${placed ? 'is-placed' : ''}`}
      style={{ borderColor: meta.color }}
      onClick={() => onEdit(r)}
    >
      <span className="agenda-row__evt">
        {r.evenement && <span className="rbadge rbadge--evt">🎉</span>}
      </span>
      <span className="agenda-row__h">{r.heure}</span>
      <span className="agenda-row__nom">{r.nom}{r.prenom ? ` ${r.prenom}` : ''}</span>
      <span className="rbadge rbadge--couv"><CouvertIcon className="ic-sm" />{r.couverts}</span>
      {placed ? (
        <span className="rbadge rbadge--table"><TableIcon className="ic-sm" />{String(r.numero_table).padStart(3, '0')}</span>
      ) : (
        <span className="rbadge rbadge--empty">—</span>
      )}
    </button>
  );
}
