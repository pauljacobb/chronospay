import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { RefreshCw, Coins, Eye, CheckCircle, Shield } from 'lucide-react';
import JobDetails from './JobDetails';

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs');
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.warn("Failed to fetch jobs list from backend, using simulated contracts.");
      setJobs([
        { id: '1', title: 'Write Soroban Escrow Contract', description: 'Need a stable escrow contract supporting refunds and freelancer assignments. Must be written in Rust.', budget: '800', status: 'open', client_id: '123' },
        { id: '2', title: 'Next.js Frontend Wallet Integration', description: 'Integrate Freighter wallet API into a React freelancer marketplace. Experience with Stellar SDK is required.', budget: '500', status: 'assigned', client_id: '123', escrow_id: '821431' },
        { id: '3', title: 'Stellar Anchor Integration Support', description: 'Help configure SEP-24 deposits and withdrawals for stablecoin distributions.', budget: '2000', status: 'completed', client_id: '456', escrow_id: '720911' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (selectedJobId) {
    return <JobDetails jobId={selectedJobId} onBack={() => { setSelectedJobId(null); fetchJobs(); }} />;
  }

  return (
    <div className="dashboard-view animate-fade-in">
      <div className="dashboard-header-card glass-panel" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
        <div className="header-meta">
          <span className="badge badge-purple">Decentralized Board</span>
          <h2>Marketplace Gigs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Find freelance gigs locked securely in Soroban escrow smart contracts.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <h3 className="section-title-label">Available Opportunities</h3>
        <button className="refresh-data-btn" onClick={fetchJobs} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'icon-spin-loading' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="centered-loader-state">
          <span className="loader" style={{ width: '24px', height: '24px' }}></span>
          <p>Fetching on-chain escrows...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No active freelance gigs posted yet.
        </div>
      ) : (
        <div className="jobs-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.map(job => (
            <div key={job.id} className="glass-panel escrow-item-card" style={{
              borderLeft: job.status === 'open' ? '3px solid var(--accent-cyan)' : (job.status === 'assigned' ? '3px solid var(--accent-purple)' : '3px solid var(--accent-green)')
            }}>
              <div className="escrow-meta">
                <div>
                  <h4 style={{ fontSize: '16px' }}>{job.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                    {job.description}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-green)', fontSize: '15px' }}>
                    <Coins size={14} />
                    {job.budget} XLM
                  </h4>
                  <span className={`badge ${job.status === 'open' ? 'badge-cyan' : (job.status === 'assigned' ? 'badge-purple' : 'badge-green')}`} style={{ fontSize: '9px', marginTop: '4px', padding: '1px 5px' }}>
                    {job.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                {job.escrow_id && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} />
                    Escrow ID: #{job.escrow_id}
                  </span>
                )}
                {!job.escrow_id && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No Escrow Active</span>
                )}
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setSelectedJobId(job.id)}>
                  <Eye size={12} /> View Gig
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
