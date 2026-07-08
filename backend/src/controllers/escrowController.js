import { query } from '../db.js';
import { decryptSecretKey, sendPayment } from '../services/stellar.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_';

export async function create(req, res) {
  const { agent_wallet, amount, asset } = req.body;

  if (!agent_wallet || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Valid agent wallet and amount required' });
  }

  const assetCode = asset || 'USDC';

  try {
    // 1. Verify agent is approved in the database
    const agentCheck = await query(
      "SELECT * FROM agents WHERE wallet_address = $1 AND status = 'approved'",
      [agent_wallet]
    );

    if (agentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Agent is not registered in the AfriPay network' });
    }

    // 2. Fetch sender wallet details
    const walletResult = await query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletResult.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Sender wallet not found' });
    }

    // 3. Generate a mock/demo on-chain Escrow ID (numerical sequence)
    const escrowId = Math.floor(100000 + Math.random() * 900000);

    // 4. Decrypt sender secret key
    const decryptedSecret = decryptSecretKey(wallet.encrypted_secret_key, wallet.iv, ENCRYPTION_KEY);

    // 5. In local mode, we simulate locking the tokens on Stellar
    // We send a transfer from sender to our platform vault/fee wallet representing escrow lock
    const platformWallet = process.env.ADMIN_PUBLIC_KEY || 'GBADMIN12345678901234567890123456789012345678901234567890';
    const txHash = await sendPayment(decryptedSecret, platformWallet, amount, assetCode);

    // 6. Save pending transaction in database
    const result = await query(
      'INSERT INTO transactions (sender_id, recipient_address, amount, fee, asset, type, escrow_id, status, tx_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [req.user.id, agent_wallet, amount, 0.001, assetCode, 'escrow', escrowId, 'pending', txHash]
    );

    res.status(201).json({
      success: true,
      escrowId,
      transaction: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create escrow' });
  }
}

export async function confirm(req, res) {
  const { id } = req.params; // escrow_id

  try {
    // 1. Fetch pending escrow transaction
    const txResult = await query(
      "SELECT * FROM transactions WHERE escrow_id = $1 AND status = 'pending'",
      [id]
    );
    const tx = txResult.rows[0];

    if (!tx) {
      return res.status(404).json({ error: 'Pending escrow transaction not found' });
    }

    // 2. Fetch administrator keys to handle platform release
    const adminSecret = process.env.SEP10_SERVER_KEY || 'SDSERVERSECRETKEYEXAMPLE123456789012345678901234567890';
    const adminPub = process.env.ADMIN_PUBLIC_KEY || 'GBADMIN12345678901234567890123456789012345678901234567890';
    
    // Calculate fee (250 bps = 2.5%)
    const feeBps = 250;
    const feeAmount = (parseFloat(tx.amount) * feeBps) / 10000;
    const netAmount = parseFloat(tx.amount) - feeAmount;

    // 3. Confirm payout - release funds from platform escrow to agent minus fee
    // Note: Admin triggers the payout confirmation transfer
    const releaseHash = await sendPayment(adminSecret, tx.recipient_address, netAmount, tx.asset);

    // 4. Update transaction state to completed
    await query(
      "UPDATE transactions SET status = 'completed', tx_hash = $1 WHERE escrow_id = $2",
      [releaseHash, id]
    );

    res.json({
      success: true,
      message: 'Payout confirmed. Escrow funds released to agent.',
      feeCollected: feeAmount,
      netAmount,
      txHash: releaseHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Escrow payout confirmation failed' });
  }
}

export async function cancel(req, res) {
  const { id } = req.params;

  try {
    // 1. Fetch pending escrow transaction
    const txResult = await query(
      "SELECT * FROM transactions WHERE escrow_id = $1 AND status = 'pending'",
      [id]
    );
    const tx = txResult.rows[0];

    if (!tx) {
      return res.status(404).json({ error: 'Pending escrow transaction not found' });
    }

    // 2. Fetch sender wallet details (only sender can cancel)
    if (tx.sender_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized. Only the sender can cancel this escrow.' });
    }

    // 3. Refund sender (Admin signs refund since tokens are held in platform vault)
    const adminSecret = process.env.SEP10_SERVER_KEY || 'SDSERVERSECRETKEYEXAMPLE123456789012345678901234567890';
    const walletResult = await query('SELECT public_key FROM wallets WHERE user_id = $1', [tx.sender_id]);
    const senderPubKey = walletResult.rows[0]?.public_key;

    const refundHash = await sendPayment(adminSecret, senderPubKey, tx.amount, tx.asset);

    // 4. Update status to cancelled
    await query(
      "UPDATE transactions SET status = 'cancelled', tx_hash = $1 WHERE escrow_id = $2",
      [refundHash, id]
    );

    res.json({
      success: true,
      message: 'Escrow cancelled. Full refund issued to sender.',
      refundHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Escrow cancellation failed' });
  }
}
