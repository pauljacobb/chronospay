import pg from 'pg';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new winston.transports.Console()]
});

const isTest = process.env.NODE_ENV === 'test';
const hasDbUrl = !!process.env.DATABASE_URL;

let pool = null;

if (hasDbUrl && !isTest) {
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
} else {
  logger.warn('Using ChronosPay in-memory mock database fallback.');
}

// In-memory mock database tables
export const mockDb = {
  users: [],
  wallets: [],
  streams: [],
  withdrawals: []
};

// Simple Mock SQL Parser for Offline/Test mode
function runMockQuery(text, params) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  // 1. Insert User
  if (normalized.startsWith('INSERT INTO users')) {
    const user = {
      id: `u-${Math.random().toString(36).substring(2, 9)}`,
      name: params[0],
      email: params[1],
      password_hash: params[2],
      role: params[3] || 'sender',
      wallet_address: params[4] || null,
      created_at: new Date().toISOString()
    };
    mockDb.users.push(user);
    return { rows: [user], rowCount: 1 };
  }

  // 2. Query User by Email
  if (normalized.startsWith('SELECT * FROM users WHERE email =')) {
    const user = mockDb.users.find(u => u.email === params[0]);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 3. Query User by ID
  if (normalized.startsWith('SELECT') && normalized.includes('FROM users WHERE id =')) {
    const user = mockDb.users.find(u => u.id === params[0]);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // 4. Insert Wallet
  if (normalized.startsWith('INSERT INTO wallets')) {
    const wallet = {
      id: `w-${Math.random().toString(36).substring(2, 9)}`,
      user_id: params[0],
      public_key: params[1],
      encrypted_secret_key: params[2],
      iv: params[3],
      created_at: new Date().toISOString()
    };
    mockDb.wallets.push(wallet);
    return { rows: [wallet], rowCount: 1 };
  }

  // 5. Query Wallet by User ID
  if (normalized.startsWith('SELECT * FROM wallets WHERE user_id =')) {
    const wallet = mockDb.wallets.find(w => w.user_id === params[0]);
    return { rows: wallet ? [wallet] : [], rowCount: wallet ? 1 : 0 };
  }

  // 6. Query Wallet Public Key by User ID
  if (normalized.startsWith('SELECT public_key FROM wallets WHERE user_id =')) {
    const wallet = mockDb.wallets.find(w => w.user_id === params[0]);
    return { rows: wallet ? [{ public_key: wallet.public_key }] : [], rowCount: wallet ? 1 : 0 };
  }

  // 7. Insert Stream
  if (normalized.startsWith('INSERT INTO streams')) {
    const stream = {
      id: `s-${Math.random().toString(36).substring(2, 9)}`,
      sender_id: params[0],
      recipient_address: params[1],
      amount: parseFloat(params[2]),
      start_time: params[3],
      stop_time: params[4],
      status: 'active',
      withdrawn: 0.0,
      escrow_id: params[5] || Math.floor(100000 + Math.random() * 900000),
      tx_hash: params[6] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.streams.push(stream);
    return { rows: [stream], rowCount: 1 };
  }

  // 8. Query Streams by Sender ID
  if (normalized.startsWith('SELECT * FROM streams WHERE sender_id =')) {
    const filtered = mockDb.streams.filter(s => s.sender_id === params[0]);
    return { rows: filtered, rowCount: filtered.length };
  }

  // 9. Query Streams by Recipient Address
  if (normalized.startsWith('SELECT * FROM streams WHERE recipient_address =')) {
    const filtered = mockDb.streams.filter(s => s.recipient_address === params[0]);
    return { rows: filtered, rowCount: filtered.length };
  }

  // 10. Query Stream by ID
  if (normalized.startsWith('SELECT * FROM streams WHERE id =')) {
    const stream = mockDb.streams.find(s => s.id === params[0]);
    return { rows: stream ? [stream] : [], rowCount: stream ? 1 : 0 };
  }

  // 11. Update Stream Withdrawal (Recipient pulls)
  if (normalized.startsWith('UPDATE streams SET withdrawn = $1, status = $2 WHERE id = $3')) {
    const withdrawn = parseFloat(params[0]);
    const status = params[1];
    const streamId = params[2];

    const stream = mockDb.streams.find(s => s.id === streamId);
    if (stream) {
      stream.withdrawn = withdrawn;
      stream.status = status;
      stream.updated_at = new Date().toISOString();
      return { rows: [stream], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 12. Update Stream Status & Withdrawn on Cancel
  if (normalized.startsWith('UPDATE streams SET status = $1, withdrawn = $2 WHERE id = $3')) {
    const status = params[0];
    const withdrawn = parseFloat(params[1]);
    const streamId = params[2];

    const stream = mockDb.streams.find(s => s.id === streamId);
    if (stream) {
      stream.status = status;
      stream.withdrawn = withdrawn;
      stream.updated_at = new Date().toISOString();
      return { rows: [stream], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 13. Insert Withdrawal Log
  if (normalized.startsWith('INSERT INTO withdrawals')) {
    const w = {
      id: `wd-${Math.random().toString(36).substring(2, 9)}`,
      stream_id: params[0],
      amount: parseFloat(params[1]),
      tx_hash: params[2],
      created_at: new Date().toISOString()
    };
    mockDb.withdrawals.push(w);
    return { rows: [w], rowCount: 1 };
  }

  // 14. Query Withdrawals by Stream ID
  if (normalized.startsWith('SELECT * FROM withdrawals WHERE stream_id =')) {
    const filtered = mockDb.withdrawals.filter(w => w.stream_id === params[0]);
    return { rows: filtered, rowCount: filtered.length };
  }

  throw new Error(`Unsupported Mock SQL Query: ${normalized}`);
}

export async function query(text, params) {
  if (pool) {
    return pool.query(text, params);
  }
  return runMockQuery(text, params);
}
