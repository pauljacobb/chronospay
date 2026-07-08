import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Copy, ClipboardCheck, QrCode } from 'lucide-react';

export default function Wallet() {
  const { user, demoMode } = useAuth();
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState('0.0000');
  const [loading, setLoading] = useState(true);

  const loadBalance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wallet/balance');
      const xlm = res.data.balances.find(b => b.code === 'XLM');
      setBalance(parseFloat(xlm?.balance || 0).toFixed(4));
    } catch (err) {
      console.warn("REST API offline, simulating balance.");
      setBalance('10000.0000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const handleCopy = () => {
    if (user?.wallet_address) {
      navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 12)}...${addr.substring(addr.length - 12)}`;
  };

  return (
    <div className="receive-money-view animate-fade-in">
      <div className="dashboard-header-card glass-panel" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
        <div className="header-meta">
          <span className="badge badge-cyan">Wallet Ledger</span>
          <h2>My Freighter Key</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Check balances or share address to receive freelancer transfers.
          </p>
        </div>
      </div>

      <div className="glass-panel qr-code-card-container glass-panel-glow" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 24px', textAlign: 'center' }}>
        <div className="qr-glow-halo"></div>
        <div className="qr-code-svg-wrap" style={{ position: 'relative', width: '180px', height: '180px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', fill: 'var(--accent-cyan)' }}>
            <rect x="10" y="10" width="20" height="20" fill="none" stroke="var(--accent-cyan)" strokeWidth="4" />
            <rect x="15" y="15" width="10" height="10" />
            <rect x="70" y="10" width="20" height="20" fill="none" stroke="var(--accent-cyan)" strokeWidth="4" />
            <rect x="75" y="15" width="10" height="10" />
            <rect x="10" y="70" width="20" height="20" fill="none" stroke="var(--accent-cyan)" strokeWidth="4" />
            <rect x="15" y="75" width="10" height="10" />
            <circle cx="50" cy="50" r="10" fill="#070614" stroke="var(--accent-purple)" strokeWidth="2" />
            <path d="M48,46 L53,50 L48,54" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" />
            <rect x="40" y="15" width="8" height="8" />
            <rect x="52" y="10" width="10" height="4" />
            <rect x="40" y="30" width="4" height="12" />
            <rect x="10" y="45" width="12" height="6" />
            <rect x="75" y="40" width="15" height="10" />
            <rect x="70" y="55" width="8" height="8" />
            <rect x="80" y="70" width="10" height="15" />
            <rect x="42" y="72" width="15" height="10" />
          </svg>
        </div>

        <h3 className="qr-title-tag" style={{ marginTop: '24px', fontSize: '18px' }}>
          {loading ? '...' : `${balance} XLM`}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Stellar Network Balance {demoMode && '(Mock)'}
        </p>

        <div className="wallet-copy-pill" style={{ marginTop: '24px', width: '100%', justifyContent: 'space-between', padding: '10px 16px' }} onClick={handleCopy}>
          <code style={{ fontSize: '12px' }}>{user?.wallet_address ? truncateAddress(user.wallet_address) : 'No Public Key'}</code>
          {copied ? <ClipboardCheck size={16} style={{ color: 'var(--accent-green)' }} /> : <Copy size={15} />}
          {copied && <span className="pill-tooltip">Copied Address!</span>}
        </div>
      </div>
    </div>
  );
}
