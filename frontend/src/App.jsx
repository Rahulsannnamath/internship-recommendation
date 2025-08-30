import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { MessageCircle, LineChart, Briefcase, UserCircle2, Sun, Moon } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Internships from './pages/Internships.jsx';
import Profile from './pages/Profile.jsx';
import ChatBot from './components/chat/ChatBot.jsx';

const App = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [dark, setDark] = useState(false);

  React.useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
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
              <UserCircle2 size={18} /> <span>Profile</span>
            </NavLink>
          </div>
          <div className="actions">
            <button className="mode-btn" onClick={() => setDark(d => !d)}>
              {dark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
            <button className="chat-btn" onClick={() => setChatOpen(true)}>
              <MessageCircle size={18} />
              <span className="hide-sm">Chat</span>
            </button>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
        <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />
        <button className="fab" onClick={() => setChatOpen(true)} aria-label="Chat">
          <MessageCircle size={22}/>
        </button>
      </div>
    </BrowserRouter>
  );
};

export default App;
