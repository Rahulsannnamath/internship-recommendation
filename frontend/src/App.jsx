import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LineChart, Briefcase, Sun, Moon, LogIn, UserPlus, User, MessageCircle } from 'lucide-react';

// Context (needed for Profile if it uses useAuth)
import { AuthProvider } from './context/AuthContext.jsx';

// Pages (adjust paths if different)
import Dashboard from './pages/Dashboard.jsx';
import Internships from './pages/Internships.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

const AppShellNav = ({ dark, setDark }) => {
  return (
    <nav className="topbar">
      <div className="logo">Intern<span>Match</span></div>
      <div className="nav-links">
        <NavLink to="/dashboard" className="nav-item">
          <LineChart size={18} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/internships" className="nav-item">
          <Briefcase size={18} /> <span>Internships</span>
        </NavLink>
        <NavLink to="/profile" className="nav-item">
          <User size={18} /> <span>Profile</span>
        </NavLink>
        <NavLink to="/chat" className="nav-item">
          <MessageCircle size={18} /> <span>Chat</span>
        </NavLink>
      </div>
      <div className="actions">
        <NavLink to="/login" className="nav-item">
          <LogIn size={18} /> <span>Login</span>
        </NavLink>
        <NavLink to="/signup" className="nav-item">
          <UserPlus size={18} /> <span>Sign Up</span>
        </NavLink>
        <button className="mode-btn" onClick={() => setDark(d => !d)}>
          {dark ? <Sun size={18}/> : <Moon size={18}/>}
        </button>
      </div>
    </nav>
  );
};

const AppInner = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="shell">
      <AppShellNav dark={dark} setDark={setDark} />
      <main className="main">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />}/>
          <Route path="/internships" element={<Internships />}/>
          <Route path="/profile" element={<Profile />}/>
          <Route path="/chat" element={<Chat />}/>
          <Route path="/login" element={<Login />}/>
          <Route path="/signup" element={<Signup />}/>
          <Route path="/" element={<Navigate to="/dashboard" replace />}/>
          <Route path="*" element={<Navigate to="/dashboard" replace />}/>
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
