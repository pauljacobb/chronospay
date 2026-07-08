import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { getFreighterPublicKey } from '../utils/freighter';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gigflow_token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('gigflow_demo_mode') === 'true');

  useEffect(() => {
    async function checkMe() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          setDemoMode(false);
          localStorage.setItem('gigflow_demo_mode', 'false');
        } catch (err) {
          console.warn("REST API offline, restoring mock freelance profile.");
          restoreMockSession();
        }
      }
      setLoading(false);
    }
    checkMe();
  }, [token]);

  const restoreMockSession = () => {
    const mockEmail = localStorage.getItem('gigflow_mock_email') || 'client@gigflow.com';
    const mockName = localStorage.getItem('gigflow_mock_name') || 'Acme Client Corp';
    const mockRole = localStorage.getItem('gigflow_mock_role') || 'client';
    const mockPub = 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';

    setUser({
      id: 'mock-uuid-12345',
      name: mockName,
      email: mockEmail,
      role: mockRole,
      wallet_address: mockPub
    });
    setDemoMode(true);
    localStorage.setItem('gigflow_demo_mode', 'true');
  };

  const registerUser = async (name, email, password, role = 'client') => {
    setLoading(true);
    setError('');
    try {
      // Connect Freighter or get mock key
      const walletAddress = await getFreighterPublicKey();
      
      const res = await api.post('/auth/register', { name, email, password, role, walletAddress });
      const { token: receivedToken, user: receivedUser } = res.data;

      setToken(receivedToken);
      setUser(receivedUser);
      setDemoMode(false);
      localStorage.setItem('gigflow_token', receivedToken);
      localStorage.setItem('gigflow_demo_mode', 'false');
      return true;
    } catch (err) {
      console.warn("Register API failed, falling back to mock registration.");
      const mockPub = 'GD3V7SOP' + Math.random().toString(36).substring(2, 10).toUpperCase() + '5HET7N2GCRMXK75L62LCR6W';
      const mockUser = {
        id: 'mock-uuid-' + Math.floor(Math.random() * 100000),
        name,
        email,
        role,
        wallet_address: mockPub
      };

      setUser(mockUser);
      setToken('mock-jwt-token');
      setDemoMode(true);
      localStorage.setItem('gigflow_token', 'mock-jwt-token');
      localStorage.setItem('gigflow_demo_mode', 'true');
      localStorage.setItem('gigflow_mock_name', name);
      localStorage.setItem('gigflow_mock_email', email);
      localStorage.setItem('gigflow_mock_role', role);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      setToken(receivedToken);
      setUser(receivedUser);
      setDemoMode(false);
      localStorage.setItem('gigflow_token', receivedToken);
      localStorage.setItem('gigflow_demo_mode', 'false');
      return true;
    } catch (err) {
      console.warn("Login API failed, logging in as mock profile.");
      const isFreelancer = email.includes('free') || email.includes('dev');
      const finalRole = isFreelancer ? 'freelancer' : 'client';
      const mockName = isFreelancer ? 'Alex Freelance Rust' : 'Acme Client Corp';
      const mockPub = 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';

      setUser({
        id: 'mock-uuid-12345',
        name: mockName,
        email,
        role: finalRole,
        wallet_address: mockPub
      });
      setToken('mock-jwt-token');
      setDemoMode(true);
      localStorage.setItem('gigflow_token', 'mock-jwt-token');
      localStorage.setItem('gigflow_demo_mode', 'true');
      localStorage.setItem('gigflow_mock_name', mockName);
      localStorage.setItem('gigflow_mock_email', email);
      localStorage.setItem('gigflow_mock_role', finalRole);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setToken('');
    setUser(null);
    setDemoMode(false);
    localStorage.removeItem('gigflow_token');
    localStorage.removeItem('gigflow_demo_mode');
    localStorage.removeItem('gigflow_mock_name');
    localStorage.removeItem('gigflow_mock_email');
    localStorage.removeItem('gigflow_mock_role');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, demoMode, register: registerUser, login: loginUser, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
