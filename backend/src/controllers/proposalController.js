import { query } from '../db.js';

export async function create(req, res) {
  const { job_id } = req.params;
  const { bid_amount, cover_letter } = req.body;

  if (!bid_amount || !cover_letter || parseFloat(bid_amount) <= 0) {
    return res.status(400).json({ error: 'Valid bid amount and cover letter are required' });
  }

  try {
    // 1. Verify user is freelancer
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ error: 'Only freelancers can apply to job listings' });
    }

    // 2. Check if job exists
    const jobCheck = await query('SELECT * FROM jobs WHERE id = $1', [job_id]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job listing not found' });
    }

    if (jobCheck.rows[0].status !== 'open') {
      return res.status(400).json({ error: 'Job is no longer open for applications' });
    }

    // 3. Insert proposal
    const result = await query(
      'INSERT INTO proposals (job_id, freelancer_id, bid_amount, cover_letter) VALUES ($1, $2, $3, $4) RETURNING *',
      [job_id, req.user.id, bid_amount, cover_letter]
    );

    res.status(201).json({
      success: true,
      proposal: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to submit proposal' });
  }
}

export async function listForJob(req, res) {
  const { job_id } = req.params;

  try {
    // Check if job exists
    const jobCheck = await query('SELECT * FROM jobs WHERE id = $1', [job_id]);
    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Return proposals
    const result = await query('SELECT * FROM proposals WHERE job_id = $1', [job_id]);
    res.json({ proposals: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve proposals' });
  }
}
