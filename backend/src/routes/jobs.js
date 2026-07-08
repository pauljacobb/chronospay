import express from 'express';
import { create, list, get, assign, release, refund } from '../controllers/jobController.js';
import { create as createProposal, listForJob } from '../controllers/proposalController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Job Listings CRUD & Escrow controls
router.post('/', authenticateToken, create);
router.get('/', list);
router.get('/:id', get);
router.post('/:id/assign', authenticateToken, assign);
router.post('/:id/release', authenticateToken, release);
router.post('/:id/refund', authenticateToken, refund);

// Job Proposals Bidding
router.post('/:job_id/proposals', authenticateToken, createProposal);
router.get('/:job_id/proposals', authenticateToken, listForJob);

export default router;
