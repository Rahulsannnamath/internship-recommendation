import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LineChart, Briefcase, Sun, Moon, LogIn, UserPlus, User, MessageCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Internships from './pages/Internships.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ChatBot from './components/chat/ChatBot.jsx';

const App = () => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <BrowserRouter>
      <div className="shell">
        <nav className="topbar">
          <div className="logo">Intern<span>Match</span></div>
          <div className="nav-links">
            <NavLink to="/" end className="nav-item">
              <LineChart size={18} /> <span>Dashboard</span>
            </NavLink>
            <NavLink to="/internships" className="nav-item">
              <Briefcase size={18} /> <span>Internships</span>
            </NavLink>
            <NavLink to="/profile" className="nav-item">
              <User size={18} /> <span>Profile</span>
            </NavLink>
            <NavLink to="/chat" className="nav-item">
              <MessageCircle size={18} /> <span>chat</span>
            </NavLink>
          </div>
          <div className="actions">
            <NavLink to="/login" className="nav-item">
              <LogIn size={18} />
              <span>Login</span>
            </NavLink>
            <NavLink to="/signup" className="nav-item">
              <UserPlus size={18} />
              <span>Sign Up</span>
            </NavLink>
            <button className="mode-btn" onClick={() => setDark(d => !d)}>
              {dark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </main>
        <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </BrowserRouter>
  );
};

export default App;
