import { query } from '../db.js';

export async function createTicket(req, res) {
  const { subject, description } = req.body;

  if (!subject || !description) {
    return res.status(400).json({ error: 'Subject and description are required' });
  }

  try {
    const result = await query(
      'INSERT INTO tickets (user_id, subject, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, subject, description, 'open']
    );
    res.status(201).json({ ticket: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to submit support ticket' });
  }
}

export async function getTickets(req, res) {
  try {
    const result = await query(
      'SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ tickets: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve support tickets' });
  }
}
