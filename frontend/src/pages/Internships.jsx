import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const Internships = () => {
  const [q,setQ] = useState('');
  const [items, setItems] = useState([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");

  // AI rec state
  const [aiLoading,setAiLoading] = useState(false);
  const [aiError,setAiError] = useState('');
  const [aiRecs,setAiRecs] = useState(null); // null = untouched, [] = none returned
  const [showAI,setShowAI] = useState(false);

  useEffect(()=>{
    (async ()=>{
      try {
        const res = await fetch(`${API_BASE}/api/showPostings`);
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

  const fetchAI = async () => {
    const token = localStorage.getItem('token');
    if(!token){
      setAiError('Please login to get AI recommendations.');
      setShowAI(true);
      return;
    }
    setAiError('');
    setAiLoading(true);
    setShowAI(true);
    setAiRecs(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai/recommendations`, {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        }
      });
      const json = await res.json();
      if(!res.ok) throw new Error(json.error || 'Failed to generate');
      // Backend returns [{ internshipId, matchPercentage, ... }]
      // Attach internship object if we have it locally
      const lookup = new Map(items.map(i => [i._id, i]));
      const enriched = (json.recommendations || []).map(r => ({
        ...r,
        internship: r.internship || lookup.get(r.internshipId) || null
      }));
      setAiRecs(enriched);
    } catch(e){
      setAiError(e.message);
      setAiRecs([]);
    } finally {
      setAiLoading(false);
    }
  };

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
          onClick={fetchAI}
          disabled={aiLoading}
        >
          <Sparkles size={14} />
          <span>{aiLoading ? 'Generating...' : 'AI Recommendations'}</span>
        </button>
      </div>

      {showAI && (
        <div className="panel" style={{marginBottom:'1.4rem'}}>
          <div className="panel-head">
            <h2>AI Recommendations</h2>
            <span style={{fontSize:'.6rem', color:'var(--text-soft)'}}>
              {aiLoading ? 'Working...' : (aiRecs ? `${aiRecs.length} results` : '')}
            </span>
          </div>
          {aiError && <div className="alert error small" style={{marginBottom:'.7rem'}}>{aiError}</div>}
          {aiLoading && (
            <div style={{display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
              {Array.from({length:3}).map((_,i)=>
                <div key={i} className="i-card" style={{opacity:.6}}>
                  <div style={{height:14, background:'var(--border-soft)', borderRadius:6, width:'70%'}} />
                  <div style={{height:10, background:'var(--border-soft)', borderRadius:6, width:'40%', marginTop:10}} />
                  <div style={{display:'flex', gap:6, marginTop:14}}>
                    {Array.from({length:4}).map((__,j)=>
                      <span key={j} className="chip tiny" style={{background:'var(--border-soft)', color:'transparent'}}>----</span>
                    )}
                  </div>
                  <div style={{height:60, background:'var(--border-soft)', borderRadius:10, marginTop:14}} />
                </div>
              )}
            </div>
          )}
          {!aiLoading && aiRecs && (
            aiRecs.length === 0
              ? <div className="empty">No recommendations returned.</div>
              : <div className="i-grid">
                  {aiRecs.map(r => {
                    const intObj = r.internship || {};
                    return (
                      <div key={r.internshipId || intObj._id} className="i-card ai-rec-card">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                          <div>
                            <div className="i-title">{intObj.title || 'Unknown Internship'}</div>
                            <br />
                            <div className="i-meta">
                              {(intObj.company || '—')} • {Array.isArray(intObj.location) ? intObj.location.join(', ') : (intObj.location || '—')}
                            </div>
                          </div>
                          <br />
                          <div
                            className="ai-match-badge"
                            style={{
                              background:'var(--primary-soft)',
                              color:'var(--primary)',
                              padding:'.42rem .62rem',
                              borderRadius:'14px',
                              fontSize:'.62rem',
                              fontWeight:600,
                              display:'flex',
                              flexDirection:'column',
                              alignItems:'center',
                              minWidth:'66px',
                              lineHeight:1.15
                            }}
                          >
                            <span style={{fontSize:'.68rem'}}>{r.matchPercentage ?? '—'}%</span>
                            <span style={{fontSize:'.52rem', letterSpacing:'.5px'}}>Match</span>
                          </div>
                        </div>

                        {(intObj.skillsRequired || []).length > 0 && (
                          <div className="ai-req-block">
                            <div className="ai-req-label">Required Skills</div>
                            <div className="i-skills ai-req-skill-chips">
                              {(intObj.skillsRequired || []).map(s => (
                                <span key={s} className="chip tiny ai-req-chip">{s}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {r.missingSkills?.length > 0 && (
                          <div className="ai-missing-block">
                            <div className="ai-missing-label">Missing Skills</div>
                            <div className="i-skills ai-missing-skill-chips">
                              {r.missingSkills.map(ms => (
                                <span key={ms} className="chip tiny ai-miss-chip">{ms}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
          )}
        </div>
      )}

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
              <span>{Array.isArray(it.location) ? it.location.join(", ") : it.location}</span>
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