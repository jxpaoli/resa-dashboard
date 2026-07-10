import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Formulaire from './pages/Formulaire.jsx';
import Arrivee from './pages/Arrivee.jsx';
import Reservations from './pages/Reservations.jsx';

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      <Navbar />
      <main className="app__main">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/formulaire"
            element={
              <ProtectedRoute>
                <Formulaire />
              </ProtectedRoute>
            }
          />
          <Route
            path="/arrivee"
            element={
              <ProtectedRoute>
                <Arrivee />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservations"
            element={
              <ProtectedRoute role="directeur">
                <Reservations />
              </ProtectedRoute>
            }
          />

          {/* Redirection racine selon rôle */}
          <Route
            path="*"
            element={
              <Navigate
                to={!user ? '/login' : user.role === 'directeur' ? '/reservations' : '/formulaire'}
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
