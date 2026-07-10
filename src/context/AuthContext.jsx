import { createContext, useContext, useState, useCallback } from 'react';
import { login as doLogin, logout as doLogout, getStoredUser } from '../utils/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());

  const login = useCallback(async (email, password) => {
    const u = await doLogin(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  const isDirecteur = user?.role === 'directeur';
  const isStaff = user?.role === 'staff';

  return (
    <AuthContext.Provider value={{ user, login, logout, isDirecteur, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
