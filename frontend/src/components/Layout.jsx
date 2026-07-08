import React from 'react';
import { Briefcase, PlusCircle, Wallet, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ activeTab, setActiveTab, children }) {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Jobs', icon: Briefcase },
    ...(user?.role === 'client' ? [{ id: 'postjob', label: 'Post Job', icon: PlusCircle }] : []),
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="mobile-shell-wrapper">
      <div className="mobile-viewport glass-panel">
        <div className="viewport-content">
          {children}
        </div>

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
