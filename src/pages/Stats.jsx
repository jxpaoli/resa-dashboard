import { useMemo } from 'react';
import { useReservations } from '../hooks/useReservations.js';
import { remiseMeta, SOURCE_LABELS, serviceFromHeure } from '../utils/constants.js';

// Capacité de référence pour la jauge de remplissage (pointe évoquée par le resto).
const CAPACITE_JOUR = 145;
const NB_JOURS_GRAPHE = 14;

const pad = (n) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const addDays = (iso, n) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
};
const jourLong = (iso) => {
  const s = new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const jourCourt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
const isMidi = (r) => (r.service || serviceFromHeure(r.heure)) === 'midi';
const sum = (arr, f) => arr.reduce((a, r) => a + (Number(f(r)) || 0), 0);

export default function Stats() {
  const { reservations, loading } = useReservations();

  const k = useMemo(() => {
    const t = today();
    const val = reservations.filter((r) => r.status === 'validated');
    const fut = val.filter((r) => r.date >= t);

    const todayVal = val.filter((r) => r.date === t);
    const couvToday = sum(todayVal, (r) => r.couverts);
    const midiToday = sum(todayVal.filter(isMidi), (r) => r.couverts);

    const semaine = val.filter((r) => r.date >= t && r.date <= addDays(t, 6));
    const couv7 = sum(semaine, (r) => r.couverts);

    const aValider = reservations.filter((r) => r.status === 'proposed' && r.source === 'staff').length;

    const jours = Array.from({ length: NB_JOURS_GRAPHE }, (_, i) => {
      const iso = addDays(t, i);
      const dv = val.filter((r) => r.date === iso);
      const midi = sum(dv.filter(isMidi), (r) => r.couverts);
      const soir = sum(dv, (r) => r.couverts) - midi;
      return { iso, midi, soir, total: midi + soir };
    });
    const maxJour = Math.max(1, ...jours.map((j) => j.total));

    const totCouvFut = sum(fut, (r) => r.couverts) || 1;
    const remises = ['plein', '-30%', '-50%'].map((v) => {
      const c = sum(fut.filter((r) => (r.remise || 'plein') === v), (r) => r.couverts);
      const meta = remiseMeta(v);
      return { v, label: meta ? meta.short : v, color: meta ? meta.color : '#999', couv: c, pct: Math.round((c / totCouvFut) * 100) };
    });

    const provColors = { thefork: 'var(--primary)', wix: 'var(--gold)', directeur: 'var(--present)', staff: 'var(--muted)' };
    const totFut = fut.length || 1;
    const provenance = ['thefork', 'wix', 'directeur', 'staff']
      .map((s) => ({ s, label: SOURCE_LABELS[s], color: provColors[s], count: fut.filter((r) => r.source === s).length }))
      .filter((p) => p.count > 0)
      .map((p) => ({ ...p, pct: Math.round((p.count / totFut) * 100) }));

    const clientsUniques = new Set(fut.map((r) => (r.telephone || '').trim()).filter(Boolean)).size;
    const tailleMoy = fut.length ? sum(fut, (r) => r.couverts) / fut.length : 0;

    return {
      t, couvToday, midiToday, soirToday: couvToday - midiToday, resaToday: todayVal.length,
      couv7, moy7: Math.round(couv7 / 7), aValider, jours, maxJour, remises, provenance,
      clientsUniques, tailleMoy, nbFut: fut.length,
    };
  }, [reservations]);

  if (loading) return <div className="page"><p className="muted" style={{ padding: 24 }}>Chargement…</p></div>;

  const fill = Math.min(100, Math.round((k.couvToday / CAPACITE_JOUR) * 100));

  return (
    <div className="page">
      <header className="page__header">
        <h1 className="page__title">Statistiques</h1>
        <p className="page__sub">Vue d’ensemble · {jourLong(k.t)}</p>
      </header>

      {/* Tuiles KPI */}
      <div className="kpi-grid">
        <div className="kpi-tile">
          <span className="kpi-tile__lab">Couverts aujourd’hui</span>
          <span className="kpi-tile__val">{k.couvToday}</span>
          <span className="kpi-tile__sub">Midi {k.midiToday} · Soir {k.soirToday}</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-tile__lab">Réservations du jour</span>
          <span className="kpi-tile__val">{k.resaToday}</span>
          <span className="kpi-tile__sub">table{k.resaToday > 1 ? 's' : ''} attendue{k.resaToday > 1 ? 's' : ''}</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-tile__lab">7 prochains jours</span>
          <span className="kpi-tile__val">{k.couv7}</span>
          <span className="kpi-tile__sub">couverts · ~{k.moy7}/jour</span>
        </div>
        <div className={`kpi-tile ${k.aValider > 0 ? 'kpi-tile--alert' : ''}`}>
          <span className="kpi-tile__lab">À valider</span>
          <span className="kpi-tile__val">{k.aValider}</span>
          <span className="kpi-tile__sub">demande{k.aValider > 1 ? 's' : ''} en attente</span>
        </div>
      </div>

      {/* Jauge de remplissage du jour */}
      <div className="kpi-card">
        <div className="kpi-card__head">
          <span className="kpi-card__title">Remplissage du jour</span>
          <span className="kpi-card__meta">{k.couvToday} / {CAPACITE_JOUR} couverts</span>
        </div>
        <div className="gauge"><div className="gauge__fill" style={{ width: `${fill}%` }} /></div>
        <div className="kpi-card__foot"><span className="muted">Capacité de référence {CAPACITE_JOUR}</span><strong>{fill}%</strong></div>
      </div>

      {/* Graphe couverts / jour */}
      <div className="kpi-card">
        <div className="kpi-card__head">
          <span className="kpi-card__title">Couverts par jour</span>
          <span className="kpi-legend">
            <i style={{ background: 'var(--primary)' }} />Midi
            <i style={{ background: 'var(--gold)' }} />Soir
          </span>
        </div>
        <div className="kpi-bars">
          {k.jours.map((j, i) => (
            <div className={`kpi-bars__col ${i === 0 ? 'is-today' : ''}`} key={j.iso} title={`${jourLong(j.iso)} — ${j.total} couverts`}>
              <span className="kpi-bars__num">{j.total || ''}</span>
              <div className="kpi-bars__stack">
                <div className="kpi-bars__soir" style={{ height: `${(j.soir / k.maxJour) * 100}%` }} />
                <div className="kpi-bars__midi" style={{ height: `${(j.midi / k.maxJour) * 100}%` }} />
              </div>
              <span className="kpi-bars__day">{Number(j.iso.slice(8, 10))}</span>
              <span className="kpi-bars__wd">{i === 0 ? 'auj.' : jourCourt(j.iso)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Répartitions */}
      <div className="kpi-two">
        <div className="kpi-card">
          <div className="kpi-card__head"><span className="kpi-card__title">Remises</span><span className="kpi-card__meta">à venir</span></div>
          {k.remises.map((r) => (
            <div className="kpi-break" key={r.v}>
              <span className="kpi-break__lab">{r.label}</span>
              <div className="kpi-break__track"><div className="kpi-break__bar" style={{ width: `${r.pct}%`, background: r.color }} /></div>
              <span className="kpi-break__val">{r.pct}%</span>
            </div>
          ))}
        </div>

        <div className="kpi-card">
          <div className="kpi-card__head"><span className="kpi-card__title">Provenance</span><span className="kpi-card__meta">à venir</span></div>
          {k.provenance.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Aucune donnée</p>}
          {k.provenance.map((p) => (
            <div className="kpi-break" key={p.s}>
              <span className="kpi-break__lab">{p.label}</span>
              <div className="kpi-break__track"><div className="kpi-break__bar" style={{ width: `${p.pct}%`, background: p.color }} /></div>
              <span className="kpi-break__val">{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Petites tuiles */}
      <div className="kpi-grid kpi-grid--2">
        <div className="kpi-tile">
          <span className="kpi-tile__lab">Clients distincts</span>
          <span className="kpi-tile__val">{k.clientsUniques}</span>
          <span className="kpi-tile__sub">sur les réservations à venir</span>
        </div>
        <div className="kpi-tile">
          <span className="kpi-tile__lab">Taille moyenne</span>
          <span className="kpi-tile__val">{k.tailleMoy.toFixed(1)}</span>
          <span className="kpi-tile__sub">couverts / réservation</span>
        </div>
      </div>
    </div>
  );
}
