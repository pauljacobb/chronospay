import React from 'react';
import { Briefcase, ShieldAlert, Coins } from 'lucide-react';

export default function Welcome({ onNavigate }) {
  return (
    <div className="welcome-screen animate-fade-in">
      <div className="welcome-brand-section">
        <div className="welcome-logo-circle">
          <Briefcase size={44} className="icon-send-rotate" style={{ color: 'var(--accent-purple)' }} />
        </div>
        <h1 className="welcome-title">Gig<span className="gradient-text">Flow</span></h1>
        <p className="welcome-subtitle">Decentralized Freelance Marketplace</p>
      </div>

      <div className="welcome-hero-card glass-panel glass-panel-glow">
        <h3 style={{ marginBottom: '8px' }}>Escrow Guaranteed Gigs</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5' }}>
          Post contracts, bid on proposals, and secure payments in on-chain Soroban escrow contracts. Automated release upon approval.
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
