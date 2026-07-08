import React, { useState } from 'react';
import { useVaccination } from '../hooks/useVaccination';
import { ShieldCheck, Plus, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function IssuerDashboard({ address, token }) {
  const [patient, setPatient] = useState('');
  const [vaccine, setVaccine] = useState('COVID-19');
  const [date, setDate] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [mintError, setMintError] = useState('');
  
  const { issueVaccination, loading } = useVaccination(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessInfo(null);
    setMintError('');

    if (!patient.startsWith('G') || patient.length !== 56) {
      setMintError('Invalid patient wallet address. Stellar public keys must start with a "G" and be 56 characters long.');
      return;
    }

    if (!date) {
      setMintError('Please select a vaccination administration date.');
      return;
    }

    // Convert date string to unix timestamp (seconds)
    const unixTimestamp = Math.floor(new Date(date).getTime() / 1000);

    try {
      const result = await issueVaccination(patient, vaccine, unixTimestamp);
      if (result && result.success) {
        setSuccessInfo({
          patient,
          vaccine,
          tokenId: result.tokenId,
        });
        setPatient('');
        setDate('');
        
        // Trigger celebration confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setMintError(err.message || 'An unexpected error occurred during contract execution.');
    }
  };

  return (
    <div className="issuer-dashboard">
      <div className="dashboard-header-card glass-panel">
        <div>
          <span className="badge badge-purple">Healthcare Center</span>
          <h2>Issue New Vaccination Record</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Authorized Clinic: <code>{address.substring(0, 12)}...{address.substring(address.length - 8)}</code>
          </p>
        </div>
      </div>

      <div className="form-layout-grid">
        <form className="glass-panel" onSubmit={handleSubmit}>
          <h3 className="form-card-title">Registration Form</h3>
          <p className="form-card-subtitle">Mint a soulbound vaccination credential to a patient's public key:</p>

          {mintError && (
            <div className="form-error-panel">
              <p>{mintError}</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Patient Stellar Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. GD3V7SOP5HET7N..."
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vaccine Type</label>
            <select
              className="form-input"
              value={vaccine}
              onChange={(e) => setVaccine(e.target.value)}
              disabled={loading}
            >
              <option value="COVID-19">COVID-19 (mRNA / Spike)</option>
              <option value="Influenza">Influenza (Flu Shot)</option>
              <option value="Hepatitis-B">Hepatitis B</option>
              <option value="MMR">MMR (Measles, Mumps, Rubella)</option>
              <option value="Polio">IPV (Inactivated Polio Vaccine)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Administration Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? <span className="loader" style={{ width: '16px', height: '16px' }}></span> : <Plus size={16} />}
            Mint Soulbound Record
          </button>
        </form>

        {successInfo && (
          <div className="glass-panel success-result-panel glass-panel-glow">
            <div className="success-icon-header">
              <CheckCircle size={40} style={{ color: 'var(--accent-green)' }} />
              <h4>Record Minted Successfully!</h4>
            </div>
            
            <div className="success-data-list">
              <div className="success-data-item">
                <span className="success-lbl">Token ID</span>
                <span className="success-val badge badge-cyan">SBT #{successInfo.tokenId}</span>
              </div>
              <div className="success-data-item">
                <span className="success-lbl">Vaccine</span>
                <span className="success-val">{successInfo.vaccine}</span>
              </div>
              <div className="success-data-item">
                <span className="success-lbl">Patient Address</span>
                <span className="success-val" style={{ fontSize: '12px' }}>
                  {successInfo.patient.substring(0, 16)}...{successInfo.patient.substring(38)}
                </span>
              </div>
              <div className="success-data-item">
                <span className="success-lbl">Status</span>
                <span className="success-val" style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Secured On-Chain</span>
              </div>
            </div>
            <p className="success-note-txt">
              This record has been published. The patient holds the token, and any third party can verify it via their address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
