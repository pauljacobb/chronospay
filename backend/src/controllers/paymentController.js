import { query } from '../db.js';
import { sendPayment, decryptSecretKey } from '../services/stellar.js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_';

export async function send(req, res) {
  const { recipientAddress, amount, asset } = req.body; // asset: XLM or USDC

  if (!recipientAddress || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Valid recipient address and amount required' });
  }

  const assetCode = asset || 'XLM';
  const assetIssuer = assetCode === 'USDC' ? (process.env.ISSUER_PUBLIC_KEY || 'GBADMIN12345678901234567890123456789012345678901234567890') : null;

  try {
    // 1. Fraud Protection: Velocity Check
    // Rejects if user has sent > 5 transactions in the last 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // In our db.js, select index check handles date parameter checks
    const velocityCheck = await query(
      'SELECT COUNT(*) as count FROM transactions WHERE sender_id = $1 AND created_at > $2',
      [req.user.id, tenMinutesAgo]
    );

    const recentTxCount = parseInt(velocityCheck.rows[0]?.count || 0);
    if (recentTxCount >= 5) {
      return res.status(429).json({ error: 'Transaction velocity exceeded. Max 5 transfers per 10 minutes.' });
    }

    // 2. Fetch sender wallet details
    const walletResult = await query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletResult.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (wallet.public_key === recipientAddress) {
      return res.status(400).json({ error: 'Cannot send payment to your own wallet address' });
    }

    // 3. Decrypt sender secret key
    const decryptedSecret = decryptSecretKey(wallet.encrypted_secret_key, wallet.iv, ENCRYPTION_KEY);

    // 4. Submit payment transaction
    const txHash = await sendPayment(decryptedSecret, recipientAddress, amount, assetCode, assetIssuer);

    // 5. Save transaction records
    const insertResult = await query(
      'INSERT INTO transactions (sender_id, recipient_address, amount, fee, asset, type, status, tx_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, recipientAddress, amount, 0.0001, assetCode, 'standard', 'completed', txHash]
    );

    res.status(201).json({
      success: true,
      txHash,
      transaction: insertResult.rows[0]
    });
  } catch (error) {
    if (error.message.includes('insufficient')) {
      return res.status(400).json({ error: 'Insufficient balance to cover payment and network fee.' });
    }
    res.status(500).json({ error: error.message || 'Payment broadcast failed' });
  }
}

export async function getHistory(req, res) {
  try {
    const historyResult = await query(
      'SELECT * FROM transactions WHERE sender_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ transactions: historyResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve history' });
  }
}
