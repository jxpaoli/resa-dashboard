import { NavLink } from 'react-router-dom';
import { PlusIcon, ReservationsIcon, TableIcon, ArriveeIcon, CheckIcon, ClientsIcon } from './icons.jsx';
import { useReservations } from '../hooks/useReservations.js';

// Navigation responsive (logo + déconnexion dans le bandeau haut).
//  - Desktop : sidebar à gauche — Valider EN HAUT, puis Liste · Plan · Arrivée · Clients
//  - Mobile  : barre en bas — [+] Liste · Plan · Arrivée · Clients · Valider (à droite)
// Staff : uniquement Arrivée.
function linkClass({ isActive }) {
  return `naventry ${isActive ? 'is-active' : ''}`;
}

export default function AppNav({ user, onNew }) {
  const isDir = user.role === 'directeur';
  const { reservations } = useReservations();
  const aValider = isDir
    ? reservations.filter((r) => r.status === 'proposed' && r.source === 'staff').length
    : 0;

  const valider = isDir && (
    <NavLink key="valider" to="/validation" className={linkClass}>
      <span className="naventry__ic-wrap">
        <CheckIcon className="ic" />
        {aValider > 0 && <span className="naventry__badge">{aValider}</span>}
      </span>
      <span>Valider</span>
    </NavLink>
  );
  const liste = isDir && (
    <NavLink key="liste" to="/liste" className={linkClass}><ReservationsIcon className="ic" /><span>Liste</span></NavLink>
  );
  const plan = isDir && (
    <NavLink key="plan" to="/tables" className={linkClass}><TableIcon className="ic" /><span>Plan</span></NavLink>
  );
  const arrivee = (
    <NavLink key="arrivee" to="/arrivee" className={linkClass}><ArriveeIcon className="ic" /><span>Arrivée</span></NavLink>
  );
  const clients = isDir && (
    <NavLink key="clients" to="/clients" className={linkClass}><ClientsIcon className="ic" /><span>Clients</span></NavLink>
  );

  return (
    <>
      {/* Desktop : sidebar — Valider en haut */}
      <aside className="sidebar">
        <button className="sidebar__new" onClick={onNew}>
          <PlusIcon className="ic" /> Nouvelle réservation
        </button>
        <nav className="sidebar__nav">
          {valider}{liste}{plan}{arrivee}{clients}
        </nav>
      </aside>

      {/* Mobile : barre en bas — + à gauche, Valider à droite */}
      <nav className="bottombar">
        <button className="bottombar__fab" onClick={onNew} aria-label="Nouvelle réservation">
          <PlusIcon className="bottombar__fabic" />
        </button>
        {liste}{plan}{arrivee}{clients}{valider}
      </nav>
    </>
  );
}
