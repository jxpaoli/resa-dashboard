import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isMock } from '../utils/supabase.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      navigate(user.role === 'directeur' ? '/liste' : '/arrivee', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quick = (e, p) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <Logo className="login-logo" />
        <p className="login-sub">Connexion au dashboard</p>

        <label className="field">
          <span className="field__label">Email</span>
          <input
            type="email"
            className="field__input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span className="field__label">Mot de passe</span>
          <input
            type="password"
            className="field__input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="warning" role="alert">{error}</div>}

        <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
          {loading ? '…' : 'Se connecter'}
        </button>

        {isMock && (
          <div className="login-demo">
            <p className="login-demo__title">Comptes de démo</p>
            <div className="login-demo__row">
              <button type="button" className="chip" onClick={() => quick('directeur@resto.fr', 'directeur')}>
                Directeur
              </button>
              <button type="button" className="chip" onClick={() => quick('staff@resto.fr', 'staff')}>
                Staff
              </button>
            </div>
            <p className="login-demo__hint">Clique un compte puis « Se connecter ».</p>
          </div>
        )}
      </form>
    </div>
  );
}
