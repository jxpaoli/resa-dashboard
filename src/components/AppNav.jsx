import { NavLink } from 'react-router-dom';
import { PlusIcon, ReservationsIcon, TableIcon, ArriveeIcon } from './icons.jsx';

// Navigation responsive (logo + déconnexion sont dans le bandeau haut).
//  - Desktop : barre latérale à gauche
//  - Mobile  : barre en bas, le gros « + » tout à DROITE ouvre le formulaire
// Entrées Directeur : Liste · Tables · Arrivée   (Staff : Arrivée)
export default function AppNav({ user, onNew }) {
  const isDir = user.role === 'directeur';

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

      {/* ---------- Mobile : bottom bar (+ à droite) ---------- */}
      <nav className="bottombar">
        {links}
        <button className="bottombar__fab" onClick={onNew} aria-label="Nouvelle réservation">
          <PlusIcon className="bottombar__fabic" />
        </button>
      </nav>
    </>
  );
}

function linkClass({ isActive }) {
  return `naventry ${isActive ? 'is-active' : ''}`;
}
