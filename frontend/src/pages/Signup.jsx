import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const API_BASE = 'https://internship-backend-upan.onrender.com';

const Signup = () => {
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const change = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    setErr('');
    if (!form.email || !form.password || !form.confirm) return setErr('All fields required');
    if (form.password !== form.confirm) return setErr('Passwords do not match');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Signup failed');
      localStorage.setItem('token', json.token);
      localStorage.setItem('user', JSON.stringify({ id: json.user.id, email: json.user.email }));
      if (json.user.profile) {
        localStorage.setItem('profile', JSON.stringify(json.user.profile));
      }
      navigate('/profile', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1 className="auth-title">Sign Up</h1>
        <p className="auth-sub">Create your account.</p>
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
            autoComplete="new-password"
            disabled={loading}
            required
            minLength={6}
          />
        </label>
        <label className="f-label">Confirm Password
          <input
            className="f-input"
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={change}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={loading}
            required
            minLength={6}
          />
        </label>
        <button className="btn-primary auth-btn" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
        <div className="auth-alt">
          Have an account? <NavLink to="/login">Login</NavLink>
        </div>
      </form>
    </div>
  );
};

export default Signup;