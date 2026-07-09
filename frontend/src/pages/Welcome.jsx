import React from 'react';
import { Activity, ShieldAlert, Coins } from 'lucide-react';

export default function Welcome({ onNavigate }) {
  return (
    <div className="welcome-screen animate-fade-in">
      <div className="welcome-brand-section">
        <div className="welcome-logo-circle">
          <Activity size={44} className="icon-send-rotate" style={{ color: 'var(--accent-purple)' }} />
        </div>
        <h1 className="welcome-title">Chronos<span className="gradient-text" style={{ background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pay</span></h1>
        <p className="welcome-subtitle">Decentralized Real-Time Payment Streams</p>
      </div>

      <div className="welcome-hero-card glass-panel glass-panel-glow">
        <h3 style={{ marginBottom: '8px' }}>Continuous Linear Vesting</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
          Lock funds once and stream them continuously over time. Recipients can withdraw vested funds in real-time. Full sender protection with time-split cancellation.
        </p>
      </div>

      <div className="welcome-stats-row">
        <div className="welcome-stat-pill">
          <ShieldAlert size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>Soroban Smart Escrow</span>
        </div>
        <div className="welcome-stat-pill">
          <Coins size={14} style={{ color: 'var(--accent-green)' }} />
          <span>0% Middleman Fees</span>
        </div>
      </div>

      <div className="welcome-actions">
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onNavigate('register')}>
          Get Started
        </button>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => onNavigate('login')}>
          Sign In
        </button>
      </div>
    </div>
  );
}
