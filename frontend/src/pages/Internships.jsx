import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const Internships = () => {
  const [q,setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  useEffect(()=>{
    (async ()=>{
      try {
        const res = await fetch("http://localhost:8080/api/showPostings");
        if(!res.ok) throw new Error("Network");
        const json = await res.json();
        setItems(json.data || []);
      } catch (e){
        setError("Failed to load internships: "+e.message);
      } finally {
        setLoading(false);
      }
    })();
  },[]);

  const filtered = useMemo(()=> items.filter(i =>
    i.title?.toLowerCase().includes(q.toLowerCase()) ||
    i.company?.toLowerCase().includes(q.toLowerCase()) ||
    (i.skillsRequired||[]).some(s=>s.toLowerCase().includes(q.toLowerCase()))
  ),[q,items]);

  if(loading) return <div className="pad">Loading internships...</div>;
  if(error) return <div className="pad error">{error}</div>;

  return (
    <div className="view">
      <h1 className="page-title">Internships</h1>
      <p className="page-sub">Live postings.</p>
      <div className="filters filters--internships">
        <input
          className="input input--sm filter-search"
          placeholder="Search title, company or skill..."
          value={q}
          onChange={e=>setQ(e.target.value)}
        />
        <button className="btn-out btn-out--sm" onClick={()=>setQ('')}>Clear</button>
        <button
          type="button"
          className="btn-out btn-out--sm"
          aria-label="Get AI recommendations"
          onClick={()=>console.log("AI recommendations click - implement later")}
        >
          <Sparkles size={14} />
          <span>AI Recommendations</span>
        </button>
      </div>
      <div className="i-grid">
        {filtered.map(it=>(
          <div key={it._id} className="i-card">
            <h3 className="i-title">{it.title}</h3>
            <div className="i-meta">{it.company}</div>
            <p className="i-desc">{it.description}</p>
            <div className="i-skills">
              {(it.skillsRequired||[]).slice(0,6).map(s=>(
                <span key={s} className="badge">{s}</span>
              ))}
            </div>
            <div className="i-foot">
              <span>{it.location?.join(", ")}</span>
              <span>{it.duration}</span>
            </div>
          </div>
        ))}
      </div>
      {filtered.length===0 && <div className="empty">No results.</div>}
    </div>
  );
};

export default Internships;