import React from 'react';

const StatCard = ({ icon, label, value, accent='indigo' }) => (
  <div className="stat-card" data-accent={accent}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-meta">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

export default StatCard;