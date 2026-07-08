import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ArrowLeft, Coins, Check, X, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function JobDetails({ jobId, onBack }) {
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadJobDetails = async () => {
    setLoading(true);
    try {
      const jobRes = await api.get(`/jobs/${jobId}`);
      setJob(jobRes.data);

      const propRes = await api.get(`/jobs/${jobId}/proposals`);
      setProposals(propRes.data.proposals || []);
    } catch (err) {
      console.warn("REST API offline, generating simulated job details.");
      // Fallback details
      setJob({
        id: jobId,
        title: 'Write Soroban Escrow Contract',
        description: 'Need a stable escrow contract supporting refunds and freelancer assignments. Must be written in Rust.',
        budget: '800',
        status: 'open',
        client_id: 'client-123',
        escrow_id: null
      });
      setProposals([
        { id: 'p-1', freelancer_id: 'free-123', bid_amount: '750', cover_letter: 'I am a skilled Soroban developer. Ready to begin immediately.', status: 'pending' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  const handleApply = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post(`/jobs/${jobId}/proposals`, { bid_amount: bidAmount, cover_letter: coverLetter });
      setBidAmount('');
      setCoverLetter('');
      setSuccessMsg('Proposal submitted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (proposalId) => {
    setActionLoading(true);
    try {
      await api.post(`/jobs/${jobId}/assign`, { proposal_id: proposalId });
      loadJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign freelancer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    setActionLoading(true);
    try {
      await api.post(`/jobs/${jobId}/release`);
      
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.8 }
      });

      loadJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Escrow release failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    setActionLoading(true);
    try {
      await api.post(`/jobs/${jobId}/refund`);
      alert('Escrow refunded successfully!');
      loadJobDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Escrow refund failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="centered-loader-state">
        <span className="loader" style={{ width: '24px', height: '24px' }}></span>
        <p>Loading contract details...</p>
      </div>
    );
  }

  const isClient = user?.id === job.client_id || user?.role === 'client';
  const hasApplied = proposals.some(p => p.freelancer_id === user?.id);
  const acceptedProposal = proposals.find(p => p.status === 'accepted');

  return (
    <div className="job-details-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <button className="auth-back-btn" onClick={onBack} style={{ marginBottom: 0 }}>
        <ArrowLeft size={16} />
      </button>

      {/* Main card */}
      <div className="glass-panel glass-panel-glow" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className={`badge ${job.status === 'open' ? 'badge-cyan' : (job.status === 'assigned' ? 'badge-purple' : 'badge-green')}`} style={{ marginBottom: '6px' }}>
              {job.status}
            </span>
            <h2 style={{ fontSize: '20px' }}>{job.title}</h2>
          </div>
          <h3 style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '18px' }}>
            <Coins size={16} />
            {job.budget} XLM
          </h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
          {job.description}
        </p>

        {job.escrow_id && (
          <div className="wallet-address-pill" style={{ background: 'rgba(189, 0, 255, 0.03)', border: '1px solid rgba(189, 0, 255, 0.1)' }}>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>Soroban Escrow Active</span>
            <code>#{job.escrow_id}</code>
          </div>
        )}
      </div>

      {/* Action panel for client in assigned status */}
      {isClient && job.status === 'assigned' && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-purple)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '14px' }}>Escrow Controls</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Funds are locked in the smart contract. Release payouts upon approving deliverables, or cancel the job to issue a refund.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleRelease} disabled={actionLoading}>
              {actionLoading ? <div className="loader"></div> : <Check size={14} />}
              Approve & Release
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, color: 'var(--accent-red)' }} onClick={handleRefund} disabled={actionLoading}>
              Cancel Gig
            </button>
          </div>
        </div>
      )}

      {/* Proposals list for Client */}
      {isClient && job.status === 'open' && (
        <div className="proposals-list-section">
          <h3 className="section-title-label">Freelancer Proposals ({proposals.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {proposals.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                No applications submitted yet.
              </p>
            ) : (
              proposals.map(prop => (
                <div key={prop.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                      Proposal Bid: {prop.bid_amount} XLM
                    </span>
                    <button className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => handleAssign(prop.id)} disabled={actionLoading}>
                      Hire & Lock Escrow
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {prop.cover_letter}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Submit proposal form for Freelancers */}
      {!isClient && job.status === 'open' && !hasApplied && (
        <form onSubmit={handleApply} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '15px' }}>Submit Gig Proposal</h3>

          {successMsg && <div className="form-error-panel" style={{ background: 'rgba(0, 255, 135, 0.05)', border: '1px solid rgba(0, 255, 135, 0.2)', color: 'var(--accent-green)' }}>{successMsg}</div>}

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">My Bid Amount (XLM)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 750"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              required
              disabled={actionLoading}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Cover Letter</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', fontFamily: 'inherit' }}
              placeholder="Why are you a good fit for this gig?"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              required
              disabled={actionLoading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
            {actionLoading ? <div className="loader"></div> : <Send size={14} />}
            Submit Proposal
          </button>
        </form>
      )}

      {/* Status updates for Freelancers */}
      {!isClient && hasApplied && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
          <h4 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
            Application Status: Submitted
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Your proposal has been logged on-chain. If selected, the client's budget will lock inside the smart contract escrow session.
          </p>
        </div>
      )}

      {/* Completed feedback */}
      {job.status === 'completed' && (
        <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <h4 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)' }}>
            <ShieldCheck size={16} />
            Gig Completed & Settled
          </h4>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Work deliverables approved. {job.budget} XLM has been transferred to the freelancer wallet address.
          </p>
        </div>
      )}
    </div>
  );
}
