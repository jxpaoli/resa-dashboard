import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Protège une route. `role` optionnel = restreint à un rôle précis.
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    // Pas le bon rôle → renvoie vers sa page d'accueil naturelle
    return <Navigate to={user.role === 'directeur' ? '/reservations' : '/formulaire'} replace />;
  }
  return children;
}
