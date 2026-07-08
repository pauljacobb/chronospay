import React, { useState } from 'react';
import api from '../utils/api';
import { Send, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PostJob({ onPostSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (parseFloat(budget) <= 0 || isNaN(budget)) {
      setErrorMsg('Please specify a positive budget.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/jobs', { title, description, budget });
      setTitle('');
      setDescription('');
      setBudget('');
      onPostSuccess(); // redirect/refresh dashboard
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to post gig contract. Check your wallet balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-view animate-fade-in">
      <div className="dashboard-header-card glass-panel" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
        <div className="header-meta">
          <span className="badge badge-purple">New Contract</span>
          <h2>Post a Gig</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            List a job and lock the XLM budget securely inside a Soroban smart contract.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 className="form-card-title">Job Specifications</h3>

        {errorMsg && <div className="form-error-panel">{errorMsg}</div>}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Job Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Write Soroban Escrow Contract"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Job Description</label>
          <textarea
            className="form-input"
            style={{ minHeight: '100px', fontFamily: 'inherit' }}
            placeholder="Outline job deliverables, constraints, and timeline requirements..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Budget (XLM)</label>
          <input
            type="number"
            step="0.0001"
            className="form-input"
            placeholder="0.00"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-error-panel" style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginBottom: 0 }}>
          <ShieldCheck size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          <p style={{ fontSize: '11px', lineHeight: '1.4' }}>
            Locking gig funds in the escrow contract requires signing a Freighter browser transaction. The funds remain locked until you approve deliverables.
          </p>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
          {loading ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : <Send size={14} />}
          Post Job & Lock Escrow
        </button>
      </form>
    </div>
  );
}
