import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LineChart, Briefcase, Sun, Moon, LogIn, UserPlus, User, MessageCircle, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Internships from './pages/Internships.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

const AppShellNav = ({ dark, setDark }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const isAuthed = !!(token || user);

  const handleLogoutLink = (e) => {
    e.preventDefault();
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="topbar">
      <div className="logo">Intern<span>Match</span></div>
      <div className="nav-links">
        <NavLink to="/dashboard" className="nav-item"><LineChart size={18} /><span>Dashboard</span></NavLink>
        <NavLink to="/internships" className="nav-item"><Briefcase size={18} /><span>Internships</span></NavLink>
        <NavLink to="/profile" className="nav-item"><User size={18} /><span>Profile</span></NavLink>
        <NavLink to="/chat" className="nav-item"><MessageCircle size={18} /><span>Chat</span></NavLink>
      </div>
      <div className="actions">
        {isAuthed ? (
          <NavLink
            to="/login"
            className="nav-item"
            onClick={handleLogoutLink}
            title="Logout"
          >
            <LogOut size={18} /><span>Logout</span>
          </NavLink>
        ) : (
          <>
            <NavLink to="/login" className="nav-item">
              <LogIn size={18} /><span>Login</span>
            </NavLink>
            <NavLink to="/signup" className="nav-item">
              <UserPlus size={18} /><span>Sign Up</span>
            </NavLink>
          </>
        )}
        <button
          type="button"
          className="nav-item mode-btn"
          onClick={() => setDark(d => !d)}
          title="Toggle theme"
        >
          {dark ? <Sun size={18}/> : <Moon size={18}/> }
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
  const { user, token } = useAuth();
  const isAuthed = !!(user || token);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="shell">
      <AppShellNav dark={dark} setDark={setDark} />
      <main className="main">
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/internships" element={<ProtectedRoute><Internships /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/login" element={isAuthed ? <Navigate to="/internships" replace /> : <Login />} />
          <Route path="/signup" element={isAuthed ? <Navigate to="/internships" replace /> : <Signup />} />
          <Route path="/" element={<Navigate to={isAuthed ? '/internships' : '/login'} replace />} />
          <Route path="*" element={<Navigate to={isAuthed ? '/internships' : '/login'} replace />} />
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
