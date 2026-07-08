import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, Mail, Shield, Plus, Trash2, HelpCircle, HeartPulse, Send, AlertOctagon } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  
  // Contacts State
  const [contacts, setContacts] = useState([]);
  const [contactName, setContactName] = useState('');
  const [contactWallet, setContactWallet] = useState('');
  
  // Ticket State
  const [tickets, setTickets] = useState([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Admin Clawback & Health State
  const [clawbackTarget, setClawbackTarget] = useState('');
  const [clawbackAmount, setClawbackAmount] = useState('');
  const [clawbackAsset, setClawbackAsset] = useState('USDC');
  const [clawbackSuccess, setClawbackSuccess] = useState('');
  const [adminStats, setAdminStats] = useState(null);
  
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      // Get contacts
      const contactsRes = await api.get('/wallet/contacts');
      setContacts(contactsRes.data.contacts || []);

      // Get tickets
      const ticketsRes = await api.get('/support/tickets');
      setTickets(ticketsRes.data.tickets || []);

      // Get admin stats if admin
      if (user?.role === 'admin') {
        const statsRes = await api.get('/admin/health');
        setAdminStats(statsRes.data.diagnostics);
      }
    } catch (err) {
      console.warn("Failed to load profile data from API. Initializing simulated data.");
      setContacts([
        { id: '1', name: 'Alice Friend', wallet_address: 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH' }
      ]);
      setTickets([
        { id: '1', subject: 'Escrow Dispute #840134', description: 'Agent has not updated off-chain local payout.', status: 'open', created_at: new Date().toISOString() }
      ]);
      if (user?.role === 'admin') {
        setAdminStats({
          registeredUsers: 142,
          processedTransactions: 840,
          stellarNetwork: 'testnet',
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Contacts Handlers
  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactName || !contactWallet) return;

    try {
      await api.post('/wallet/contacts', { name: contactName, walletAddress: contactWallet });
      setContactName('');
      setContactWallet('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add contact');
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await api.delete(`/wallet/contacts/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete contact');
    }
  };

  // Support Handlers
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketDesc) return;

    try {
      await api.post('/support/tickets', { subject: ticketSubject, description: ticketDesc });
      setTicketSubject('');
      setTicketDesc('');
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 3000);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit support ticket');
    }
  };

  // Admin Clawback Handlers
  const handleAdminClawback = async (e) => {
    e.preventDefault();
    setClawbackSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/admin/clawback', {
        targetAddress: clawbackTarget,
        amount: clawbackAmount,
        assetCode: clawbackAsset
      });
      setClawbackSuccess(`Success! Clawback executed on-chain. Hash: ${res.data.txHash.substring(0, 16)}...`);
      setClawbackTarget('');
      setClawbackAmount('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Clawback execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Profile info card */}
      <div className="glass-panel profile-user-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div className="profile-avatar-circle">
          <User size={32} style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '18px' }}>{user?.name || 'Loading Name...'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={12} /> {user?.email}
          </p>
          <span className="badge badge-purple" style={{ fontSize: '10px', marginTop: '6px', textTransform: 'capitalize' }}>
            {user?.role}
          </span>
        </div>
        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-red)' }} onClick={logout}>
          Sign Out
        </button>
      </div>

      {/* Admin Panel */}
      {user?.role === 'admin' && (
        <div className="glass-panel admin-compliance-panel" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <h3 className="section-title-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={18} style={{ color: 'var(--accent-red)' }} />
            Compliance Admin Panel
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Asset clawback controls and system diagnostics for regulatory compliance:
          </p>

          {adminStats && (
            <div className="success-data-list" style={{ marginTop: '12px', gridTemplateColumns: '1fr 1fr', display: 'grid', gap: '10px' }}>
              <div className="success-data-item" style={{ flexDirection: 'column', alignItems: 'start' }}>
                <span className="success-lbl" style={{ fontSize: '11px' }}>Users</span>
                <span className="success-val">{adminStats.registeredUsers}</span>
              </div>
              <div className="success-data-item" style={{ flexDirection: 'column', alignItems: 'start' }}>
                <span className="success-lbl" style={{ fontSize: '11px' }}>Transactions</span>
                <span className="success-val">{adminStats.processedTransactions}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleAdminClawback} style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--accent-red)' }}>Compliance Asset Clawback</h4>
            
            {clawbackSuccess && <div className="form-error-panel" style={{ background: 'rgba(0, 255, 135, 0.05)', border: '1px solid rgba(0, 255, 135, 0.2)', color: 'var(--accent-green)' }}>{clawbackSuccess}</div>}

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11px' }}>Target Wallet Address</label>
              <input
                type="text"
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                placeholder="Stellar Address (G...)"
                value={clawbackTarget}
                onChange={(e) => setClawbackTarget(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px' }}>Clawback Volume</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  placeholder="0.00"
                  value={clawbackAmount}
                  onChange={(e) => setClawbackAmount(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px' }}>Asset</label>
                <select
                  className="form-input"
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                  value={clawbackAsset}
                  onChange={(e) => setClawbackAsset(e.target.value)}
                  disabled={loading}
                >
                  <option value="USDC">USDC</option>
                  <option value="XLM">XLM</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '8px 12px', fontSize: '13px', background: 'var(--accent-red)', boxShadow: 'none' }} disabled={loading}>
              {loading ? <span className="loader" style={{ width: '14px', height: '14px' }}></span> : <AlertOctagon size={14} />}
              Execute Clawback
            </button>
          </form>
        </div>
      )}

      {/* Saved Contacts panel */}
      <div className="glass-panel contacts-manager-card">
        <h3 className="section-title-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Saved Contacts
        </h3>
        
        {/* Add contact Form */}
        <form onSubmit={handleAddContact} style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
            placeholder="Contact Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
          />
          <input
            type="text"
            className="form-input"
            style={{ flex: 2, padding: '8px 12px', fontSize: '13px' }}
            placeholder="Stellar Key (G...)"
            value={contactWallet}
            onChange={(e) => setContactWallet(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>
            Add
          </button>
        </form>

        {/* Contacts list */}
        <div className="contacts-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {contacts.length === 0 ? (
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '10px' }}>
              No saved contacts yet.
            </p>
          ) : (
            contacts.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <h5 style={{ fontSize: '13px', fontWeight: 'bold' }}>{c.name}</h5>
                  <code style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {c.wallet_address.substring(0, 10)}...{c.wallet_address.substring(46)}
                  </code>
                </div>
                <button className="nav-logout-btn" onClick={() => handleDeleteContact(c.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Support & Dispute tickets */}
      <div className="glass-panel support-disputes-card">
        <h3 className="section-title-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HelpCircle size={16} /> Support & Escrow Disputes
        </h3>

        {ticketSuccess && <div className="form-error-panel" style={{ background: 'rgba(0, 255, 135, 0.05)', border: '1px solid rgba(0, 255, 135, 0.2)', color: 'var(--accent-green)', marginTop: '10px' }}>Ticket submitted successfully!</div>}

        <form onSubmit={handleCreateTicket} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '13px' }}
              placeholder="Dispute Subject / Ticket Title"
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <textarea
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '13px', minHeight: '60px', fontFamily: 'inherit' }}
              placeholder="Provide transaction details or dispute description..."
              value={ticketDesc}
              onChange={(e) => setTicketDesc(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }}>
            Submit Dispute
          </button>
        </form>

        {/* Tickets log */}
        <div className="tickets-log" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>My Disputes</h4>
          {tickets.length === 0 ? (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>No active tickets.</p>
          ) : (
            tickets.map(t => (
              <div key={t.id} style={{ background: 'rgba(255, 255, 255, 0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: 'bold' }}>{t.subject}</h5>
                  <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>{t.status}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                  {t.description}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
