import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [form,setForm]=useState({ email:'', password:'', confirm:'' });
  const [err,setErr]=useState('');
  const navigate = useNavigate();

  const change = e => setForm({...form,[e.target.name]:e.target.value});
  const submit = e => {
    e.preventDefault();
    setErr('');
    if(!form.email || !form.password || !form.confirm) return setErr('All fields required');
    if(form.password !== form.confirm) return setErr('Passwords do not match');
    // Placeholder registration success
    setTimeout(()=> navigate('/login'), 400);
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
        <label className="f-label">Confirm Password
          <input
            className="f-input"
            type="password"
            name="confirm"
            value={form.confirm}
            onChange={change}
            placeholder="••••••••"
          />
        </label>
        <button className="btn-primary auth-btn" type="submit">Create Account</button>
        <div className="auth-alt">
          Have an account? <NavLink to="/login">Login</NavLink>
        </div>
      </form>
    </div>
  );
};
export default Signup;