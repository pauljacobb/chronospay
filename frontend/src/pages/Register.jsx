import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserCheck, ArrowLeft } from 'lucide-react';

export default function Register({ onNavigate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client'); // client, freelancer
  const [errorMsg, setErrorMsg] = useState('');

  const { register, loading } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      const success = await register(name, email, password, role);
      if (!success) {
        setErrorMsg('Registration failed. Try again.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred.');
    }
  };

  return (
    <div className="auth-screen animate-fade-in">
      <div className="auth-header">
        <button className="auth-back-btn" onClick={() => onNavigate('welcome')}>
          <ArrowLeft size={16} />
        </button>
        <h2>Join GigFlow</h2>
        <p>Connect secure Freighter keypairs instantly</p>
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
              placeholder="John Doe"
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

        <div className="form-group">
          <label className="form-label">I want to...</label>
          <div className="input-with-icon">
            <UserCheck className="input-icon-element" size={16} />
            <select
              className="form-input icon-indent"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="client">Post Gigs & Hire (Client)</option>
              <option value="freelancer">Apply & Complete Work (Freelancer)</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
          {loading ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : 'Sign Up'}
        </button>
      </form>

      <p className="auth-footer-link">
        Already have an account?{' '}
        <span onClick={() => onNavigate('login')} style={{ color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign In
        </span>
      </p>
    </div>
  );
}
