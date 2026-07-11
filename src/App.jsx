import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppNav from './components/AppNav.jsx';
import TopBanner from './components/TopBanner.jsx';
import FormulaireModal from './components/FormulaireModal.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Arrivee from './pages/Arrivee.jsx';
import Liste from './pages/Liste.jsx';
import Tables from './pages/Tables.jsx';
import Validation from './pages/Validation.jsx';
import Clients from './pages/Clients.jsx';

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formOpen, setFormOpen] = useState(false);
  const touch = useRef(null);

  const handleLogout = () => {
    logout();
    setFormOpen(false);
    navigate('/login', { replace: true });
  };

  const home = !user ? '/login' : user.role === 'directeur' ? '/liste' : '/arrivee';

  // Swipe horizontal (mobile) → page précédente / suivante
  const pages = user?.role === 'directeur'
    ? ['/liste', '/tables', '/arrivee', '/clients', '/validation']
    : ['/arrivee'];

  // Sens de l'animation selon la direction de navigation
  const [dir, setDir] = useState('fwd');
  const prevIdx = useRef(-1);
  useEffect(() => {
    const idx = pages.indexOf(location.pathname);
    setDir(idx >= 0 && prevIdx.current >= 0 && idx < prevIdx.current ? 'back' : 'fwd');
    prevIdx.current = idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const start = touch.current;
    touch.current = null;
    if (!start || formOpen || document.querySelector('.modal-overlay')) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return; // swipe horizontal net
    const idx = pages.indexOf(location.pathname);
    if (idx < 0) return;
    const next = dx < 0 ? idx + 1 : idx - 1; // gauche = suivant, droite = précédent
    if (next >= 0 && next < pages.length) navigate(pages[next]);
  };

  return (
    <div className={`app ${user ? 'app--auth' : ''}`}>
      {user && <TopBanner user={user} onLogout={handleLogout} />}
      {user && <AppNav user={user} onNew={() => setFormOpen(true)} />}

      <main className="app__main" onTouchStart={user ? onTouchStart : undefined} onTouchEnd={user ? onTouchEnd : undefined}>
        <div key={location.pathname} className={`page-anim page-anim--${dir}`}>
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route
            path="/arrivee"
            element={
              <ProtectedRoute>
                <Arrivee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/liste"
            element={
              <ProtectedRoute role="directeur">
                <Liste />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tables"
            element={
              <ProtectedRoute role="directeur">
                <Tables />
              </ProtectedRoute>
            }
          />
          <Route
            path="/validation"
            element={
              <ProtectedRoute role="directeur">
                <Validation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute role="directeur">
                <Clients />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
        </div>
      </main>

      {user && formOpen && <FormulaireModal onClose={() => setFormOpen(false)} />}
    </div>
  );
}
