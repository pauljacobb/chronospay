import React from 'react';
import { Shield, ShieldAlert, CheckCircle } from 'lucide-react';

export default function VerificationBadge({ verified, count }) {
  return (
    <div className={`verification-status-panel glass-panel ${verified ? 'verified-active' : 'verified-inactive'}`}>
      <div className="status-icon-glow">
        {verified ? (
          <div className="shield-icon-container success">
            <Shield className="shield-icon" size={40} />
            <CheckCircle className="check-sub-icon" size={18} />
          </div>
        ) : (
          <div className="shield-icon-container warning">
            <ShieldAlert className="shield-icon" size={40} />
          </div>
        )}
      </div>
      
      <div className="status-details">
        <h4 className="status-title-header">
          {verified ? 'IMMUNIZATION STATUS: VERIFIED' : 'NO RECORD DETECTED'}
        </h4>
        <p className="status-description-text">
          {verified 
            ? `Found ${count} tamper-proof vaccination record(s) registered on the Stellar blockchain.`
            : 'We could not locate any active vaccination records for the provided public address.'}
        </p>
      </div>
    </div>
  );
}
