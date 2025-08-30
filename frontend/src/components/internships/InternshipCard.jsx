import React from 'react';

const InternshipCard = ({ item }) => (
  <div className="i-card">
    <div className="i-head">
      <div className="i-title">{item.title}</div>
      <div className="i-match">{item.match}%</div>
    </div>
    <div className="i-meta">{item.company} • {item.location}</div>
    <div className="i-skills">
      {item.skills.slice(0,4).map(s => <span key={s} className="chip tiny">{s}</span>)}
    </div>
    <div className="i-foot">
      <span className="stipend">{item.stipend}</span>
      <span className="deadline">{item.duration} • DL {item.deadline}</span>
    </div>
    <div className="i-actions">
      <button className="btn-out tiny">Details</button>
      <button className="btn-primary tiny">Apply</button>
    </div>
  </div>
);

export default InternshipCard;