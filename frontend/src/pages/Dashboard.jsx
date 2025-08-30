import React from 'react';
import { userProfile, internships, applicationTrend, skillLevels } from '../data/mockData.js';
import StatCard from '../components/stats/StatCard.jsx';
import { Zap, Briefcase, Eye, Award } from 'lucide-react';
import MatchGauge from '../components/charts/MatchGauge.jsx';
import ApplicationsLine from '../components/charts/ApplicationsLine.jsx';
import SkillRadar from '../components/charts/SkillRadar.jsx';

const Dashboard = () => {
  const top = [...internships].sort((a,b)=>b.match-a.match).slice(0,4);
  return (
    <div className="view">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Quick overview of performance & matches.</p>

      <div className="stats-grid">
        <StatCard icon={<Zap size={18}/>} label="Match Strength" value={userProfile.match+'%'} accent="blue" />
        <StatCard icon={<Briefcase size={18}/>} label="Applications" value="11" accent="green" />
        <StatCard icon={<Eye size={18}/>} label="Profile Views" value="134" accent="indigo" />
        <StatCard icon={<Award size={18}/>} label="Certifications" value="4" accent="amber" />
      </div>

      <div className="grid mt">
        <div className="panel">
          <div className="panel-head"><h2>Match Gauge</h2></div>
          <MatchGauge value={userProfile.match} />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Application Trend</h2></div>
          <ApplicationsLine dataPoints={applicationTrend} />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Skill Radar</h2></div>
          <SkillRadar skills={skillLevels} />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Top Matches</h2></div>
          <ul className="list">
            {top.map(t=>(
              <li key={t.id} className="list-item">
                <div>
                  <div className="li-title">{t.title}</div>
                  <div className="li-meta">{t.company} • {t.location}</div>
                </div>
                <span className="badge">{t.match}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel mt">
        <div className="profile-row">
          <img src={userProfile.avatar} alt="" className="avatar"/>
          <div>
            <h3 className="m0">{userProfile.name}</h3>
            <div className="mini">{userProfile.headline}</div>
            <div className="chips">
              {userProfile.skills.slice(0,7).map(s=> <span key={s} className="chip">{s}</span>)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;