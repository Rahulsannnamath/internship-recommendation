import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const blank = {
  name: '',
  email: '',
  skills: [],
  location: [],
  interests: [],
  expectedStipend: '',
  availableDuration: '',
  education: { degree: '', graduationYear: '' },
  experience: '',
  resume: '',
  bio: '',
  preferredCompanyTypes: [],
  availability: ''
};

const TagEditor = ({ label, values, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setInput('');
  };
  const remove = (val) => onChange(values.filter(x => x !== val));
  return (
    <div className="field-block">
      <div className="fb-head">
        <span className="fb-label">{label}</span>
      </div>
      <div className="chip-editor">
        <div className="chips">
          {values.map(v => (
            <span
              key={v}
              className="chip chip--removable"
              onClick={() => remove(v)}
              title="Remove"
            >
              {v} ×
            </span>
          ))}
        </div>
        <div className="chip-add-row">
          <input
            className="f-input chip-input"
            value={input}
            placeholder={placeholder}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn-out btn-sm" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
};

const UserProfileForm = ({ initial = {}, token, onSaved }) => {
  const [data, setData] = useState({ ...blank, ...initial });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const setField = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setEdu = (k, v) =>
    setData(d => ({ ...d, education: { ...d.education, [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    setSaving(true);
    const payload = {
      ...data,
      skills: (data.skills || []).map(s => s.trim()).filter(Boolean),
      interests: (data.interests || []).map(s => s.trim()).filter(Boolean),
      location: (data.location || []).map(s => s.trim()).filter(Boolean),
      preferredCompanyTypes: (data.preferredCompanyTypes || []).map(s => s.trim()).filter(Boolean),
      bio: (data.bio || '').slice(0,500)
    };
    try {
      const res = await fetch('http://localhost:8080/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(()=> ({}));
      if (!res.ok || !json.profile) {
        throw new Error(json.error || 'Save failed');
      }
      setMsg('Profile saved');
      onSaved && onSaved(json.profile);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="profile-form panel" onSubmit={submit}>
      <div className="pf-head">
        <h2 className="pf-title">Profile Details</h2>
        <p className="pf-sub">Complete your profile for better matches.</p>
      </div>

      {err && <div className="alert error small">{err}</div>}
      {msg && <div className="alert success small">{msg}</div>}

      <div className="form-grid">
        <label className="f-label">
          Name
          <input
            className="f-input"
            value={data.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="Full name"
          />
        </label>
        <br />
        <label className="f-label">
          Email
          <input
            className="f-input"
            type="email"
            value={data.email}
            onChange={e => setField('email', e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <br />
        <label className="f-label">
          Expected Stipend
          <input
            className="f-input"
            value={data.expectedStipend}
            onChange={e => setField('expectedStipend', e.target.value)}
            placeholder="₹15,000 / month"
          />
        </label>
        <br />
        <label className="f-label">
          Availability
          <input
            className="f-input"
            value={data.availability}
            onChange={e => setField('availability', e.target.value)}
            placeholder="Immediate / 1 Month"
          />
        </label>
        <br />
        <label className="f-label">
          Available Duration
          <input
            className="f-input"
            value={data.availableDuration}
            onChange={e => setField('availableDuration', e.target.value)}
            placeholder="3 months"
          />
        </label>
        <br />
        <label className="f-label">
          Degree
          <input
            className="f-input"
            value={data.education.degree}
            onChange={e => setEdu('degree', e.target.value)}
            placeholder="B.Tech CSE"
          />
        </label>
        <br />
        <label className="f-label">
          Graduation Year
          <input
            className="f-input"
            type="number"
            value={data.education.graduationYear}
            onChange={e => setEdu('graduationYear', e.target.value)}
            placeholder="2026"
          />
        </label>
        <br />
        <label className="f-label span-2">
          Experience (Summary)
          <textarea
            className="f-input textarea"
            rows={3}
            value={data.experience}
            onChange={e => setField('experience', e.target.value)}
            placeholder="Interned at..., built..., volunteered..."
          />
        </label>
        <br />
        <label className="f-label span-2">
          Bio
          <textarea
            className="f-input textarea"
            rows={4}
            maxLength={500}
            value={data.bio}
            onChange={e => setField('bio', e.target.value)}
            placeholder="Short intro (max 500 chars)"
          />
          <div className="char-hint">{(data.bio || '').length}/500</div>
        </label>
        <br />
        <label className="f-label span-2">
          Resume URL
          <input
            className="f-input"
            value={data.resume}
            onChange={e => setField('resume', e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </label>
        <br />
      </div>
       <br />
      <div className="divider" />

      <div className="form-grid">
        <TagEditor
          label="Skills"
          values={data.skills}
          onChange={v => setField('skills', v)}
          placeholder="Add a skill & Enter"
        />
        <br />
        <TagEditor
          label="Interests"
          values={data.interests}
          onChange={v => setField('interests', v)}
          placeholder="Area e.g. AI"
        />
        <br />
        <TagEditor
          label="Locations"
          values={data.location}
          onChange={v => setField('location', v)}
          placeholder="City or Remote"
        />
        <br />
        <TagEditor
          label="Preferred Company Types"
          values={data.preferredCompanyTypes}
          onChange={v => setField('preferredCompanyTypes', v)}
          placeholder="Startup / MNC"
        />
      </div>
      <br />
      <div className="pf-actions">
        <button
            type="button"
            className="btn-out"
            onClick={() => setData({ ...blank })}
            disabled={saving}
        >Reset</button>
        &nbsp;&nbsp;
        <button
          type="submit"
          className="btn-out"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

const Profile = () => {
  const { token, setProfile } = useAuth();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try {
        const t = localStorage.getItem('token');
        const res = await fetch('http://localhost:8080/api/profile', {
          headers: { Authorization: `Bearer ${t}` }
        });
        const json = await res.json().catch(()=> ({}));
        // Expect backend returns either {profile: {...}} or the doc itself
        const profileObj = json?.profile ? json.profile : json;
        setInitial({ ...blank, ...profileObj });
      } catch {
        setInitial({ ...blank });
      } finally { setLoading(false); }
    })();
  },[token]);

  // Pass save override into form so we can update context
  return (
    <div className="view">
      <h1 className="page-title">Profile</h1>
      <p className="page-sub">Edit and enrich your details.</p>
      {loading && <div className="panel pad">Loading...</div>}
      {!loading && <UserProfileForm initial={initial} onSaved={p => setProfile(p)} token={token} />}
    </div>
  );
};

export default Profile;