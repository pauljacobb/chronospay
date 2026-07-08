import { useState, useEffect } from 'react';
import { isConnected, getAddress, signTransaction } from '@stellar/freighter-api';

const API_BASE = '/v1';

export function useFreighter() {
  const [address, setAddress] = useState(localStorage.getItem('vax_address') || '');
  const [role, setRole] = useState(localStorage.getItem('vax_role') || '');
  const [token, setToken] = useState(localStorage.getItem('vax_token') || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [hasFreighter, setHasFreighter] = useState(false);
  const [demoMode, setDemoMode] = useState(localStorage.getItem('vax_demo_mode') === 'true');

  useEffect(() => {
    async function checkFreighter() {
      try {
        const connected = await isConnected();
        setHasFreighter(!!connected);
      } catch (e) {
        setHasFreighter(false);
      }
    }
    checkFreighter();
  }, []);

  const loginWithFreighter = async () => {
    setIsConnecting(true);
    setError('');
    try {
      const connected = await isConnected();
      if (!connected) {
        throw new Error('Freighter wallet not detected. Please install the Freighter extension.');
      }

      const userAddress = await getAddress();
      if (!userAddress) {
        throw new Error('Failed to retrieve address from Freighter.');
      }

      // 1. Fetch challenge
      const chalRes = await fetch(`${API_BASE}/auth/sep10`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: userAddress }),
      });

      if (!chalRes.ok) {
        const errJson = await chalRes.json();
        throw new Error(errJson.error || 'Failed to fetch challenge');
      }

      const { challengeTx, networkPassphrase } = await chalRes.json();

      // 2. Sign challenge using Freighter
      const signedXdr = await signTransaction(challengeTx, {
        network: networkPassphrase === 'Test SDF Network ; September 2015' ? 'TESTNET' : 'PUBLIC',
        accountToSignAddress: userAddress,
      });

      if (!signedXdr) {
        throw new Error('Transaction signing was rejected by user.');
      }

      // 3. Verify on backend
      const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: userAddress, signedTxXdr: signedXdr }),
      });

      if (!verifyRes.ok) {
        const errJson = await verifyRes.json();
        throw new Error(errJson.error || 'Failed to verify challenge signature');
      }

      const { token, role } = await verifyRes.json();

      // 4. Save state
      setAddress(userAddress);
      setRole(role);
      setToken(token);
      setDemoMode(false);
      localStorage.setItem('vax_address', userAddress);
      localStorage.setItem('vax_role', role);
      localStorage.setItem('vax_token', token);
      localStorage.setItem('vax_demo_mode', 'false');
    } catch (err) {
      setError(err.message || 'Authentication failed');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const loginWithMock = async (mockAddress, mockRole) => {
    setIsConnecting(true);
    setError('');
    try {
      // 1. Fetch challenge
      const chalRes = await fetch(`${API_BASE}/auth/sep10`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: mockAddress }),
      });

      if (!chalRes.ok) {
        const errJson = await chalRes.json();
        throw new Error(errJson.error || 'Failed to fetch challenge');
      }

      const { challengeTx } = await chalRes.json();

      // 2. Submit signed challenge directly (backend verifies mock prefix)
      const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: mockAddress, signedTxXdr: challengeTx }),
      });

      if (!verifyRes.ok) {
        const errJson = await verifyRes.json();
        throw new Error(errJson.error || 'Verification failed');
      }

      // Override role with selected mockRole for testing the separate dashboards
      const data = await verifyRes.json();
      const finalRole = mockRole || data.role;

      setAddress(mockAddress);
      setRole(finalRole);
      setToken(data.token);
      setDemoMode(true);
      localStorage.setItem('vax_address', mockAddress);
      localStorage.setItem('vax_role', finalRole);
      localStorage.setItem('vax_token', data.token);
      localStorage.setItem('vax_demo_mode', 'true');
    } catch (err) {
      setError(err.message || 'Mock Authentication failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const logout = () => {
    setAddress('');
    setRole('');
    setToken('');
    setDemoMode(false);
    localStorage.removeItem('vax_address');
    localStorage.removeItem('vax_role');
    localStorage.removeItem('vax_token');
    localStorage.removeItem('vax_demo_mode');
  };

  return {
    address,
    role,
    token,
    isConnecting,
    error,
    hasFreighter,
    demoMode,
    connect: loginWithFreighter,
    connectMock: loginWithMock,
    logout,
  };
}
