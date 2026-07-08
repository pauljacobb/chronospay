import express from 'express';
import { send, getHistory } from '../controllers/paymentController.js';
import { create, confirm, cancel } from '../controllers/escrowController.js';
import { createTicket, getTickets } from '../controllers/supportController.js';
import { clawback, health } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = express.Router();

// Core Remittance
router.post('/payments/send', authenticateToken, send);
router.get('/payments/history', authenticateToken, getHistory);

// Agent Escrow
router.post('/escrow/create', authenticateToken, create);
router.post('/escrow/:id/confirm', authenticateToken, confirm);
router.post('/escrow/:id/cancel', authenticateToken, cancel);

// Support & Dispute Tickets
router.post('/support/tickets', authenticateToken, createTicket);
router.get('/support/tickets', authenticateToken, getTickets);

// Compliance & Administration
router.post('/admin/clawback', authenticateToken, requireAdmin, clawback);
router.get('/admin/health', authenticateToken, requireAdmin, health);

export default router;
