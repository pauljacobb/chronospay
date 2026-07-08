import express from 'express';
import jwt from 'jsonwebtoken';
import { generateChallenge, verifyChallenge } from '../stellar/sep10.js';
import { isIssuerAuthorized } from '../stellar/soroban.js';

const router = express.Router();

router.post('/sep10', (req, res) => {
  const { wallet } = req.body;
  if (!wallet || !wallet.startsWith('G') || wallet.length !== 56) {
    return res.status(400).json({ error: 'Invalid or missing public wallet address' });
  }

  const challenge = generateChallenge(wallet);
  res.json(challenge);
});

router.post('/verify', async (req, res) => {
  const { wallet, signedTxXdr } = req.body;
  if (!wallet || !signedTxXdr) {
    return res.status(400).json({ error: 'Missing wallet or signed transaction XDR' });
  }

  try {
    const isValid = verifyChallenge(signedTxXdr, wallet);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid challenge signature' });
    }

    // Check if this wallet is an authorized issuer
    const isIssuer = await isIssuerAuthorized(wallet);
    const role = isIssuer ? 'issuer' : 'patient';

    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_key_stellarvax';
    const token = jwt.sign(
      { address: wallet, role },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({ token, role, address: wallet });
  } catch (error) {
    res.status(401).json({ error: error.message || 'Signature verification failed' });
  }
});

export default router;
