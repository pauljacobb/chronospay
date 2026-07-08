import React from 'react';
import { Shield, Key, HeartPulse, Sparkles, CheckSquare } from 'lucide-react';

export default function Landing({ connect, connectMock, isConnecting, error, hasFreighter }) {
  const mockPatientAddr = 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';
  const mockIssuerAddr = 'GBADMIN12345678901234567890123456789012345678901234567890';

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-glow-bg"></div>
        <div className="hero-tag-container">
          <span className="badge badge-purple glow-glow-effect">
            <Sparkles size={13} style={{ marginRight: '4px' }} /> Powered by Soroban & Stellar
          </span>
        </div>
        <h1 className="hero-title">
          Tamper-Proof, On-Chain <br />
          <span className="gradient-text">Vaccination Records</span>
        </h1>
        <p className="hero-subtitle">
          StellarVax issues non-transferable, soulbound NFTs on the Stellar network representing verification credentials.
          Healthcare providers sign, patients hold, and verifiers check on-chain.
        </p>

        <div className="hero-actions">
          {error && <div className="error-banner-message">{error}</div>}
          
          <button className="btn btn-primary" onClick={connect} disabled={isConnecting}>
            {isConnecting ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : <Key size={16} />}
            Connect Freighter Wallet
          </button>
          
          {!hasFreighter && (
            <p className="wallet-missing-notice">
              Freighter extension not detected. You can test using the simulation sandbox below.
            </p>
          )}
        </div>
      </div>

      <div className="sandbox-panel glass-panel">
        <div className="sandbox-header">
          <HeartPulse size={20} className="icon-pulse-glow" style={{ color: 'var(--accent-cyan)' }} />
          <h3>Interactive Testing Sandbox</h3>
        </div>
        <p className="sandbox-description">
          Simulate a real issuer and patient transaction workflow directly in your browser:
        </p>
        <div className="sandbox-buttons">
          <button className="btn btn-secondary" onClick={() => connectMock(mockIssuerAddr, 'issuer')}>
            <HeartPulse size={16} style={{ color: 'var(--accent-purple)' }} />
            Issuer Dashboard
          </button>
          <button className="btn btn-secondary" onClick={() => connectMock(mockPatientAddr, 'patient')}>
            <Shield size={16} style={{ color: 'var(--accent-cyan)' }} />
            Patient Wallet
          </button>
        </div>
      </div>

      <div className="landing-grid-features">
        <div className="feature-card glass-panel">
          <div className="feature-icon cyan">
            <Shield size={24} />
          </div>
          <h4>Soulbound Protocol</h4>
          <p>Vaccination credentials are strictly locked. Any smart contract transfer requests are automatically blocked.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-icon purple">
            <CheckSquare size={24} />
          </div>
          <h4>Public Validation</h4>
          <p>Schools, employers, and travel entities can verify credentials directly from ledger records without centralized servers.</p>
        </div>
        <div className="feature-card glass-panel">
          <div className="feature-icon green">
            <Key size={24} />
          </div>
          <h4>Stellar Web Auth</h4>
          <p>Secure replay-resistant authorization flow leveraging standard SEP-10 signature challenges and JWTs.</p>
        </div>
      </div>
    </div>
  );
}
