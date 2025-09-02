import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { NavLink, useNavigate } from 'react-router-dom';

const Topbar = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  const [email, setEmail] = useState('');

  useEffect(() => {
    const sync = () => {
      const t = localStorage.getItem('token');
      setAuthed(!!t);
      const uRaw = localStorage.getItem('user');
      try { setEmail(uRaw ? JSON.parse(uRaw).email : ''); } catch { setEmail(''); }
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    setAuthed(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="topbar">
      <div className="logo">Intern<span>Rec</span></div>

      <nav className="nav-links">
        <NavLink to="/dashboard" className="nav-item">Dashboard</NavLink>
        <NavLink to="/internships" className="nav-item">Internships</NavLink>
        <NavLink to="/chat" className="nav-item">Chat</NavLink>
        {authed && <NavLink to="/profile" className="nav-item">Profile</NavLink>}
      </nav>

      <div className="actions">
        {!authed && (
          <>
            <NavLink to="/login" className="nav-item">Login</NavLink>
            <NavLink to="/signup" className="nav-item">Sign Up</NavLink>
          </>
        )}
        {authed && (
          <>
            {email && <span className="nav-item" style={{cursor:'default', opacity:.8}}>{email}</span>}
            <button type="button" className="nav-item" onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Topbar;