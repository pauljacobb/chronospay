import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SendMoney from './pages/SendMoney';
import ReceiveMoney from './pages/ReceiveMoney';
import TransactionHistory from './pages/TransactionHistory';
import Profile from './pages/Profile';

function AppContent() {
  const { user, token, loading } = useAuth();
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Onboarding screens state (welcome, login, register)
  const [onboardScreen, setOnboardScreen] = useState('welcome');

  if (loading) {
    return (
      <div className="mobile-shell-wrapper">
        <div className="mobile-viewport glass-panel centered-loader-state" style={{ justifyContent: 'center', height: '100%' }}>
          <span className="loader" style={{ width: '32px', height: '32px' }}></span>
          <p style={{ marginTop: '16px' }}>Recovering secure Stellar session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: show onboarding views
  if (!token) {
    return (
      <div className="mobile-shell-wrapper">
        <div className="mobile-viewport glass-panel onboarding-scroller">
          {onboardScreen === 'welcome' && <Welcome onNavigate={setOnboardScreen} />}
          {onboardScreen === 'login' && <Login onNavigate={setOnboardScreen} />}
          {onboardScreen === 'register' && <Register onNavigate={setOnboardScreen} />}
        </div>
      </div>
    );
  }

  // Authenticated: show layout with bottom tabs
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'send' && <SendMoney />}
      {activeTab === 'receive' && <ReceiveMoney />}
      {activeTab === 'history' && <TransactionHistory />}
      {activeTab === 'profile' && <Profile />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
