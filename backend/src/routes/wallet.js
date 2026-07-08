import express from 'express';
import { getBalance, getQrCode, getContacts, addContact, deleteContact, closeAccount } from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/balance', authenticateToken, getBalance);
router.get('/qr', authenticateToken, getQrCode);
router.get('/contacts', authenticateToken, getContacts);
router.post('/contacts', authenticateToken, addContact);
router.delete('/contacts/:id', authenticateToken, deleteContact);
router.post('/merge', authenticateToken, closeAccount);

export default router;
