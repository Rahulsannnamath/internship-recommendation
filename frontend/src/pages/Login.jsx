import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Login = () => {
  const [form,setForm]=useState({ email:'', password:'' });
  const [err,setErr]=useState('');
  const navigate = useNavigate();

  const change = e => setForm({...form,[e.target.name]:e.target.value});
  const submit = e => {
    e.preventDefault();
    setErr('');
    if(!form.email || !form.password) return setErr('All fields required');
    // Placeholder auth success
    setTimeout(()=> navigate('/'), 300);
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
          />
        </label>
        <button className="btn-primary auth-btn" type="submit">Login</button>
        <div className="auth-alt">
          No account? <NavLink to="/signup">Sign up</NavLink>
        </div>
      </form>
    </div>
  );
};
export default Login;