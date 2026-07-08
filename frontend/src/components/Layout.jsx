import React from 'react';
import { Home, Send, QrCode, History, User } from 'lucide-react';

export default function Layout({ activeTab, setActiveTab, children }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'send', label: 'Send', icon: Send },
    { id: 'receive', label: 'Receive', icon: QrCode },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="mobile-shell-wrapper">
      <div className="mobile-viewport glass-panel">
        {/* Viewport Content */}
        <div className="viewport-content">
          {children}
        </div>

        {/* Bottom Nav Bar */}
        <nav className="bottom-nav-bar">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-tab-button ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <IconComponent size={20} className="nav-tab-icon" />
                <span className="nav-tab-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
