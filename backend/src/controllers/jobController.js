import { query } from '../db.js';
import { submitEscrowDeposit, releaseEscrowPayout, decryptSecretKey } from '../services/stellar.js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_';

export async function create(req, res) {
  const { title, description, budget } = req.body;

  if (!title || !description || !budget || parseFloat(budget) <= 0) {
    return res.status(400).json({ error: 'Valid title, description, and budget required' });
  }

  try {
    // 1. Fetch client wallet to sign escrow deposit
    const walletRes = await query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletRes.rows[0];

    let txHash = null;
    if (wallet) {
      // Decrypt secret key
      const decryptedSecret = decryptSecretKey(wallet.encrypted_secret_key, wallet.iv, ENCRYPTION_KEY);
      // Lock budget on-chain
      txHash = await submitEscrowDeposit(decryptedSecret, budget);
    } else {
      // Mock hash if client is using Freighter browser wallet directly without a custodial wallet
      txHash = crypto.randomBytes(32).toString('hex');
    }

    // 2. Insert job
    const jobRes = await query(
      'INSERT INTO jobs (client_id, title, description, budget, status, tx_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, title, description, budget, 'open', txHash]
    );

    res.status(201).json({
      success: true,
      job: jobRes.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create job listing' });
  }
}

export async function list(req, res) {
  try {
    const result = await query('SELECT * FROM jobs');
    res.json({ jobs: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch jobs list' });
  }
}

export async function get(req, res) {
  const { id } = req.params;

  try {
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch job details' });
  }
}

export async function assign(req, res) {
  const { id } = req.params; // job_id
  const { proposal_id } = req.body;

  try {
    // 1. Fetch job
    const jobRes = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    const job = jobRes.rows[0];

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client who posted the job can assign work' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not open for assignment' });
    }

    // 2. Fetch proposal
    const propRes = await query('SELECT * FROM proposals WHERE id = $1', [proposal_id]);
    const proposal = propRes.rows[0];

    if (!proposal || proposal.job_id !== id) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // 3. Update proposal status
    await query("UPDATE proposals SET status = 'accepted' WHERE id = $1", [proposal_id]);
    await query("UPDATE proposals SET status = 'rejected' WHERE job_id = $1 AND id != $2", [id, proposal_id]);

    // 4. Update job status to assigned and record a mock/demo Soroban Escrow Session ID
    const escrowId = Math.floor(100000 + Math.random() * 900000);
    const updatedJobRes = await query(
      'UPDATE jobs SET status = $1, freelancer_id = $2, escrow_id = $3 WHERE id = $4 RETURNING *',
      ['assigned', proposal.freelancer_id, escrowId, id]
    );

    res.json({
      success: true,
      escrowId,
      job: updatedJobRes.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to assign job' });
  }
}

export async function release(req, res) {
  const { id } = req.params;

  try {
    const jobRes = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    const job = jobRes.rows[0];

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client who locked the escrow can release payouts' });
    }

    if (job.status !== 'assigned') {
      return res.status(400).json({ error: 'Escrow is not in assigned status' });
    }

    // Fetch freelancer wallet address
    const freelancerRes = await query('SELECT wallet_address FROM users WHERE id = $1', [job.freelancer_id]);
    const freelancerAddr = freelancerRes.rows[0]?.wallet_address;

    if (!freelancerAddr) {
      return res.status(400).json({ error: 'Freelancer wallet address not registered' });
    }

    // Release payout on-chain
    const payoutHash = await releaseEscrowPayout(freelancerAddr, job.budget);

    // Update job status to completed
    const updatedJobRes = await query(
      'UPDATE jobs SET status = $1, tx_hash = $2 WHERE id = $3 RETURNING *',
      ['completed', payoutHash, id]
    );

    res.json({
      success: true,
      message: 'Escrow payment approved and funds released instantly.',
      txHash: payoutHash,
      job: updatedJobRes.rows[0]
    });
  } catch (error) {
    console.error("RELEASE ERROR:", error);
    res.status(500).json({ error: error.message || 'Escrow payout approval failed' });
  }
}

export async function refund(req, res) {
  const { id } = req.params;

  try {
    const jobRes = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    const job = jobRes.rows[0];

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the client can request a refund' });
    }

    if (job.status !== 'open' && job.status !== 'assigned') {
      return res.status(400).json({ error: 'Job cannot be refunded in current status' });
    }

    // Fetch client wallet address
    const clientRes = await query('SELECT wallet_address FROM users WHERE id = $1', [job.client_id]);
    const clientAddr = clientRes.rows[0]?.wallet_address;

    // Refund client
    const refundHash = await releaseEscrowPayout(clientAddr, job.budget);

    const updatedJobRes = await query(
      'UPDATE jobs SET status = $1, tx_hash = $2 WHERE id = $3 RETURNING *',
      ['refunded', refundHash, id]
    );

    res.json({
      success: true,
      message: 'Job cancelled. Locked escrow budget refunded to client wallet.',
      txHash: refundHash,
      job: updatedJobRes.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Escrow refund failed' });
  }
}
