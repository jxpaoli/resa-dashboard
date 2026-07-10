import { NavLink } from 'react-router-dom';
import { PlusIcon, ReservationsIcon, TableIcon, ArriveeIcon, CheckIcon } from './icons.jsx';
import { useReservations } from '../hooks/useReservations.js';

// Navigation responsive (logo + déconnexion sont dans le bandeau haut).
//  - Desktop : barre latérale à gauche
//  - Mobile  : barre en bas, le gros « + » à gauche ouvre le formulaire
// Entrées Directeur : Liste · Plan · Arrivée · À valider   (Staff : Arrivée)
export default function AppNav({ user, onNew }) {
  const isDir = user.role === 'directeur';
  const { reservations } = useReservations();
  const aValider = isDir
    ? reservations.filter((r) => r.status === 'proposed' && r.source === 'staff').length
    : 0;

  const links = (
    <>
      {isDir && (
        <NavLink to="/liste" className={linkClass}>
          <ReservationsIcon className="ic" />
          <span>Liste</span>
        </NavLink>
      )}
      {isDir && (
        <NavLink to="/tables" className={linkClass}>
          <TableIcon className="ic" />
          <span>Plan</span>
        </NavLink>
      )}
      <NavLink to="/arrivee" className={linkClass}>
        <ArriveeIcon className="ic" />
        <span>Arrivée</span>
      </NavLink>
      {isDir && (
        <NavLink to="/validation" className={linkClass}>
          <span className="naventry__ic-wrap">
            <CheckIcon className="ic" />
            {aValider > 0 && <span className="naventry__badge">{aValider}</span>}
          </span>
          <span>Valider</span>
        </NavLink>
      )}
    </>
  );

  return (
    <>
      {/* ---------- Desktop : sidebar ---------- */}
      <aside className="sidebar">
        <button className="sidebar__new" onClick={onNew}>
          <PlusIcon className="ic" /> Nouvelle réservation
        </button>
        <nav className="sidebar__nav">{links}</nav>
      </aside>

      {/* ---------- Mobile : bottom bar (+ à gauche) ---------- */}
      <nav className="bottombar">
        <button className="bottombar__fab" onClick={onNew} aria-label="Nouvelle réservation">
          <PlusIcon className="bottombar__fabic" />
        </button>
        {links}
      </nav>
    </>
  );
}

function linkClass({ isActive }) {
  return `naventry ${isActive ? 'is-active' : ''}`;
}
