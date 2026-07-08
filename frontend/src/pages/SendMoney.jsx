import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SendMoney() {
  const { user } = useAuth();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('USDC'); // USDC, XLM
  const [paymentType, setPaymentType] = useState('standard'); // standard, escrow
  const [agentWallet, setAgentWallet] = useState('GBADMIN12345678901234567890123456789012345678901234567890');
  
  const [step, setStep] = useState(1); // 1 = form, 2 = confirm
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    async function loadContacts() {
      try {
        const res = await api.get('/wallet/contacts');
        setContacts(res.data.contacts || []);
      } catch (err) {
        console.warn("Failed to load contacts for dropdown.");
      }
    }
    loadContacts();
  }, []);

  const handleNextStep = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!recipient.startsWith('G') || recipient.length !== 56) {
      setErrorMsg('Invalid recipient wallet address. Stellar addresses must be 56 characters long and start with a "G".');
      return;
    }

    if (parseFloat(amount) <= 0 || isNaN(amount)) {
      setErrorMsg('Please specify a positive payment amount.');
      return;
    }

    if (paymentType === 'escrow') {
      if (!agentWallet.startsWith('G') || agentWallet.length !== 56) {
        setErrorMsg('Invalid payout agent wallet address.');
        return;
      }
    }

    setStep(2);
  };

  const handleSendPayment = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let endpoint = '/payments/send';
      let payload = { recipientAddress: recipient, amount, asset };

      if (paymentType === 'escrow') {
        endpoint = '/escrow/create';
        payload = { agent_wallet: agentWallet, amount, asset };
      }

      const res = await api.post(endpoint, payload);
      
      setSuccessInfo({
        txHash: res.data.txHash,
        escrowId: res.data.escrowId || null,
        amount,
        asset,
        paymentType
      });

      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.7 }
      });

      setRecipient('');
      setAmount('');
      setStep(1);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Transaction failed. Please check your balance or velocity limit.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const selectContact = (address) => {
    setRecipient(address);
  };

  return (
    <div className="send-money-view animate-fade-in">
      <div className="dashboard-header-card glass-panel" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
        <div className="header-meta">
          <span className="badge badge-purple">Remittance</span>
          <h2>Transfer Assets</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Send instant XLM/USDC standard payments or escrowed agent transfers.
          </p>
        </div>
      </div>

      {successInfo && (
        <div className="glass-panel success-result-panel glass-panel-glow animate-fade-in" style={{ marginTop: '20px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)' }}>
            <ShieldCheck size={20} />
            Transfer Successful!
          </h4>
          <div className="success-data-list" style={{ marginTop: '12px' }}>
            <div className="success-data-item">
              <span>Amount Sent</span>
              <span className="success-val">{successInfo.amount} {successInfo.asset}</span>
            </div>
            <div className="success-data-item">
              <span>Transaction Type</span>
              <span className="success-val" style={{ textTransform: 'capitalize' }}>{successInfo.paymentType}</span>
            </div>
            {successInfo.escrowId && (
              <div className="success-data-item">
                <span>Escrow ID</span>
                <span className="success-val badge badge-cyan">#{successInfo.escrowId}</span>
              </div>
            )}
            <div className="success-data-item">
              <span>Status</span>
              <span className="success-val" style={{ color: 'var(--accent-green)' }}>On-Chain Settled</span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ width: '100%', marginTop: '14px' }} onClick={() => setSuccessInfo(null)}>
            Send Another Payment
          </button>
        </div>
      )}

      {!successInfo && step === 1 && (
        <form onSubmit={handleNextStep} className="glass-panel" style={{ marginTop: '20px' }}>
          <h3 className="form-card-title">Remittance Details</h3>
          <p className="form-card-subtitle">Specify payment volume, recipient wallet, and escrow options:</p>

          {errorMsg && <div className="form-error-panel">{errorMsg}</div>}

          {contacts.length > 0 && (
            <div className="form-group">
              <label className="form-label">Saved Contacts</label>
              <select className="form-input" onChange={(e) => selectContact(e.target.value)} defaultValue="">
                <option value="" disabled>Select a contact to fill address</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.wallet_address}>{c.name} ({c.wallet_address.substring(0, 6)}...)</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Recipient Wallet Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="Stellar Public Key (G...)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transaction Type</label>
            <select
              className="form-input"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="standard">Standard Transfer (Direct payout)</option>
              <option value="escrow">Agent Escrow Transfer (Protected local fiat pickup)</option>
            </select>
          </div>

          {paymentType === 'escrow' && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Select Payout Agent Wallet</label>
              <select
                className="form-input"
                value={agentWallet}
                onChange={(e) => setAgentWallet(e.target.value)}
              >
                <option value="GBADMIN12345678901234567890123456789012345678901234567890">Kora Agent Lagos (Nigeria)</option>
                <option value="GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH">Kora Agent Nairobi (Kenya)</option>
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                step="0.0001"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Asset</label>
              <select
                className="form-input"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Next Step
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {!successInfo && step === 2 && (
        <div className="glass-panel glass-panel-glow" style={{ marginTop: '20px' }}>
          <h3 className="form-card-title">Review Transaction</h3>
          <p className="form-card-subtitle">Confirm transfer details before broadcasting to Stellar Ledger:</p>

          <div className="success-data-list">
            <div className="success-data-item">
              <span className="success-lbl">Recipient Wallet</span>
              <span className="success-val" style={{ fontSize: '12px' }}>
                {recipient.substring(0, 12)}...{recipient.substring(44)}
              </span>
            </div>
            <div className="success-data-item">
              <span className="success-lbl">Amount</span>
              <span className="success-val">{amount} {asset}</span>
            </div>
            <div className="success-data-item">
              <span className="success-lbl">Network Fee</span>
              <span className="success-val" style={{ color: 'var(--text-secondary)' }}>0.0001 XLM</span>
            </div>
            <div className="success-data-item">
              <span className="success-lbl">Platform Fee</span>
              <span className="success-val" style={{ color: 'var(--text-secondary)' }}>
                {paymentType === 'escrow' ? '2.5% (250 bps)' : '0%'}
              </span>
            </div>
            <div className="success-data-item" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span className="success-lbl" style={{ fontWeight: 'bold' }}>Total Remitted</span>
              <span className="success-val" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{amount} {asset}</span>
            </div>
          </div>

          <div className="form-error-panel" style={{ background: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.1)', color: 'var(--text-secondary)', display: 'flex', gap: '8px', marginTop: '16px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <p style={{ fontSize: '11px', lineHeight: '1.4' }}>
              Transactions broadcast to the Stellar ledger are irreversible. {paymentType === 'escrow' ? 'Escrowed transactions can be cancelled for a refund if the agent has not yet confirmed the local payout.' : 'Standard direct transactions settle immediately.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)} disabled={loading}>
              Back
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSendPayment} disabled={loading}>
              {loading ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : <Send size={14} />}
              Confirm & Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
