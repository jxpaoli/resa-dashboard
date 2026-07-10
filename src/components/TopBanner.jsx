import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprig } from './Logo.jsx';
import { useReservations } from '../hooks/useReservations.js';

// Bandeau haut : rond utilisateur (gauche) + logo (centre) + cloche « à valider » (droite).
// La cloche est présente sur toutes les pages et mène à la page de validation.
export default function TopBanner({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { reservations } = useReservations();

  const isDir = user.role === 'directeur';
  const aValider = isDir
    ? reservations.filter((r) => r.status === 'proposed' && r.source === 'staff').length
    : 0;

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const initials =
    (user.nom || '?')
      .replace(/[^\p{L}\s]/gu, '')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <header className="topbanner">
      <div className="topbanner__user" ref={ref}>
        <button className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Mon compte">
          {initials}
        </button>
        {open && (
          <div className="usermenu" role="menu">
            <div className="usermenu__name">{user.nom}</div>
            <div className="usermenu__role">{user.role}</div>
            <button className="btn btn--ghost btn--block btn--sm" onClick={onLogout}>
              Déconnexion
            </button>
          </div>
        )}
      </div>

      <div className="topbanner__logo">
        <Sprig className="topbanner__sprig" />
        <span className="topbanner__word">Aux Terrasses de Troinex</span>
      </div>

      {isDir ? (
        <button
          className="topbanner__notif"
          onClick={() => navigate('/validation')}
          title={`${aValider} réservation(s) à valider`}
          aria-label="À valider"
        >
          🔔
          {aValider > 0 && <span className="topbanner__notif-count">{aValider}</span>}
        </button>
      ) : (
        <div className="topbanner__spacer" />
      )}
    </header>
  );
}
