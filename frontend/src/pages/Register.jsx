import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserCheck, ArrowLeft } from 'lucide-react';

export default function Register({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // user, agent
  const [errorMsg, setErrorMsg] = useState('');
  
  const { register, loading } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      const success = await register(name, email, password, role);
      if (!success) {
        setErrorMsg('Registration failed. Email might already be taken.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected registration error occurred.');
    }
  };

  return (
    <div className="auth-screen animate-fade-in">
      <div className="auth-header">
        <button className="auth-back-btn" onClick={() => onNavigate('welcome')}>
          <ArrowLeft size={16} />
        </button>
        <h2>Create Account</h2>
        <p>Set up your Stellar wallet keys automatically</p>
      </div>

      <form onSubmit={handleRegister} className="auth-form-card glass-panel">
        {errorMsg && <div className="form-error-panel">{errorMsg}</div>}

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="input-with-icon">
            <User className="input-icon-element" size={16} />
            <input
              type="text"
              className="form-input icon-indent"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-with-icon">
            <Mail className="input-icon-element" size={16} />
            <input
              type="email"
              className="form-input icon-indent"
              placeholder="e.g. name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Secure Password</label>
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

        <div className="form-group">
          <label className="form-label">Account Role</label>
          <div className="input-with-icon">
            <UserCheck className="input-icon-element" size={16} />
            <select
              className="form-input icon-indent"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="user">Remittance Sender (User)</option>
              <option value="agent">Payout Agent (Liquidity Partner)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
          {loading ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : 'Generate Wallet'}
        </button>
      </form>

      <p className="auth-footer-link">
        Already have an account?{' '}
        <span onClick={() => onNavigate('login')} style={{ color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign In
        </span>
      </p>
    </div>
  );
}
