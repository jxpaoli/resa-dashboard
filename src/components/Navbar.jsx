import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Sprig } from './Logo.jsx';

export default function Navbar() {
  const { user, logout, isDirecteur } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <Sprig light className="navbar__sprig" />
        <span className="navbar__wordmark">Aux Terrasses de Troinex</span>
      </div>

      <div className="navbar__links">
        <NavLink to="/formulaire" className="navlink">Formulaire</NavLink>
        <NavLink to="/arrivee" className="navlink">Arrivée</NavLink>
        {isDirecteur && (
          <NavLink to="/reservations" className="navlink">Réservations</NavLink>
        )}
      </div>

      <div className="navbar__user">
        <span className="navbar__name">{user.nom}</span>
        <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
