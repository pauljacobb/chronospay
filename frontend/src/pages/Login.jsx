import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, ArrowLeft } from 'lucide-react';

export default function Login({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px', marginTop: '10px' }}>
          <button onClick={() => onNavigate('welcome')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ marginLeft: '12px', fontSize: '20px' }}>Sign In</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: 'rgba(255, 62, 62, 0.1)', border: '1px solid rgba(255, 62, 62, 0.2)', padding: '12px', borderRadius: '10px', color: 'var(--accent-red)', fontSize: '13px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="name@chronospay.io"
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Signing In...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        Don't have an account?{' '}
        <span onClick={() => onNavigate('register')} style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: '600' }}>
          Sign Up
        </span>
      </div>
    </div>
  );
}
