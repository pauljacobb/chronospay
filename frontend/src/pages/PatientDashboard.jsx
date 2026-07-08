import React, { useEffect, useState } from 'react';
import NFTCard from '../components/NFTCard';
import { useVaccination } from '../hooks/useVaccination';
import { RefreshCw, ClipboardCheck, Copy } from 'lucide-react';

export default function PatientDashboard({ address, token }) {
  const [records, setRecords] = useState([]);
  const [copied, setCopied] = useState(false);
  const { fetchRecords, loading } = useVaccination(token);

  const loadRecords = async () => {
    const data = await fetchRecords(address);
    setRecords(data);
  };

  useEffect(() => {
    if (address) {
      loadRecords();
    }
  }, [address]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr) => {
    return `${addr.substring(0, 10)}...${addr.substring(addr.length - 8)}`;
  };

  return (
    <div className="patient-dashboard">
      <div className="dashboard-header-card glass-panel">
        <div className="header-meta">
          <span className="badge badge-cyan">Patient Portfolio</span>
          <h2>My Health Credentials</h2>
          <div className="wallet-copy-pill" onClick={handleCopy}>
            <code>{truncateAddress(address)}</code>
            {copied ? <ClipboardCheck size={14} style={{ color: 'var(--accent-green)' }} /> : <Copy size={13} />}
            {copied && <span className="pill-tooltip">Copied Address!</span>}
          </div>
        </div>
        
        <button className="btn btn-secondary" onClick={loadRecords} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'icon-spin-loading' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="centered-loader-state">
          <span className="loader" style={{ width: '32px', height: '32px' }}></span>
          <p>Querying Soroban contract keys for vaccine credentials...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="empty-portfolio-state glass-panel">
          <h3>No Credentials Found</h3>
          <p>There are currently no vaccination records associated with this Stellar address.</p>
          <p className="sub-hint">Please provide your public address to an authorized health center to register your vaccine.</p>
        </div>
      ) : (
        <div className="credentials-grid-display">
          {records.map((rec) => (
            <NFTCard key={rec.token_id} record={rec} />
          ))}
        </div>
      )}
    </div>
  );
}
