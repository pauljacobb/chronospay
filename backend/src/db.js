import pg from 'pg';
import winston from 'winston';
import crypto from 'crypto';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()]
});

const isTest = process.env.NODE_ENV === 'test';
let pool;

if (process.env.DATABASE_URL && !isTest) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  });
  logger.info("PostgreSQL Pool initialized.");
} else {
  logger.warn("Using KoraPay in-memory mock database fallback.");
}

// In-memory fallback database tables
const mockDb = {
  users: [],
  wallets: [],
  agents: [],
  transactions: [],
  contacts: [],
  tickets: []
};

/**
 * Executes a PostgreSQL query or processes a simulated in-memory SQL request.
 * @param {string} text 
 * @param {Array} params 
 * @returns {Promise<{rows: Array, rowCount?: number}>}
 */
export const query = async (text, params = []) => {
  if (pool) {
    return pool.query(text, params);
  }

  const sql = text.trim().replace(/\s+/g, ' ');

  if (sql.startsWith('INSERT INTO users')) {
    const id = crypto.randomUUID();
    const newUser = {
      id,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: params[3] || 'user',
      created_at: new Date()
    };
    mockDb.users.push(newUser);
    return { rows: [newUser] };
  }

  if (sql.startsWith('SELECT * FROM users WHERE email =')) {
    const email = params[0];
    const user = mockDb.users.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }

  if (sql.startsWith('SELECT * FROM users WHERE id =')) {
    const id = params[0];
    const user = mockDb.users.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }

  if (sql.startsWith('INSERT INTO wallets')) {
    const id = crypto.randomUUID();
    const newWallet = {
      id,
      user_id: params[0],
      public_key: params[1],
      encrypted_secret_key: params[2],
      iv: params[3],
      created_at: new Date()
    };
    mockDb.wallets.push(newWallet);
    return { rows: [newWallet] };
  }

  if (sql.startsWith('SELECT * FROM wallets WHERE user_id =')) {
    const user_id = params[0];
    const wallet = mockDb.wallets.find(w => w.user_id === user_id);
    return { rows: wallet ? [wallet] : [] };
  }

  if (sql.startsWith('INSERT INTO contacts')) {
    const id = crypto.randomUUID();
    const newContact = {
      id,
      user_id: params[0],
      name: params[1],
      wallet_address: params[2],
      created_at: new Date()
    };
    mockDb.contacts.push(newContact);
    return { rows: [newContact] };
  }

  if (sql.startsWith('SELECT * FROM contacts WHERE user_id =')) {
    const user_id = params[0];
    const list = mockDb.contacts.filter(c => c.user_id === user_id);
    return { rows: list };
  }

  if (sql.startsWith('DELETE FROM contacts WHERE id =')) {
    const id = params[0];
    const index = mockDb.contacts.findIndex(c => c.id === id);
    if (index !== -1) mockDb.contacts.splice(index, 1);
    return { rowCount: 1 };
  }

  if (sql.startsWith('INSERT INTO agents')) {
    const id = crypto.randomUUID();
    const newAgent = {
      id,
      user_id: params[0],
      wallet_address: params[1],
      status: params[2] || 'approved',
      country: params[3] || 'NG',
      created_at: new Date(),
      approved_at: new Date()
    };
    mockDb.agents.push(newAgent);
    return { rows: [newAgent] };
  }

  if (sql.startsWith('SELECT * FROM agents WHERE wallet_address =')) {
    const addr = params[0];
    const agent = mockDb.agents.find(a => a.wallet_address === addr);
    return { rows: agent ? [agent] : [] };
  }

  if (sql.startsWith('INSERT INTO transactions')) {
    const id = crypto.randomUUID();
    const newTx = {
      id,
      sender_id: params[0],
      recipient_address: params[1],
      amount: parseFloat(params[2]),
      fee: parseFloat(params[3]),
      asset: params[4],
      type: params[5],
      escrow_id: params[6] || null,
      status: params[7] || 'pending',
      tx_hash: params[8] || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    mockDb.transactions.push(newTx);
    return { rows: [newTx] };
  }

  if (sql.startsWith('SELECT * FROM transactions WHERE sender_id =')) {
    const sender_id = params[0];
    const list = mockDb.transactions.filter(t => t.sender_id === sender_id);
    return { rows: list };
  }

  if (sql.startsWith('UPDATE transactions SET status =')) {
    // E.g. UPDATE transactions SET status = $1, tx_hash = $2 WHERE id = $3
    const status = params[0];
    const tx_hash = params[1];
    const id = params[2];
    const tx = mockDb.transactions.find(t => t.id === id || (t.escrow_id && t.escrow_id.toString() === id.toString()));
    if (tx) {
      tx.status = status;
      tx.tx_hash = tx_hash;
      tx.updated_at = new Date();
    }
    return { rows: tx ? [tx] : [] };
  }

  if (sql.startsWith('INSERT INTO tickets')) {
    const id = crypto.randomUUID();
    const newTicket = {
      id,
      user_id: params[0],
      subject: params[1],
      description: params[2],
      status: 'open',
      created_at: new Date()
    };
    mockDb.tickets.push(newTicket);
    return { rows: [newTicket] };
  }

  if (sql.startsWith('SELECT * FROM tickets WHERE user_id =')) {
    const user_id = params[0];
    const list = mockDb.tickets.filter(t => t.user_id === user_id);
    return { rows: list };
  }

  return { rows: [] };
};
