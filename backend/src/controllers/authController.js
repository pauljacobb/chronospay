import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { generateKeypair, encryptSecretKey, fundTestnetAccount } from '../services/stellar.js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_gigflow';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function register(req, res) {
  const { name, email, password, role, walletAddress } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // If walletAddress is not provided, we automatically generate a custodial keypair for them
    let resolvedWalletAddress = walletAddress;
    let newKp = null;

    if (!resolvedWalletAddress) {
      newKp = generateKeypair();
      resolvedWalletAddress = newKp.publicKey;
    }

    const userResult = await query(
      'INSERT INTO users (name, email, password_hash, role, wallet_address) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, wallet_address, created_at',
      [name, email, passwordHash, role || 'client', resolvedWalletAddress]
    );
    const newUser = userResult.rows[0];

    // Save custodial wallet record if generated
    if (newKp) {
      const { encryptedKey, iv } = encryptSecretKey(newKp.secretKey, ENCRYPTION_KEY);
      await query(
        'INSERT INTO wallets (user_id, public_key, encrypted_secret_key, iv) VALUES ($1, $2, $3, $4)',
        [newUser.id, newKp.publicKey, encryptedKey, iv]
      );
      
      // Async seed
      fundTestnetAccount(newKp.publicKey).catch(err => console.error("Wallet funding failed:", err.message));
    }

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        wallet_address: user.wallet_address
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
}

export async function me(req, res) {
  try {
    const userResult = await query('SELECT id, name, email, role, wallet_address, created_at FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve profile' });
  }
}
