import React, { useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_EMAIL = 'admin@gmail.com';
const DEMO_PASS = 'admin1234';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: DEMO_EMAIL, password: DEMO_PASS });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const doLogin = async (email, password) => {
    setErr('');
    setLoading(true);
    try {
      await fetch('https://internship-backend-upan.onrender.com/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      await login(email, password);
      const to = location.state?.from || '/internships';
      navigate(to, { replace: true });
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const submit = e => {
    e.preventDefault();
    if (!form.email || !form.password) return setErr('All fields required');
    doLogin(form.email, form.password);
  };

  const demoLogin = () => {
    if (loading) return;
    setForm({ email: DEMO_EMAIL, password: DEMO_PASS });
    doLogin(DEMO_EMAIL, DEMO_PASS);
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">Login</h1>
        <p className="auth-sub">Demo credentials prefilled. Use Demo Login for instant access.</p>
        {err && <div className="auth-error">{err}</div>}
        <label className="f-label">Email
          <input
            className="f-input"
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            autoComplete="email"
            required
            disabled={loading}
          />
        </label>
        <label className="f-label">Password
          <input
            className="f-input"
            type="password"
            name="password"
            value={form.password}
            onChange={change}
            autoComplete="current-password"
            required
            disabled={loading}
          />
        </label>
        <button className="btn-primary auth-btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
            type="button"
            className="btn-out auth-btn"
            onClick={demoLogin}
            disabled={loading}
            style={{ marginTop: '.5rem' }}
        >
          {loading ? '...' : 'Demo Login'}
        </button>
        <div className="auth-alt">
          No account? <NavLink to="/signup">Sign up</NavLink>
        </div>
      </form>
    </div>
  );
};

export default Login;