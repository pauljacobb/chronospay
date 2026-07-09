import express from 'express';
import { create, listSent, listReceived, get, withdraw, cancel } from '../controllers/streamController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', create);
router.get('/sent', listSent);
router.get('/received', listReceived);
router.get('/:id', get);
router.post('/:id/withdraw', withdraw);
router.post('/:id/cancel', cancel);

export default router;
