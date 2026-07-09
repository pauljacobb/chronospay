import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Play, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export default function Dashboard({ onSelectStream, onCreateTab }) {
  const { user } = useAuth();
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = user?.role === 'sender' ? '/streams/sent' : '/streams/received';
      const res = await api.get(endpoint);
      setStreams(res.data.streams || []);
    } catch (err) {
      setError('Failed to fetch streams. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return 'status-active';
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalValue = streams.reduce((acc, s) => acc + parseFloat(s.amount), 0);
  const activeStreamsCount = streams.filter(s => s.status === 'active').length;

  return (
    <div className="animate-fade-in">
      {/* Quick Stats Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px', margin: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Active Streams</span>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-cyan)' }}>{activeStreamsCount}</h3>
        </div>
        <div className="glass-panel" style={{ padding: '16px', margin: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Total Escrowed</span>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-green)' }}>{totalValue.toFixed(2)} XLM</h3>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
          {user?.role === 'sender' ? 'Sent Streams' : 'Received Streams'}
        </h3>
        <button
          onClick={fetchStreams}
          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255, 62, 62, 0.1)', padding: '12px', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          Loading your streams...
        </div>
      ) : streams.length === 0 ? (
        <div className="glass-panel glass-panel-glow" style={{ textAlign: 'center', padding: '36px 20px', marginTop: '10px' }}>
          <Play size={40} style={{ color: 'var(--accent-purple)', marginBottom: '16px', opacity: 0.8 }} />
          <h4 style={{ fontSize: '16px', marginBottom: '8px' }}>No Payment Streams Found</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
            {user?.role === 'sender' 
              ? 'You have not initialized any payment streams yet. Lock some funds and start a continuous payout.'
              : 'You have not received any payment streams yet. Share your wallet address to get started.'}
          </p>
          {user?.role === 'sender' && (
            <button className="btn btn-primary" onClick={onCreateTab}>
              Create Stream
            </button>
          )}
        </div>
      ) : (
        <div className="stream-list">
          {streams.map((stream) => (
            <div
              key={stream.id}
              className="stream-card"
              onClick={() => onSelectStream(stream.id)}
            >
              <div className="stream-card-header">
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600' }}>
                    {user?.role === 'sender' ? 'To: ' : 'From: '}
                    <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {user?.role === 'sender' 
                        ? `${stream.recipient_address.substring(0, 6)}...${stream.recipient_address.substring(stream.recipient_address.length - 4)}`
                        : `${stream.sender_id.substring(0, 8)}...`}
                    </code>
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <Calendar size={12} />
                    <span>Starts {formatDate(stream.start_time)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="stream-amount">{stream.amount} XLM</div>
                  <span className={`status-indicator ${getStatusClass(stream.status)}`} style={{ marginTop: '6px', display: 'inline-block' }}>
                    {stream.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
