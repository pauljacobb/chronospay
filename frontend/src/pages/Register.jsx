import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFreighterPublicKey } from '../utils/freighter';
import { UserPlus, ArrowLeft, Wallet } from 'lucide-react';

export default function Register({ onNavigate }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sender'); // sender or recipient
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  const handleConnectWallet = async () => {
    setWalletLoading(true);
    setError('');
    try {
      const pubKey = await getFreighterPublicKey();
      setWalletAddress(pubKey);
    } catch (err) {
      setError('Could not connect wallet. Using mock address fallback instead.');
      setWalletAddress('GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Name, email, and password are required.');
    }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role, walletAddress);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-screen animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', marginTop: '10px' }}>
          <button onClick={() => onNavigate('welcome')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ marginLeft: '12px', fontSize: '20px' }}>Create Account</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(255, 62, 62, 0.1)', border: '1px solid rgba(255, 62, 62, 0.2)', padding: '12px', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="Alice Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="alice@chronospay.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Account Role</label>
            <select
              className="select-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="sender">Sender (Locks and streams money)</option>
              <option value="recipient">Recipient (Withdraws streamed money)</option>
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ marginBottom: 0 }}>Stellar Wallet Address</label>
              <button
                type="button"
                onClick={handleConnectWallet}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <Wallet size={12} /> {walletLoading ? 'Connecting...' : 'Autofill Freighter'}
              </button>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="G... (Leave blank to generate custodial keypair)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating Account...' : <><UserPlus size={18} /> Get Started</>}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '20px', marginBottom: '10px' }}>
        Already have an account?{' '}
        <span onClick={() => onNavigate('login')} style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}>
          Sign In
        </span>
      </div>
    </div>
  );
}
