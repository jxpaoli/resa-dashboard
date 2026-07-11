import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprig } from './Logo.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { enablePush, isPushEnabled, pushAvailable } from '../utils/notifications.js';

// Bandeau haut : rond utilisateur (gauche) + logo (centre) + cloche notifs (droite).
// La cloche (directeur) active les notifications push sur cet appareil.
export default function TopBanner({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { notify } = useToast();
  const isDir = user.role === 'directeur';

  useEffect(() => {
    if (isDir) isPushEnabled().then(setPushOn);
  }, [isDir]);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const initials =
    (user.nom || '?').replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  const toggleNotif = async () => {
    if (!pushAvailable()) { notify('Notifications push non disponibles ici', { type: 'info' }); return; }
    if (pushOn) { notify('Notifications déjà activées 🔔', { type: 'info' }); return; }
    const res = await enablePush(user);
    if (res.ok) { setPushOn(true); notify('Notifications activées 🔔', { type: 'success' }); }
    else if (res.reason === 'denied') notify('Le navigateur a bloqué les notifications', { type: 'error' });
    else notify('Notifications indisponibles', { type: 'error' });
  };

  return (
    <header className="topbanner">
      <div className="topbanner__user" ref={ref}>
        <button className="avatar" onClick={() => setOpen((o) => !o)} aria-label="Mon compte">{initials}</button>
        {open && (
          <div className="usermenu" role="menu">
            <div className="usermenu__name">{user.nom}</div>
            <div className="usermenu__role">{user.role}</div>
            {isDir && (
              <button className="btn btn--ghost btn--block btn--sm" style={{ marginBottom: 6 }}
                onClick={() => { setOpen(false); navigate('/clients'); }}>
                Clients
              </button>
            )}
            <button className="btn btn--ghost btn--block btn--sm" onClick={onLogout}>Déconnexion</button>
          </div>
        )}
      </div>

      <div className="topbanner__logo">
        <Sprig className="topbanner__sprig" />
        <span className="topbanner__word">Aux Terrasses de Troinex</span>
      </div>

      {isDir ? (
        <button
          className={`topbanner__notif ${pushOn ? 'is-on' : ''}`}
          onClick={toggleNotif}
          title={pushOn ? 'Notifications activées' : 'Activer les notifications'}
          aria-label="Notifications"
        >
          🔔
        </button>
      ) : (
        <div className="topbanner__spacer" />
      )}
    </header>
  );
}
