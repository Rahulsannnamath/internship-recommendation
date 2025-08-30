import React, { useState, useMemo } from 'react';
import { internships } from '../data/mockData.js';
import InternshipCard from '../components/internships/InternshipCard.jsx';

const Internships = () => {
  const [q,setQ] = useState('');
  const [cat,setCat] = useState('All');
  const categories = ['All', ...new Set(internships.map(i=>i.category))];

  const filtered = useMemo(()=>internships.filter(i =>
    (cat==='All'||i.category===cat) &&
    (i.title.toLowerCase().includes(q.toLowerCase()) ||
     i.company.toLowerCase().includes(q.toLowerCase()) ||
     i.skills.some(s=>s.toLowerCase().includes(q.toLowerCase())))
  ),[q,cat]);

  return (
    <div className="view">
      <h1 className="page-title">Internships</h1>
      <p className="page-sub">Search static postings.</p>
      <div className="filters">
        <input className="input" placeholder="Search..." value={q} onChange={e=>setQ(e.target.value)} />
        <select className="input" value={cat} onChange={e=>setCat(e.target.value)}>
          {categories.map(c=> <option key={c}>{c}</option>)}
        </select>
        <button className="btn-out" onClick={()=>{setQ('');setCat('All');}}>Reset</button>
      </div>
      <div className="i-grid">
        {filtered.map(i=> <InternshipCard key={i.id} item={i} />)}
      </div>
      {filtered.length===0 && <div className="empty">No results.</div>}
    </div>
  );
};

export default Internships;