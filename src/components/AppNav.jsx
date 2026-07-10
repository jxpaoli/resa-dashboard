import { NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import { PlusIcon, ReservationsIcon, TableIcon, ArriveeIcon, LogoutIcon } from './icons.jsx';

// Navigation responsive :
//  - Desktop : barre latérale à gauche
//  - Mobile  : barre en bas, le gros « + » tout à DROITE ouvre le formulaire (modal)
// Entrées Directeur : Liste · Tables · Arrivée   (Staff : Arrivée)
export default function AppNav({ user, onNew, onLogout }) {
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
          <span>Tables</span>
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
        <div className="sidebar__logo">
          <Logo light />
        </div>

        <button className="sidebar__new" onClick={onNew}>
          <PlusIcon className="ic" /> Nouvelle réservation
        </button>

        <nav className="sidebar__nav">{links}</nav>

        <div className="sidebar__foot">
          <div className="sidebar__user">{user.nom}</div>
          <button className="sidebar__logout" onClick={onLogout}>
            <LogoutIcon className="ic" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ---------- Mobile : bottom bar (+ à droite) ---------- */}
      <nav className="bottombar">
        {links}
        <button className="naventry" onClick={onLogout}>
          <LogoutIcon className="ic" />
          <span>Sortir</span>
        </button>
        <button className="bottombar__fab" onClick={onNew} aria-label="Nouvelle réservation">
          <PlusIcon className="bottombar__fabic" />
        </button>
      </nav>
    </>
  );
}

// classe pour NavLink (desktop + mobile partagent la même structure via CSS)
function linkClass({ isActive }) {
  return `naventry ${isActive ? 'is-active' : ''}`;
}
