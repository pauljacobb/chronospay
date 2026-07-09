import { query } from '../db.js';
import { submitEscrowDeposit, releaseEscrowPayout, decryptSecretKey } from '../services/stellar.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_';

export async function create(req, res) {
  const { recipientAddress, amount, startTime, stopTime } = req.body;

  if (!recipientAddress || !amount || !startTime || !stopTime || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Valid recipient, amount, start time, and stop time are required' });
  }

  const startSec = Math.floor(new Date(startTime).getTime() / 1000);
  const stopSec = Math.floor(new Date(stopTime).getTime() / 1000);

  if (stopSec <= startSec) {
    return res.status(400).json({ error: 'Stop time must be strictly after start time' });
  }

  try {
    // Fetch sender wallet keys to lock budget
    const walletRes = await query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletRes.rows[0];

    let txHash = null;
    if (wallet) {
      const decryptedSecret = decryptSecretKey(wallet.encrypted_secret_key, wallet.iv, ENCRYPTION_KEY);
      txHash = await submitEscrowDeposit(decryptedSecret, amount);
    } else {
      txHash = crypto.randomBytes(32).toString('hex');
    }

    const escrowId = Math.floor(100000 + Math.random() * 900000);

    const streamResult = await query(
      'INSERT INTO streams (sender_id, recipient_address, amount, start_time, stop_time, status, escrow_id, tx_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.user.id, recipientAddress, amount, startTime, stopTime, 'active', escrowId, txHash]
    );

    res.status(201).json({
      success: true,
      stream: streamResult.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create payment stream' });
  }
}

export async function listSent(req, res) {
  try {
    const result = await query('SELECT * FROM streams WHERE sender_id = $1', [req.user.id]);
    res.json({ streams: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve sent streams' });
  }
}

export async function listReceived(req, res) {
  try {
    // Get current user wallet address
    const userRes = await query('SELECT wallet_address FROM users WHERE id = $1', [req.user.id]);
    const userAddr = userRes.rows[0]?.wallet_address;

    if (!userAddr) {
      return res.json({ streams: [] });
    }

    const result = await query('SELECT * FROM streams WHERE recipient_address = $1', [userAddr]);
    res.json({ streams: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve received streams' });
  }
}

export async function get(req, res) {
  const { id } = req.params;

  try {
    const result = await query('SELECT * FROM streams WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve stream details' });
  }
}

export async function withdraw(req, res) {
  const { id } = req.params;
  const { amountToWithdraw } = req.body;

  if (!amountToWithdraw || parseFloat(amountToWithdraw) <= 0) {
    return res.status(400).json({ error: 'Positive withdrawal amount required' });
  }

  try {
    const streamRes = await query('SELECT * FROM streams WHERE id = $1', [id]);
    const stream = streamRes.rows[0];

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (stream.status !== 'active') {
      return res.status(400).json({ error: 'Stream is not active' });
    }

    // Verify recipient is the user calling this
    const userRes = await query('SELECT wallet_address FROM users WHERE id = $1', [req.user.id]);
    const userAddr = userRes.rows[0]?.wallet_address;

    if (stream.recipient_address !== userAddr) {
      return res.status(403).json({ error: 'Only the recipient of this stream can withdraw funds' });
    }

    // Calculate vested balance
    const now = Math.floor(Date.now() / 1000);
    const startSec = Math.floor(new Date(stream.start_time).getTime() / 1000);
    const stopSec = Math.floor(new Date(stream.stop_time).getTime() / 1000);

    let vested = 0;
    if (now <= startSec) {
      vested = 0;
    } else if (now >= stopSec) {
      vested = parseFloat(stream.amount);
    } else {
      const elapsed = now - startSec;
      const duration = stopSec - startSec;
      vested = (parseFloat(stream.amount) * elapsed) / duration;
    }

    const available = vested - parseFloat(stream.withdrawn);
    if (parseFloat(amountToWithdraw) > available) {
      return res.status(400).json({ error: `Insufficient vested balance. Currently available: ${available.toFixed(4)} XLM` });
    }

    // Perform payout on-chain
    const txHash = await releaseEscrowPayout(userAddr, amountToWithdraw);

    // Update stream withdrawn quantity
    const nextWithdrawn = parseFloat(stream.withdrawn) + parseFloat(amountToWithdraw);
    const nextStatus = nextWithdrawn >= parseFloat(stream.amount) ? 'completed' : 'active';

    const updatedRes = await query(
      'UPDATE streams SET withdrawn = $1, status = $2 WHERE id = $3 RETURNING *',
      [nextWithdrawn, nextStatus, id]
    );

    // Log withdrawal
    await query(
      'INSERT INTO withdrawals (stream_id, amount, tx_hash) VALUES ($1, $2, $3)',
      [id, amountToWithdraw, txHash]
    );

    res.json({
      success: true,
      withdrawal: { amount: amountToWithdraw, txHash },
      stream: updatedRes.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Withdrawal failed' });
  }
}

export async function cancel(req, res) {
  const { id } = req.params;

  try {
    const streamRes = await query('SELECT * FROM streams WHERE id = $1', [id]);
    const stream = streamRes.rows[0];

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    if (stream.sender_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the sender can cancel this stream' });
    }

    if (stream.status !== 'active') {
      return res.status(400).json({ error: 'Stream is not active' });
    }

    // Calculate vesting
    const now = Math.floor(Date.now() / 1000);
    const startSec = Math.floor(new Date(stream.start_time).getTime() / 1000);
    const stopSec = Math.floor(new Date(stream.stop_time).getTime() / 1000);

    let vested = 0;
    if (now <= startSec) {
      vested = 0;
    } else if (now >= stopSec) {
      vested = parseFloat(stream.amount);
    } else {
      const elapsed = now - startSec;
      const duration = stopSec - startSec;
      vested = (parseFloat(stream.amount) * elapsed) / duration;
    }

    const availableVested = vested - parseFloat(stream.withdrawn);
    const refundUnvested = parseFloat(stream.amount) - vested;

    // Send payouts on-chain
    let payoutHash = crypto.randomBytes(32).toString('hex');

    // Vested to recipient
    if (availableVested > 0) {
      await releaseEscrowPayout(stream.recipient_address, availableVested);
    }

    // Unvested to sender
    if (refundUnvested > 0) {
      const senderRes = await query('SELECT wallet_address FROM users WHERE id = $1', [stream.sender_id]);
      const senderAddr = senderRes.rows[0]?.wallet_address;
      payoutHash = await releaseEscrowPayout(senderAddr, refundUnvested);
    }

    const updatedRes = await query(
      'UPDATE streams SET status = $1, withdrawn = $2 WHERE id = $3 RETURNING *',
      ['cancelled', vested, id]
    );

    res.json({
      success: true,
      message: 'Stream cancelled. Split refunds processed successfully.',
      txHash: payoutHash,
      stream: updatedRes.rows[0],
      refunds: { vested, unvested: refundUnvested }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Stream cancellation failed' });
  }
}
