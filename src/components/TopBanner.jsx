import { useState, useRef, useEffect } from 'react';
import { Sprig } from './Logo.jsx';

// Bandeau haut : rond utilisateur (à gauche) + logo du restaurant (centré).
// Clic sur le rond → petit menu avec Déconnexion.
export default function TopBanner({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

      <div className="topbanner__spacer" />
    </header>
  );
}
