import express from 'express';
import { verifyVaccinationRecords } from '../stellar/soroban.js';

const router = express.Router();

router.get('/:wallet', async (req, res) => {
  const { wallet } = req.params;
  if (!wallet || !wallet.startsWith('G') || wallet.length !== 56) {
    return res.status(400).json({ error: 'Invalid wallet address format' });
  }

  try {
    const records = await verifyVaccinationRecords(wallet);
    res.json({
      verified: records.length > 0,
      count: records.length,
      records: records,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Verification check failed' });
  }
});

export default router;
