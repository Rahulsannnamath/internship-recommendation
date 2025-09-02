import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (!form.email || !form.password) return setErr('All fields required');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Login failed');
      // Persist auth
      localStorage.setItem('token', json.token);
      localStorage.setItem('user', JSON.stringify({ id: json.user.id, email: json.user.email }));
      // Optional: store profile
      if (json.user.profile) {
        localStorage.setItem('profile', JSON.stringify(json.user.profile));
      }
      // Redirect to intended protected route or dashboard
      const redirectTo = location.state?.from || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">Login</h1>
        <p className="auth-sub">Access your dashboard.</p>
        {err && <div className="auth-error">{err}</div>}
        <label className="f-label">Email
          <input
            className="f-input"
            type="email"
            name="email"
            value={form.email}
            onChange={change}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />
        </label>
        <label className="f-label">Password
          <input
            className="f-input"
            type="password"
            name="password"
            value={form.password}
            onChange={change}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            required
          />
        </label>
        <button className="btn-primary auth-btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="auth-alt">
          No account? <NavLink to="/signup">Sign up</NavLink>
        </div>
      </form>
    </div>
  );
};

export default Login;