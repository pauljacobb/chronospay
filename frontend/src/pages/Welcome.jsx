import React from 'react';
import { Send, Shield, Globe } from 'lucide-react';

export default function Welcome({ onNavigate }) {
  return (
    <div className="welcome-screen animate-fade-in">
      <div className="welcome-brand-section">
        <div className="welcome-logo-circle">
          <Send size={44} className="icon-send-rotate" style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <h1 className="welcome-title">Kora<span className="gradient-text">Pay</span></h1>
        <p className="welcome-subtitle">Cross-Border Stellar Remittances</p>
      </div>

      <div className="welcome-hero-card glass-panel glass-panel-glow">
        <h3 style={{ marginBottom: '8px' }}>Remit Instantly</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
          Connect senders directly with payout agents across Africa using USDC stablecoins. Fast, secure, and low-cost on-chain escrows.
        </p>
      </div>

      <div className="welcome-stats-row">
        <div className="welcome-stat-pill">
          <Shield size={14} style={{ color: 'var(--accent-green)' }} />
          <span>Escrow Protected</span>
        </div>
        <div className="welcome-stat-pill">
          <Globe size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span>USD / NGN / KES / GHS</span>
        </div>
      </div>

      <div className="welcome-actions">
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onNavigate('register')}>
          Create Account
        </button>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => onNavigate('login')}>
          Sign In
        </button>
      </div>
    </div>
  );
}
