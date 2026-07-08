import React from 'react';

export default function NFTCard({ record }) {
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="nft-card glass-panel glass-panel-glow">
      <div className="nft-header">
        <span className="badge badge-cyan">SBT Record #{record.token_id}</span>
        <span className="nft-verified-tag">On-Chain Secured</span>
      </div>
      
      <div className="nft-body">
        <div className="vax-avatar-container">
          <svg viewBox="0 0 100 100" className="vax-svg-badge">
            <defs>
              <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#bd00ff" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" stroke="url(#badgeGrad)" strokeWidth="1.5" fill="none" strokeDasharray="5 3" />
            <circle cx="50" cy="50" r="35" fill="rgba(0, 229, 255, 0.05)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            
            {/* Shield and Checkmark */}
            <path d="M35,38 L50,30 L65,38 L65,55 C65,65 58,72 50,75 C42,72 35,65 35,55 Z" 
                  fill="url(#badgeGrad)" fillOpacity="0.15" stroke="url(#badgeGrad)" strokeWidth="2" />
            <path d="M43,50 L48,55 L58,45" fill="none" stroke="#00ff87" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="vax-name-title">{record.vaccine_name}</h3>
        <span className="vax-date-subtitle">Administered on {formatDate(record.date)}</span>
      </div>
      
      <div className="nft-footer">
        <div className="vax-meta-item">
          <span className="meta-label">ISSUER</span>
          <span className="meta-value" title={record.issuer}>{formatAddress(record.issuer)}</span>
        </div>
        <div className="vax-meta-item">
          <span className="meta-label">MINT TIME</span>
          <span className="meta-value">{formatDate(record.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
