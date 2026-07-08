import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowLeft } from 'lucide-react';

export default function Login({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { login, loading } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const success = await login(email, password);
      if (!success) {
        setErrorMsg('Invalid email or password combination.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred.');
    }
  };

  const autofill = (role) => {
    if (role === 'client') {
      setEmail('client@gigflow.com');
      setPassword('password123');
    } else {
      setEmail('freelancer@gigflow.com');
      setPassword('password123');
    }
  };

  return (
    <div className="auth-screen animate-fade-in">
      <div className="auth-header">
        <button className="auth-back-btn" onClick={() => onNavigate('welcome')}>
          <ArrowLeft size={16} />
        </button>
        <h2>Welcome Back</h2>
        <p>Sign in to access your gig contracts</p>
      </div>

      <form onSubmit={handleLogin} className="auth-form-card glass-panel">
        {errorMsg && <div className="form-error-panel">{errorMsg}</div>}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-with-icon">
            <Mail className="input-icon-element" size={16} />
            <input
              type="email"
              className="form-input icon-indent"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-with-icon">
            <Lock className="input-icon-element" size={16} />
            <input
              type="password"
              className="form-input icon-indent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
          {loading ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : 'Sign In'}
        </button>
      </form>

      <div className="glass-panel demo-quickfill-card" style={{ marginTop: '20px', padding: '12px' }}>
        <h4 style={{ fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Demo Sandbox Quick Fill</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }} onClick={() => autofill('client')}>
            Client
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '6px 12px', flex: 1 }} onClick={() => autofill('freelancer')}>
            Freelancer
          </button>
        </div>
      </div>

      <p className="auth-footer-link" style={{ marginTop: '20px' }}>
        Don't have an account?{' '}
        <span onClick={() => onNavigate('register')} style={{ color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign Up
        </span>
      </p>
    </div>
  );
}
