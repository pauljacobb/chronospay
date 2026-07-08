import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireIssuer } from '../middleware/issuer.js';
import { mintVaccinationRecord, verifyVaccinationRecords } from '../stellar/soroban.js';

const router = express.Router();

router.post('/issue', authenticateToken, requireIssuer, async (req, res) => {
  const { patient, vaccine, date } = req.body;
  const issuer = req.user.address;

  if (!patient || !patient.startsWith('G') || patient.length !== 56) {
    return res.status(400).json({ error: 'Invalid patient wallet address' });
  }
  if (!vaccine || typeof vaccine !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing vaccine name' });
  }
  if (!date || isNaN(date)) {
    return res.status(400).json({ error: 'Invalid or missing date' });
  }

  try {
    const tokenId = await mintVaccinationRecord(patient, vaccine, parseInt(date), issuer);
    res.status(201).json({ success: true, tokenId });
  } catch (error) {
    if (error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Duplicate vaccination record: This vaccine was already registered for this patient on this date.' });
    }
    res.status(500).json({ error: error.message || 'Failed to mint vaccination record' });
  }
});

router.get('/:wallet', authenticateToken, async (req, res) => {
  const { wallet } = req.params;

  if (req.user.role === 'patient' && req.user.address !== wallet) {
    return res.status(403).json({ error: "Access denied: Patients can only view their own records" });
  }

  try {
    const records = await verifyVaccinationRecords(wallet);
    res.json({ records });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch vaccination records' });
  }
});

export default router;
