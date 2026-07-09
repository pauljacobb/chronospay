import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateStream from './pages/CreateStream';
import StreamDetails from './pages/StreamDetails';
import Wallet from './pages/Wallet';
import Layout from './components/Layout';

function AppContent() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState('welcome'); // welcome, login, register, dashboard
  const [tab, setTab] = useState('streams'); // streams, create, wallet
  const [selectedStreamId, setSelectedStreamId] = useState(null);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading ChronosPay...</div>
      </div>
    );
  }

  // Handle routing for authenticated vs unauthenticated
  if (!user) {
    switch (screen) {
      case 'login':
        return <Login onNavigate={setScreen} />;
      case 'register':
        return <Register onNavigate={setScreen} />;
      case 'welcome':
      default:
        return <Welcome onNavigate={setScreen} />;
    }
  }

  // Authenticated Layout Views
  const renderTabContent = () => {
    if (selectedStreamId) {
      return (
        <StreamDetails
          streamId={selectedStreamId}
          onBack={() => setSelectedStreamId(null)}
        />
      );
    }

    switch (tab) {
      case 'create':
        return <CreateStream onNavigate={(scr) => { setTab('streams'); setScreen(scr); }} />;
      case 'wallet':
        return <Wallet />;
      case 'streams':
      default:
        return (
          <Dashboard
            onSelectStream={setSelectedStreamId}
            onCreateTab={() => setTab('create')}
          />
        );
    }
  };

  return (
    <Layout
      currentTab={selectedStreamId ? null : tab}
      onChangeTab={(newTab) => {
        setSelectedStreamId(null);
        setTab(newTab);
      }}
    >
      {renderTabContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="mobile-shell-wrapper">
        <div className="mobile-viewport">
          <AppContent />
        </div>
      </div>
    </AuthProvider>
  );
}
