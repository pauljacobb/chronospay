import React, { useState, useEffect } from 'react';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifyPage from './pages/VerifyPage';
import { useFreighter } from './hooks/useFreighter';
import { Shield, LogOut, Search, User, PlusCircle, Globe } from 'lucide-react';

export default function App() {
  const {
    address,
    role,
    token,
    isConnecting,
    error,
    hasFreighter,
    demoMode,
    connect,
    connectMock,
    logout,
  } = useFreighter();

  const [activeTab, setActiveTab] = useState('landing');

  // Change tab when login state changes
  useEffect(() => {
    if (address) {
      if (role === 'issuer') {
        setActiveTab('issuer');
      } else {
        setActiveTab('patient');
      }
    } else {
      setActiveTab('landing');
    }
  }, [address, role]);

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="app-shell">
      {/* Dynamic Background Effects */}
      <div className="bg-aurora-glow purple"></div>
      <div className="bg-aurora-glow cyan"></div>

      {/* Navigation Header */}
      <header className="main-navbar glass-panel">
        <div className="nav-container container">
          <div className="nav-logo" onClick={() => setActiveTab(address ? (role === 'issuer' ? 'issuer' : 'patient') : 'landing')} style={{ cursor: 'pointer' }}>
            <Shield className="logo-icon" size={24} style={{ color: 'var(--accent-cyan)' }} />
            <span className="logo-text">Stellar<span className="gradient-text">Vax</span></span>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-item-btn ${activeTab === 'verify' ? 'active' : ''}`}
              onClick={() => setActiveTab('verify')}
            >
              <Search size={14} />
              Verify Check
            </button>

            {address && role === 'patient' && (
              <button
                className={`nav-item-btn ${activeTab === 'patient' ? 'active' : ''}`}
                onClick={() => setActiveTab('patient')}
              >
                <User size={14} />
                My Records
              </button>
            )}

            {address && role === 'issuer' && (
              <button
                className={`nav-item-btn ${activeTab === 'issuer' ? 'active' : ''}`}
                onClick={() => setActiveTab('issuer')}
              >
                <PlusCircle size={14} />
                Issue Certificate
              </button>
            )}
          </nav>

          <div className="nav-actions">
            {address ? (
              <div className="user-profile-widget">
                <span className={`badge ${role === 'issuer' ? 'badge-purple' : 'badge-cyan'}`}>
                  {role === 'issuer' ? 'Clinic' : 'Patient'}
                </span>
                {demoMode && <span className="badge badge-purple" style={{ opacity: 0.8 }}>Sandbox</span>}
                <code className="nav-user-address" title={address}>
                  {truncateAddress(address)}
                </code>
                <button className="nav-logout-btn" onClick={logout} title="Disconnect wallet">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" onClick={() => setActiveTab('verify')}>
                <Globe size={14} style={{ marginRight: '6px' }} />
                Public Portal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container main-content-wrapper" style={{ padding: '40px 24px 80px 24px' }}>
        {activeTab === 'landing' && (
          <Landing
            connect={connect}
            connectMock={connectMock}
            isConnecting={isConnecting}
            error={error}
            hasFreighter={hasFreighter}
          />
        )}
        {activeTab === 'patient' && address && (
          <PatientDashboard address={address} token={token} />
        )}
        {activeTab === 'issuer' && address && (
          <IssuerDashboard address={address} token={token} />
        )}
        {activeTab === 'verify' && (
          <VerifyPage />
        )}
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container footer-content">
          <p>© 2026 StellarVax Contributors. Released under the MIT License.</p>
          <p style={{ color: 'var(--text-muted)' }}>Stellar Soroban App Integration • Testnet Sandbox</p>
        </div>
      </footer>
    </div>
  );
}
