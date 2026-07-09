import React, { useState } from 'react';
import api from '../utils/api';
import { Play, Calendar, DollarSign, Wallet, AlertCircle } from 'lucide-react';

export default function CreateStream({ onNavigate }) {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [startTime, setStartTime] = useState('');
  const [stopTime, setStopTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const applyDurationShortcut = (minutes) => {
    const now = new Date();
    // Offset for local timezone formatting compatibility
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localStart = new Date(now.getTime() - tzoffset);
    const localStop = new Date(now.getTime() + (minutes * 60000) - tzoffset);

    setStartTime(localStart.toISOString().slice(0, 16));
    setStopTime(localStop.toISOString().slice(0, 16));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recipientAddress || !amount || !startTime || !stopTime) {
      return setError('Please fill in all fields.');
    }
    if (new Date(stopTime) <= new Date(startTime)) {
      return setError('Stop time must be strictly after start time.');
    }
    if (parseFloat(amount) <= 0) {
      return setError('Amount must be positive.');
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/streams', {
        recipientAddress,
        amount,
        startTime: new Date(startTime).toISOString(),
        stopTime: new Date(stopTime).toISOString()
      });
      setSuccess(true);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create payment stream.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '20px', marginBottom: '6px' }}>Start Payment Stream</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
        Funds will be locked in a secure smart escrow contract and streamed continuously.
      </p>

      {success ? (
        <div className="glass-panel glass-panel-glow" style={{ textAlign: 'center', padding: '30px 20px', marginTop: '20px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 255, 135, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid var(--accent-green)' }}>
            <Play size={24} style={{ color: 'var(--accent-green)', marginLeft: '4px' }} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--accent-green)', marginBottom: '8px' }}>Stream Initialized!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Escrow deposit created successfully. Returning to dashboard...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(255, 62, 62, 0.1)', padding: '12px', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Recipient Public Address</label>
            <input
              type="text"
              className="input-field"
              placeholder="GD3V7SOP5HET..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Total Stream Amount (XLM)</label>
            <input
              type="number"
              step="0.0001"
              className="input-field"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Duration Shortcuts
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => applyDurationShortcut(1)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}>
                1 Min (Demo)
              </button>
              <button type="button" onClick={() => applyDurationShortcut(60)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}>
                1 Hour
              </button>
              <button type="button" onClick={() => applyDurationShortcut(1440)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}>
                24 Hours
              </button>
              <button type="button" onClick={() => applyDurationShortcut(10080)} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer' }}>
                7 Days
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Stop Time</label>
              <input
                type="datetime-local"
                className="input-field"
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Initializing Stream...' : <><Play size={18} /> Deploy Stream</>}
          </button>
        </form>
      )}
    </div>
  );
}
