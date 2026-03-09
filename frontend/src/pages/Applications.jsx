import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const statusConfig = {
  applied: { label: 'Applied', color: 'blue', icon: Clock },
  reviewing: { label: 'Reviewing', color: 'amber', icon: AlertCircle },
  accepted: { label: 'Accepted', color: 'green', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'red', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'gray', icon: XCircle }
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_BASE}/api/applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch applications: ${res.status}`);
      }
      
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications/${applicationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error('Failed to withdraw application');
      }

      // Refresh applications list
      await fetchApplications();
      alert('Application withdrawn successfully');
    } catch (err) {
      alert('Failed to withdraw: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const statusCounts = {
    all: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="view">
        <h1 className="page-title">My Applications</h1>
        <div className="panel">
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-soft)' }}>
            Loading applications...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <h1 className="page-title">My Applications</h1>
      <p className="page-sub">Track all your internship applications in one place.</p>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({statusCounts.all})
        </button>
        <button 
          className={`filter-tab ${filter === 'applied' ? 'active' : ''}`}
          onClick={() => setFilter('applied')}
        >
          Applied ({statusCounts.applied})
        </button>
        <button 
          className={`filter-tab ${filter === 'reviewing' ? 'active' : ''}`}
          onClick={() => setFilter('reviewing')}
        >
          Reviewing ({statusCounts.reviewing})
        </button>
        <button 
          className={`filter-tab ${filter === 'accepted' ? 'active' : ''}`}
          onClick={() => setFilter('accepted')}
        >
          Accepted ({statusCounts.accepted})
        </button>
        <button 
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({statusCounts.rejected})
        </button>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="panel">
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Briefcase size={48} style={{ color: 'var(--text-soft)', marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
              {filter === 'all' ? 'No Applications Yet' : `No ${statusConfig[filter]?.label} Applications`}
            </h3>
            <p style={{ color: 'var(--text-soft)', margin: '0 0 1.5rem 0' }}>
              {filter === 'all' 
                ? 'Start applying to internships from the Internships page.' 
                : `You don't have any ${statusConfig[filter]?.label.toLowerCase()} applications.`}
            </p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/internships'}
            >
              Browse Internships
            </button>
          </div>
        </div>
      ) : (
        <div className="applications-grid">
          {filteredApplications.map(app => {
            const internship = app.internship;
            if (!internship) return null;

            const config = statusConfig[app.status] || statusConfig.applied;
            const StatusIcon = config.icon;

            return (
              <div key={app._id} className="application-card">
                <div className="app-header">
                  <div>
                    <h3 className="app-title">{internship.title}</h3>
                    <div className="app-company">{internship.company}</div>
                  </div>
                  <span className={`status-badge status-${config.color}`}>
                    <StatusIcon size={14} />
                    {config.label}
                  </span>
                </div>

                <div className="app-details">
                  <div className="app-detail-item">
                    <MapPin size={14} />
                    <span>{(internship.location || []).join(', ') || 'Not specified'}</span>
                  </div>
                  <div className="app-detail-item">
                    <Calendar size={14} />
                    <span>Applied: {formatDate(app.appliedAt)}</span>
                  </div>
                  <div className="app-detail-item">
                    <Clock size={14} />
                    <span>{internship.duration || 'Not specified'}</span>
                  </div>
                </div>

                <div className="app-skills">
                  {(internship.skillsRequired || []).slice(0, 5).map(skill => (
                    <span key={skill} className="chip tiny">{skill}</span>
                  ))}
                </div>

                <div className="app-footer">
                  <span className="app-stipend">{internship.stipend || 'Unpaid'}</span>
                  {app.status === 'applied' && (
                    <button 
                      className="btn-out tiny"
                      onClick={() => handleWithdraw(app._id)}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Applications;
