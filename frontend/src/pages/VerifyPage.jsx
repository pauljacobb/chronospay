import React, { useState } from 'react';
import { useVaccination } from '../hooks/useVaccination';
import VerificationBadge from '../components/VerificationBadge';
import NFTCard from '../components/NFTCard';
import { Search, HelpCircle } from 'lucide-react';

export default function VerifyPage() {
  const [wallet, setWallet] = useState('');
  const [result, setResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const { verifyWallet, loading } = useVaccination(null);

  const handleVerify = async (e) => {
    e.preventDefault();
    setResult(null);
    setSearchError('');

    if (!wallet.startsWith('G') || wallet.length !== 56) {
      setSearchError('Address must start with a "G" and have exactly 56 characters.');
      return;
    }

    try {
      const data = await verifyWallet(wallet);
      setResult(data);
    } catch (err) {
      setSearchError(err.message || 'On-chain verification query failed.');
    }
  };

  const fillDemoAddress = () => {
    setWallet('GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH');
  };

  return (
    <div className="verify-page">
      <div className="dashboard-header-card glass-panel">
        <div>
          <span className="badge badge-cyan">Public Registry</span>
          <h2>Verify Immunization Credentials</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Check patient vaccination credentials on-chain. No authentication required.
          </p>
        </div>
      </div>

      <div className="search-form-container glass-panel">
        <form onSubmit={handleVerify} className="search-flex-row">
          <div className="form-group flex-grow-1" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Enter patient Stellar public address (G...)"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : <Search size={16} />}
            Verify
          </button>
        </form>

        {searchError && <div className="form-error-panel" style={{ marginTop: '16px' }}>{searchError}</div>}

        <div className="demo-helper-row" style={{ marginTop: '16px', fontSize: '13px' }}>
          <span className="flex-align-center" style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={fillDemoAddress}>
            <HelpCircle size={14} style={{ marginRight: '4px', color: 'var(--accent-cyan)' }} />
            Click here to fill with Demo Patient address.
          </span>
        </div>
      </div>

      {result && (
        <div className="verify-results-container animate-fade-in" style={{ marginTop: '24px' }}>
          <VerificationBadge verified={result.verified} count={result.count} />

          {result.verified && result.records && (
            <div className="verified-list-section" style={{ marginTop: '32px' }}>
              <h3 className="section-title">Immunization Records</h3>
              <div className="credentials-grid-display" style={{ marginTop: '16px' }}>
                {result.records.map((rec) => (
                  <NFTCard key={rec.token_id} record={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
