import { query } from '../db.js';
import { getBalances, decryptSecretKey, mergeAccount } from '../services/stellar.js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_';

export async function getBalance(req, res) {
  try {
    const walletResult = await query('SELECT public_key FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletResult.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found for this account' });
    }

    const balances = await getBalances(wallet.public_key);
    res.json({ publicKey: wallet.public_key, balances });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve balances' });
  }
}

export async function getQrCode(req, res) {
  try {
    const walletResult = await query('SELECT public_key FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletResult.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Standard Stellar URI QR code format
    const qrPayload = `stellar:${wallet.public_key}`;
    res.json({ publicKey: wallet.public_key, qrPayload });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve QR payload' });
  }
}

export async function getContacts(req, res) {
  try {
    const contactsResult = await query('SELECT * FROM contacts WHERE user_id = $1', [req.user.id]);
    res.json({ contacts: contactsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve contacts' });
  }
}

export async function addContact(req, res) {
  const { name, walletAddress } = req.body;

  if (!name || !walletAddress || walletAddress.length !== 56 || !walletAddress.startsWith('G')) {
    return res.status(400).json({ error: 'Valid name and Stellar wallet address required' });
  }

  try {
    const result = await query(
      'INSERT INTO contacts (user_id, name, wallet_address) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, walletAddress]
    );
    res.status(201).json({ contact: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to add contact' });
  }
}

export async function deleteContact(req, res) {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Contact not found or unauthorized' });
    }
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete contact' });
  }
}

export async function closeAccount(req, res) {
  const { destinationAddress } = req.body;

  if (!destinationAddress || destinationAddress.length !== 56 || !destinationAddress.startsWith('G')) {
    return res.status(400).json({ error: 'Valid destination Stellar address required for account merge' });
  }

  try {
    // Get sender wallet secrets
    const walletResult = await query('SELECT * FROM wallets WHERE user_id = $1', [req.user.id]);
    const wallet = walletResult.rows[0];

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    // Decrypt source secret key
    const decryptedSecret = decryptSecretKey(wallet.encrypted_secret_key, wallet.iv, ENCRYPTION_KEY);

    // Call mergeAccount on Stellar
    const txHash = await mergeAccount(decryptedSecret, destinationAddress);

    // Save transaction in database
    await query(
      'INSERT INTO transactions (sender_id, recipient_address, amount, fee, asset, type, status, tx_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [req.user.id, destinationAddress, 0, 0, 'XLM', 'merge', 'completed', txHash]
    );

    res.json({ success: true, txHash, message: 'Account closed and merged successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Account merge failed' });
  }
}
