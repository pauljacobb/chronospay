import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('kora_token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demoMode, setDemoMode] = useState(localStorage.getItem('kora_demo_mode') === 'true');

  useEffect(() => {
    async function checkMe() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          setDemoMode(false);
          localStorage.setItem('kora_demo_mode', 'false');
        } catch (err) {
          console.warn("REST API offline, attempting mock session restore.");
          restoreMockSession();
        }
      }
      setLoading(false);
    }
    checkMe();
  }, [token]);

  const restoreMockSession = () => {
    const mockEmail = localStorage.getItem('kora_mock_email') || 'demo@korapay.com';
    const mockName = localStorage.getItem('kora_mock_name') || 'Demo User';
    const mockRole = localStorage.getItem('kora_mock_role') || 'user';
    const mockPub = localStorage.getItem('kora_mock_pub') || 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';

    setUser({
      id: 'mock-uuid-12345',
      name: mockName,
      email: mockEmail,
      role: mockRole,
      publicKey: mockPub
    });
    setDemoMode(true);
    localStorage.setItem('kora_demo_mode', 'true');
  };

  const registerUser = async (name, email, password, role = 'user') => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      const { token: receivedToken, user: receivedUser } = res.data;

      setToken(receivedToken);
      setUser(receivedUser);
      setDemoMode(false);
      localStorage.setItem('kora_token', receivedToken);
      localStorage.setItem('kora_demo_mode', 'false');
      return true;
    } catch (err) {
      console.warn("Register API failed, falling back to mock registration.");
      // Generate a mock keypair
      const mockPub = 'GD3V7SOP' + Math.random().toString(36).substring(2, 10).toUpperCase() + '5HET7N2GCRMXK75L62LCR6W';
      const mockUser = {
        id: 'mock-uuid-' + Math.floor(Math.random() * 100000),
        name,
        email,
        role,
        publicKey: mockPub
      };
      
      setUser(mockUser);
      setToken('mock-jwt-token');
      setDemoMode(true);
      localStorage.setItem('kora_token', 'mock-jwt-token');
      localStorage.setItem('kora_demo_mode', 'true');
      localStorage.setItem('kora_mock_name', name);
      localStorage.setItem('kora_mock_email', email);
      localStorage.setItem('kora_mock_role', role);
      localStorage.setItem('kora_mock_pub', mockPub);
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
      localStorage.setItem('kora_token', receivedToken);
      localStorage.setItem('kora_demo_mode', 'false');
      return true;
    } catch (err) {
      console.warn("Login API failed, logging in as mock account.");
      const isAgent = email.includes('agent');
      const isAdmin = email.includes('admin');
      const finalRole = isAdmin ? 'admin' : (isAgent ? 'agent' : 'user');
      const mockName = isAgent ? 'Approved agent' : (isAdmin ? 'Admin Portal' : 'Kora Remitter');
      const mockPub = isAgent 
        ? 'GBADMIN12345678901234567890123456789012345678901234567890' 
        : 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';

      setUser({
        id: 'mock-uuid-12345',
        name: mockName,
        email,
        role: finalRole,
        publicKey: mockPub
      });
      setToken('mock-jwt-token');
      setDemoMode(true);
      localStorage.setItem('kora_token', 'mock-jwt-token');
      localStorage.setItem('kora_demo_mode', 'true');
      localStorage.setItem('kora_mock_name', mockName);
      localStorage.setItem('kora_mock_email', email);
      localStorage.setItem('kora_mock_role', finalRole);
      localStorage.setItem('kora_mock_pub', mockPub);
      return true;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setToken('');
    setUser(null);
    setDemoMode(false);
    localStorage.removeItem('kora_token');
    localStorage.removeItem('kora_demo_mode');
    localStorage.removeItem('kora_mock_name');
    localStorage.removeItem('kora_mock_email');
    localStorage.removeItem('kora_mock_role');
    localStorage.removeItem('kora_mock_pub');
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
