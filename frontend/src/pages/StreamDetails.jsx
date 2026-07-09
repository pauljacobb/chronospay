import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, RefreshCw, XOctagon, AlertCircle, CheckCircle, ArrowDownCircle } from 'lucide-react';

export default function StreamDetails({ streamId, onBack }) {
  const { user } = useAuth();
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Live ticking calculations
  const [liveMetrics, setLiveMetrics] = useState({
    vested: 0,
    available: 0,
    percent: 0
  });

  useEffect(() => {
    fetchStreamDetails();
  }, [streamId]);

  useEffect(() => {
    if (!stream || stream.status !== 'active') return;

    const interval = setInterval(() => {
      calculateLiveVesting();
    }, 200);

    return () => clearInterval(interval);
  }, [stream]);

  const fetchStreamDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/streams/${streamId}`);
      setStream(res.data);
      calculateLiveVesting(res.data);
    } catch (err) {
      setError('Failed to fetch stream details.');
    } finally {
      setLoading(false);
    }
  };

  const calculateLiveVesting = (overrideStream) => {
    const activeStream = overrideStream || stream;
    if (!activeStream) return;

    const now = Date.now() / 1000;
    const start = new Date(activeStream.start_time).getTime() / 1000;
    const stop = new Date(activeStream.stop_time).getTime() / 1000;
    const amount = parseFloat(activeStream.amount);
    const withdrawn = parseFloat(activeStream.withdrawn);

    let vested = 0;
    if (activeStream.status === 'cancelled') {
      vested = withdrawn; // Vesting stops at withdrawal point
    } else if (now <= start) {
      vested = 0;
    } else if (now >= stop) {
      vested = amount;
    } else {
      const elapsed = now - start;
      const duration = stop - start;
      vested = (amount * elapsed) / duration;
    }

    const available = Math.max(0, vested - withdrawn);
    const percent = Math.min(100, Math.max(0, (vested / amount) * 100));

    setLiveMetrics({
      vested,
      available,
      percent
    });
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      return setFeedback({ message: 'Enter a valid positive amount.', type: 'error' });
    }
    if (parseFloat(withdrawAmount) > liveMetrics.available) {
      return setFeedback({ message: 'Insufficient vested balance available.', type: 'error' });
    }

    setActionLoading(true);
    setFeedback({ message: '', type: '' });
    try {
      const res = await api.post(`/streams/${streamId}/withdraw`, {
        amountToWithdraw: withdrawAmount
      });
      setStream(res.data.stream);
      setWithdrawAmount('');
      setFeedback({ message: `Successfully withdrew ${withdrawAmount} XLM!`, type: 'success' });
      calculateLiveVesting(res.data.stream);
    } catch (err) {
      setFeedback({ message: err.response?.data?.error || 'Withdrawal failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this stream? Vested portion will be paid out and unvested funds refunded.')) {
      return;
    }

    setActionLoading(true);
    setFeedback({ message: '', type: '' });
    try {
      const res = await api.post(`/streams/${streamId}/cancel`);
      setStream(res.data.stream);
      setFeedback({ message: 'Stream cancelled successfully. Refunds processed.', type: 'success' });
      calculateLiveVesting(res.data.stream);
    } catch (err) {
      setFeedback({ message: err.response?.data?.error || 'Cancellation failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading details...</div>;
  }

  if (error || !stream) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-red)' }}>{error || 'Stream not found'}</p>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginTop: '12px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', marginTop: '10px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ marginLeft: '12px', fontSize: '18px' }}>Payment Stream</h2>
      </div>

      {/* Main Stats Card */}
      <div className="glass-panel glass-panel-glow" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ESCROW CONTRACT STREAM</span>
          <span className={`status-indicator ${
            stream.status === 'active' ? 'status-active' : stream.status === 'cancelled' ? 'status-cancelled' : 'status-completed'
          }`}>
            {stream.status}
          </span>
        </div>

        {/* Live ticking display */}
        <h1 style={{ fontSize: '32px', color: 'var(--accent-cyan)', margin: '14px 0 6px 0', fontWeight: '800' }}>
          {liveMetrics.available.toFixed(6)} <span style={{ fontSize: '16px', fontWeight: '500' }}>XLM</span>
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Available to Withdraw Vested</p>

        {/* Linear progress bar */}
        <div className="progress-container">
          <div className="progress-bar-vested" style={{ width: `${liveMetrics.percent}%` }}></div>
        </div>

        <div className="progress-text-row">
          <span>{liveMetrics.percent.toFixed(2)}% Vested</span>
          <span>{parseFloat(stream.amount).toFixed(2)} XLM Total</span>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback.message && (
        <div style={{ 
          background: feedback.type === 'success' ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 62, 62, 0.1)', 
          border: `1px solid ${feedback.type === 'success' ? 'rgba(0, 255, 135, 0.2)' : 'rgba(255, 62, 62, 0.2)'}`,
          padding: '12px', 
          borderRadius: '10px', 
          color: feedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)', 
          fontSize: '13px', 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px' 
        }}>
          {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Stream Details Table */}
      <div className="glass-panel" style={{ marginBottom: '20px', padding: '16px' }}>
        <div className="detail-row">
          <span>Sender</span>
          <code style={{ fontSize: '11px' }}>{stream.sender_id.substring(0, 16)}...</code>
        </div>
        <div className="detail-row">
          <span>Recipient</span>
          <code style={{ fontSize: '11px' }}>{stream.recipient_address.substring(0, 16)}...</code>
        </div>
        <div className="detail-row">
          <span>Total Streamed</span>
          <span>{parseFloat(stream.amount).toFixed(4)} XLM</span>
        </div>
        <div className="detail-row">
          <span>Vested Progress</span>
          <span>{liveMetrics.vested.toFixed(4)} XLM</span>
        </div>
        <div className="detail-row">
          <span>Withdrawn Vested</span>
          <span>{parseFloat(stream.withdrawn).toFixed(4)} XLM</span>
        </div>
        <div className="detail-row">
          <span>Start Date</span>
          <span>{new Date(stream.start_time).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>End Date</span>
          <span>{new Date(stream.stop_time).toLocaleString()}</span>
        </div>
      </div>

      {/* Recipient Actions (Withdrawal) */}
      {user?.role === 'recipient' && stream.status === 'active' && (
        <div className="glass-panel" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>Claim Vested Funds</h3>
          <form onSubmit={handleWithdraw} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              step="0.0001"
              className="input-field"
              placeholder="Amount to withdraw"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }} disabled={actionLoading}>
              {actionLoading ? 'Claiming...' : <ArrowDownCircle size={18} />}
            </button>
          </form>
        </div>
      )}

      {/* Sender Actions (Cancel) */}
      {user?.role === 'sender' && stream.status === 'active' && (
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleCancel} disabled={actionLoading}>
            {actionLoading ? 'Processing Cancellation...' : <><XOctagon size={18} /> Cancel Stream (Refund Unvested)</>}
          </button>
        </div>
      )}
    </div>
  );
}
