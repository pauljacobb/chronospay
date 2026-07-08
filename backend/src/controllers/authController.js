import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { generateKeypair, encryptSecretKey, fundTestnetAccount } from '../services/stellar.js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your_32_character_encryption_key_';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_korapay';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function register(req, res) {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // Check if user already exists
    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const userResult = await query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role || 'user']
    );
    const newUser = userResult.rows[0];

    // Generate Stellar Keypair
    const { publicKey, secretKey } = generateKeypair();

    // Encrypt Private Key
    const { encryptedKey, iv } = encryptSecretKey(secretKey, ENCRYPTION_KEY);

    // Save Wallet
    await query(
      'INSERT INTO wallets (user_id, public_key, encrypted_secret_key, iv) VALUES ($1, $2, $3, $4)',
      [newUser.id, publicKey, encryptedKey, iv]
    );

    // Fund account on Testnet asynchronously (Friendbot)
    // Runs in background to keep response fast
    fundTestnetAccount(publicKey).catch(err => console.error("Stellar funding failed:", err.message));

    // Sign JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        publicKey
      }
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

    // Get public key
    const walletResult = await query('SELECT public_key FROM wallets WHERE user_id = $1', [user.id]);
    const wallet = walletResult.rows[0];

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
        publicKey: wallet ? wallet.public_key : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
}

export async function me(req, res) {
  try {
    const userResult = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const walletResult = await query('SELECT public_key FROM wallets WHERE user_id = $1', [user.id]);
    const wallet = walletResult.rows[0];

    res.json({
      ...user,
      publicKey: wallet ? wallet.public_key : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to retrieve profile' });
  }
}
