import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState('10000.0000000');

  useEffect(() => {
    const token = localStorage.getItem('chronospay_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('chronospay_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('chronospay_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, role, walletAddress) => {
    const res = await api.post('/auth/register', { name, email, password, role, walletAddress });
    localStorage.setItem('chronospay_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('chronospay_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, balance, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
