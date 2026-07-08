import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ShieldAlert, Award, FileText } from 'lucide-react';

export default function Profile() {
  const { user, logout, demoMode } = useAuth();

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 12)}...${addr.substring(addr.length - 12)}`;
  };

  return (
    <div className="profile-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Profile info card */}
      <div className="glass-panel profile-user-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="profile-avatar-circle">
          <User size={32} style={{ color: 'var(--accent-purple)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px' }}>{user?.name || 'Loading Name...'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={12} /> {user?.email}
          </p>
          <span className="badge badge-purple" style={{ fontSize: '10px', marginTop: '6px', textTransform: 'capitalize' }}>
            {user?.role}
          </span>
          {demoMode && (
            <span className="sandbox-badge" style={{ marginLeft: '8px' }}>Simulation Mode</span>
          )}
        </div>
        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-red)' }} onClick={logout}>
          Sign Out
        </button>
      </div>

      {/* Stellar Address Card */}
      <div className="glass-panel">
        <h4 style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Award size={16} style={{ color: 'var(--accent-cyan)' }} />
          Stellar Blockchain Identity
        </h4>
        <div className="wallet-address-pill" style={{ marginTop: '8px' }}>
          <code>{user?.wallet_address ? truncateAddress(user.wallet_address) : 'No address connected'}</code>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
          This address is linked to your GigFlow account. It acts as the escrow authority for approving work and receiving gig payouts.
        </p>
      </div>

      {/* About GigFlow Section */}
      <div className="glass-panel" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={16} style={{ color: 'var(--accent-purple)' }} />
          About GigFlow
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          GigFlow is a fully decentralized freelance contract marketplace. By employing Soroban smart contracts, client job budgets are locked securely in escrow, protecting freelancers from payment delays and clients from incomplete work.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>License: MIT</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Version: 1.0.0</span>
        </div>
      </div>
    </div>
  );
}
