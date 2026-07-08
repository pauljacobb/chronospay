import { useState } from 'react';

const API_BASE = '/v1';

export function useVaccination(token) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const issueVaccination = async (patient, vaccine, date) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/vaccination/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ patient, vaccine, date: parseInt(date) })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to issue vaccination record');
      }

      const data = await res.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (wallet) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/vaccination/${wallet}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to fetch vaccination records');
      }

      const data = await res.json();
      return data.records || [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const verifyWallet = async (wallet) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/verify/${wallet}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to verify wallet');
      }

      const data = await res.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    issueVaccination,
    fetchRecords,
    verifyWallet
  };
}
