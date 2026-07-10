import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as doLogin, logout as doLogout, getCurrentUser, onAuthChange } from '../utils/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getCurrentUser()
      .then((u) => { if (alive) { setUser(u); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    const unsub = onAuthChange((u) => { if (alive) setUser(u); });
    return () => { alive = false; unsub(); };
  }, []);

  const login = useCallback(async (email, password) => {
    const u = await doLogin(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await doLogout();
    setUser(null);
  }, []);

  const isDirecteur = user?.role === 'directeur';
  const isStaff = user?.role === 'staff';

  if (loading) {
    return (
      <div className="login-page">
        <p className="muted">Chargement…</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isDirecteur, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
