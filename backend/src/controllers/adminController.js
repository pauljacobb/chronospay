import { query } from '../db.js';
import { clawbackAsset } from '../services/stellar.js';

export async function clawback(req, res) {
  const { targetAddress, amount, assetCode } = req.body;
  const adminSecret = process.env.SEP10_SERVER_KEY;
  const issuerPub = process.env.ADMIN_PUBLIC_KEY || 'GBADMIN12345678901234567890123456789012345678901234567890';

  if (!targetAddress || !amount || !assetCode) {
    return res.status(400).json({ error: 'Target address, amount, and asset code are required' });
  }

  try {
    if (!adminSecret) {
      throw new Error('Compliance keys not configured');
    }

    const txHash = await clawbackAsset(adminSecret, targetAddress, amount, assetCode, issuerPub);
    
    // Log audit message
    console.log(`[AUDIT-CLAWBACK] target=${targetAddress} amount=${amount} asset=${assetCode} hash=${txHash}`);

    res.json({
      success: true,
      txHash,
      message: `Asset clawback of ${amount} ${assetCode} from ${targetAddress} completed successfully.`
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Clawback operation failed' });
  }
}

export async function health(req, res) {
  try {
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const txCount = await query('SELECT COUNT(*) as count FROM transactions');
    
    res.json({
      status: 'healthy',
      diagnostics: {
        registeredUsers: parseInt(userCount.rows[0]?.count || 0),
        processedTransactions: parseInt(txCount.rows[0]?.count || 0),
        stellarNetwork: process.env.STELLAR_NETWORK || 'testnet',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Health diagnostics failed' });
  }
}
