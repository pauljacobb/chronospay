import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, PlusCircle, Wallet, LogOut } from 'lucide-react';

export default function Layout({ children, currentTab, onChangeTab }) {
  const { user, balance, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(8, 7, 18, 0.4)' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ChronosPay
          </h4>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {user?.role === 'sender' ? 'Sender Portal' : 'Recipient Portal'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{truncateAddress(user?.wallet_address)}</div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-green)' }}>{balance} XLM</div>
          </div>
          <button onClick={handleLogout} style={{ background: 'rgba(255,62,62,0.1)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--accent-red)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="viewport-content" style={{ flex: 1 }}>
        {children}
      </div>

      {/* Bottom Nav Bar */}
      <div className="bottom-nav">
        <button
          className={`nav-item ${currentTab === 'streams' ? 'active' : ''}`}
          onClick={() => onChangeTab('streams')}
        >
          <Home size={22} />
          <span>Streams</span>
        </button>

        {user?.role === 'sender' && (
          <button
            className={`nav-item ${currentTab === 'create' ? 'active' : ''}`}
            onClick={() => onChangeTab('create')}
          >
            <PlusCircle size={22} />
            <span>Create Stream</span>
          </button>
        )}

        <button
          className={`nav-item ${currentTab === 'wallet' ? 'active' : ''}`}
          onClick={() => onChangeTab('wallet')}
        >
          <Wallet size={22} />
          <span>Wallet</span>
        </button>
      </div>
    </div>
  );
}
