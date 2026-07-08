import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { convertXlm, formatCurrency } from '../utils/currency';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, ShieldCheck, HelpCircle, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { user, demoMode } = useAuth();
  
  const [balances, setBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD'); // USD, NGN, GHS, KES
  const [actionLoading, setActionLoading] = useState(null); // id of actioned escrow
  
  const currencies = ['USD', 'NGN', 'GHS', 'KES'];

  const loadData = async () => {
    setLoading(true);
    try {
      // Load balances
      const balRes = await api.get('/wallet/balance');
      setBalances(balRes.data.balances || []);

      // Load transactions
      const txRes = await api.get('/payments/history');
      setTransactions(txRes.data.transactions || []);
    } catch (error) {
      console.warn("Failed to load live dashboard data. Using mock variables.");
      // Seed mock dashboard state
      setBalances([
        { code: 'XLM', balance: '1240.5000000', asset_type: 'native' },
        { code: 'USDC', balance: '350.0000000', asset_type: 'credit_alphanum4' }
      ]);
      setTransactions([
        { id: '1', recipient_address: 'GBADMIN12345678901234567890123456789012345678901234567890', amount: '150.00', asset: 'USDC', type: 'escrow', escrow_id: '840134', status: 'pending', created_at: new Date().toISOString() },
        { id: '2', recipient_address: 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH', amount: '45.00', asset: 'XLM', type: 'standard', status: 'completed', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmPayout = async (escrowId) => {
    setActionLoading(escrowId);
    try {
      await api.post(`/escrow/${escrowId}/confirm`);
      
      // Trigger success confetti
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.8 }
      });

      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Escrow confirmation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEscrow = async (escrowId) => {
    setActionLoading(escrowId);
    try {
      await api.post(`/escrow/${escrowId}/cancel`);
      alert('Escrow cancelled successfully. Funds refunded to your wallet.');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Escrow cancellation failed');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleCurrency = () => {
    const nextIdx = (currencies.indexOf(currency) + 1) % currencies.length;
    setCurrency(currencies[nextIdx]);
  };

  const getUSDCBalance = () => {
    const asset = balances.find(b => b.code === 'USDC');
    return parseFloat(asset?.balance || 0);
  };

  const getXLMBalance = () => {
    const asset = balances.find(b => b.code === 'XLM');
    return parseFloat(asset?.balance || 0);
  };

  const getConvertedTotal = () => {
    const totalInUSD = getUSDCBalance() + (getXLMBalance() * 0.10);
    if (currency === 'USD') return formatCurrency(totalInUSD, 'USD');
    
    // We convert the total USD estimate into local currencies
    // USD is the baseline asset (1 USDC = 1 USD)
    const converted = totalInUSD / 0.10; // convert to XLM equivalent
    return formatCurrency(convertXlm(converted, currency), currency);
  };

  return (
    <div className="dashboard-view animate-fade-in">
      {/* Wallet welcome card */}
      <div className="wallet-welcome-panel glass-panel glass-panel-glow">
        <div className="welcome-meta-header">
          <div>
            <p className="welcome-label">Wallet Balance</p>
            <h1 className="welcome-balance-value">{getConvertedTotal()}</h1>
          </div>
          <button className="currency-toggle-pill" onClick={toggleCurrency}>
            {currency}
          </button>
        </div>

        <div className="wallet-address-pill">
          <code>{user?.publicKey ? `${user.publicKey.substring(0, 8)}...${user.publicKey.substring(user.publicKey.length - 8)}` : 'No wallet linked'}</code>
          {demoMode && <span className="sandbox-badge">Simulation Mode</span>}
        </div>
      </div>

      {/* Balances detailed view */}
      <div className="balances-list-section">
        <h3 className="section-title-label">Available Asset balances</h3>
        <div className="balances-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
          <div className="glass-panel balance-asset-card">
            <span className="badge badge-cyan">XLM</span>
            <h4>{getXLMBalance().toFixed(4)} XLM</h4>
            <p>{formatCurrency(getXLMBalance() * 0.10, 'USD')}</p>
          </div>
          <div className="glass-panel balance-asset-card">
            <span className="badge badge-purple">USDC</span>
            <h4>{getUSDCBalance().toFixed(2)} USDC</h4>
            <p>{formatCurrency(getUSDCBalance(), 'USD')}</p>
          </div>
        </div>
      </div>

      {/* Escrows section */}
      {transactions.filter(t => t.type === 'escrow' && t.status === 'pending').length > 0 && (
        <div className="escrows-section">
          <h3 className="section-title-label">Pending Escrows</h3>
          <div className="escrows-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {transactions.filter(t => t.type === 'escrow' && t.status === 'pending').map(esc => (
              <div key={esc.id} className="glass-panel escrow-item-card">
                <div className="escrow-meta">
                  <div>
                    <span className="badge badge-purple" style={{ marginRight: '6px' }}>Escrow #{esc.escrow_id}</span>
                    <span className="badge badge-cyan">Pending</span>
                  </div>
                  <h4>{esc.amount} {esc.asset}</h4>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Target Payout Agent: <code>{esc.recipient_address.substring(0, 10)}...</code>
                </p>

                <div className="escrow-actions-row" style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  {user?.role === 'agent' ? (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                      onClick={() => handleConfirmPayout(esc.escrow_id)}
                      disabled={actionLoading === esc.escrow_id}
                    >
                      {actionLoading === esc.escrow_id ? <div className="loader"></div> : <Check size={14} />}
                      Confirm Payout
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '13px', color: 'var(--accent-red)' }}
                      onClick={() => handleCancelEscrow(esc.escrow_id)}
                      disabled={actionLoading === esc.escrow_id}
                    >
                      {actionLoading === esc.escrow_id ? <div className="loader"></div> : <X size={14} />}
                      Cancel Escrow (Refund)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions list */}
      <div className="recent-activity-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 className="section-title-label">Recent Activity</h3>
          <button className="refresh-data-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'icon-spin-loading' : ''} />
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No recent transaction history found.
          </div>
        ) : (
          <div className="activity-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="glass-panel activity-row-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="activity-icon-container">
                    {tx.status === 'completed' ? (
                      <ArrowUpRight size={16} style={{ color: 'var(--accent-green)' }} />
                    ) : tx.status === 'cancelled' ? (
                      <ArrowDownLeft size={16} style={{ color: 'var(--accent-red)' }} />
                    ) : (
                      <HelpCircle size={16} style={{ color: 'var(--accent-cyan)' }} />
                    )}
                  </div>
                  <div>
                    <h5 style={{ fontSize: '14px' }}>
                      {tx.type === 'escrow' ? 'Escrow Deposit' : 'Standard Payment'}
                    </h5>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      To: <code>{tx.recipient_address.substring(0, 6)}...{tx.recipient_address.substring(50)}</code>
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 'bold' }}>{tx.amount} {tx.asset}</h5>
                  <span className={`badge ${tx.status === 'completed' ? 'badge-green' : (tx.status === 'cancelled' ? 'badge-red' : 'badge-cyan')}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
