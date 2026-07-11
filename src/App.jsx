import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppNav from './components/AppNav.jsx';
import TopBanner from './components/TopBanner.jsx';
import FormulaireModal from './components/FormulaireModal.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SwipeCube from './components/SwipeCube.jsx';
import Login from './pages/Login.jsx';
import Arrivee from './pages/Arrivee.jsx';
import Liste from './pages/Liste.jsx';
import Tables from './pages/Tables.jsx';
import Validation from './pages/Validation.jsx';
import Clients from './pages/Clients.jsx';

// Toutes les routes, rendues à une "location" donnée (courante ou voisine pour le cube).
function AppRoutes({ location, home }) {
  return (
    <Routes location={location}>
      <Route path="/login" element={<Login />} />
      <Route path="/arrivee" element={<ProtectedRoute><Arrivee /></ProtectedRoute>} />
      <Route path="/liste" element={<ProtectedRoute role="directeur"><Liste /></ProtectedRoute>} />
      <Route path="/tables" element={<ProtectedRoute role="directeur"><Tables /></ProtectedRoute>} />
      <Route path="/validation" element={<ProtectedRoute role="directeur"><Validation /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute role="directeur"><Clients /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setFormOpen(false);
    navigate('/login', { replace: true });
  };

  const home = !user ? '/login' : user.role === 'directeur' ? '/liste' : '/arrivee';

  // Ordre des pages pour le swipe (cube) — mobile
  const pages = user?.role === 'directeur'
    ? ['/liste', '/tables', '/arrivee', '/clients', '/validation']
    : ['/arrivee'];

  return (
    <div className={`app ${user ? 'app--auth' : ''}`}>
      {user && <TopBanner user={user} onLogout={handleLogout} />}
      {user && <AppNav user={user} onNew={() => setFormOpen(true)} />}

      <main className="app__main">
        <SwipeCube pages={pages} render={(loc) => <AppRoutes location={loc} home={home} />} />
      </main>

      {user && formOpen && <FormulaireModal onClose={() => setFormOpen(false)} />}
    </div>
  );
}
