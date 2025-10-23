import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { skillLevels } from '../data/mockData.js';
import StatCard from '../components/stats/StatCard.jsx';
import { Zap, Briefcase, CheckCircle, TrendingUp } from 'lucide-react';
import MatchGauge from '../components/charts/MatchGauge.jsx';
import SkillRadar from '../components/charts/SkillRadar.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    matchStrength: 0,
    totalApplications: 0,
    acceptedApplications: 0,
    profileCompleteness: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [topMatches, setTopMatches] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch recent applications
      const appsRes = await fetch(`${API_BASE}/api/dashboard/recent-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const appsData = await appsRes.json();
      setRecentApplications(appsData.applications || []);

      // Fetch top matches
      const matchesRes = await fetch(`${API_BASE}/api/dashboard/top-matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const matchesData = await matchesRes.json();
      setTopMatches(matchesData.matches || []);

      // Fetch profile
      const profileRes = await fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      setProfile(profileData);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="view">
        <h1 className="page-title">Dashboard</h1>
        <div className="panel">
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-soft)' }}>
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Quick overview of your internship journey.</p>

      <div className="stats-grid">
        <StatCard 
          icon={<Zap size={18}/>} 
          label="Profile Strength" 
          value={stats.matchStrength + '%'} 
          accent="blue" 
        />
        <StatCard 
          icon={<Briefcase size={18}/>} 
          label="Applications" 
          value={stats.totalApplications} 
          accent="green" 
        />
        <StatCard 
          icon={<CheckCircle size={18}/>} 
          label="Accepted" 
          value={stats.acceptedApplications} 
          accent="emerald" 
        />
        <StatCard 
          icon={<TrendingUp size={18}/>} 
          label="Success Rate" 
          value={stats.totalApplications > 0 
            ? Math.round((stats.acceptedApplications / stats.totalApplications) * 100) + '%' 
            : '0%'} 
          accent="purple" 
        />
      </div>

      <div className="grid mt">
        <div className="panel">
          <div className="panel-head"><h2>Profile Strength</h2></div>
          <MatchGauge value={stats.matchStrength} />
          {stats.matchStrength < 80 && (
            <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-soft)' }}>
              Complete your profile to improve your match strength!
            </div>
          )}
        </div>
        
        <div className="panel">
          <div className="panel-head"><h2>Skill Radar</h2></div>
          <SkillRadar skills={skillLevels} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Top Matches</h2>
            <button 
              className="btn-out tiny"
              onClick={() => navigate('/internships')}
            >
              View All
            </button>
          </div>
          {topMatches.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-soft)' }}>
              Complete your profile to see personalized matches
            </div>
          ) : (
            <ul className="list">
              {topMatches.map(t => (
                <li key={t._id} className="list-item">
                  <div>
                    <div className="li-title">{t.title}</div>
                    <div className="li-meta">{t.company} • {(t.location || []).join(', ')}</div>
                  </div>
                  <span className="badge">{t.matchPercentage}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Recent Applications</h2>
            <button 
              className="btn-out tiny"
              onClick={() => navigate('/applications')}
            >
              View All
            </button>
          </div>
          {recentApplications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-soft)' }}>
              No applications yet. Start applying!
            </div>
          ) : (
            <ul className="list">
              {recentApplications.map(app => {
                const internship = app.internship;
                if (!internship) return null;
                return (
                  <li key={app._id} className="list-item">
                    <div>
                      <div className="li-title">{internship.title}</div>
                      <div className="li-meta">
                        {internship.company} • Applied {formatDate(app.appliedAt)}
                      </div>
                    </div>
                    <span className={`badge badge-${app.status}`}>
                      {app.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {profile && (
        <div className="panel mt">
          <div className="profile-row">
            <img 
              src={profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=2563eb&color=fff`} 
              alt="" 
              className="avatar"
            />
            <div>
              <h3 className="m0">{profile.name || 'Complete your profile'}</h3>
              <div className="mini">{profile.bio || 'Add a bio to tell recruiters about yourself'}</div>
              <div className="chips">
                {(profile.skills || []).slice(0, 7).map(s => (
                  <span key={s} className="chip">{s}</span>
                ))}
                {(!profile.skills || profile.skills.length === 0) && (
                  <span style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }}>
                    Add skills to your profile
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;