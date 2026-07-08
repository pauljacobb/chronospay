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
  logger.warn('Using GigFlow in-memory mock database fallback.');
}

// In-memory mock database tables
export const mockDb = {
  users: [],
  wallets: [],
  jobs: [],
  proposals: []
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
      role: params[3] || 'client',
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

  // 7. Insert Job
  if (normalized.startsWith('INSERT INTO jobs')) {
    const job = {
      id: `j-${Math.random().toString(36).substring(2, 9)}`,
      client_id: params[0],
      title: params[1],
      description: params[2],
      budget: parseFloat(params[3]),
      status: 'open',
      escrow_id: null,
      tx_hash: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.jobs.push(job);
    return { rows: [job], rowCount: 1 };
  }

  // 8. Query Jobs list
  if (normalized.startsWith('SELECT * FROM jobs') && !normalized.includes('WHERE')) {
    return { rows: mockDb.jobs, rowCount: mockDb.jobs.length };
  }

  // 9. Query Job by ID
  if (normalized.startsWith('SELECT * FROM jobs WHERE id =')) {
    const job = mockDb.jobs.find(j => j.id === params[0]);
    return { rows: job ? [job] : [], rowCount: job ? 1 : 0 };
  }

  // 10. Assign Proposal / Accept Bid
  if (normalized.startsWith('UPDATE jobs SET status = $1, freelancer_id = $2, escrow_id = $3 WHERE id = $4')) {
    const status = params[0];
    const freelancerId = params[1];
    const escrowId = params[2];
    const jobId = params[3];

    const job = mockDb.jobs.find(j => j.id === jobId);
    if (job) {
      job.status = status;
      job.freelancer_id = freelancerId;
      job.escrow_id = escrowId;
      job.updated_at = new Date().toISOString();
      return { rows: [job], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 11. Update Job status (release/refund)
  if (normalized.startsWith('UPDATE jobs SET status = $1, tx_hash = $2 WHERE id = $3')) {
    const status = params[0];
    const txHash = params[1];
    const jobId = params[2];

    const job = mockDb.jobs.find(j => j.id === jobId);
    if (job) {
      job.status = status;
      job.tx_hash = txHash;
      job.updated_at = new Date().toISOString();
      return { rows: [job], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 12. Insert Proposal
  if (normalized.startsWith('INSERT INTO proposals')) {
    const prop = {
      id: `p-${Math.random().toString(36).substring(2, 9)}`,
      job_id: params[0],
      freelancer_id: params[1],
      bid_amount: parseFloat(params[2]),
      cover_letter: params[3],
      status: 'pending',
      created_at: new Date().toISOString()
    };
    mockDb.proposals.push(prop);
    return { rows: [prop], rowCount: 1 };
  }

  // 13. Query Proposals by Job ID
  if (normalized.startsWith('SELECT * FROM proposals WHERE job_id =')) {
    const filtered = mockDb.proposals.filter(p => p.job_id === params[0]);
    return { rows: filtered, rowCount: filtered.length };
  }

  // 14. Query Proposal by ID
  if (normalized.startsWith('SELECT * FROM proposals WHERE id =')) {
    const prop = mockDb.proposals.find(p => p.id === params[0]);
    return { rows: prop ? [prop] : [], rowCount: prop ? 1 : 0 };
  }

  // 15. Update Proposal status
  if (normalized.startsWith('UPDATE proposals')) {
    const propId = params[params.length - 1];
    const prop = mockDb.proposals.find(p => p.id === propId);
    if (prop) {
      prop.status = normalized.includes("'accepted'") ? 'accepted' : 'rejected';
      return { rows: [prop], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 16. Query User by Wallet Address
  if (normalized.startsWith('SELECT * FROM users WHERE wallet_address =')) {
    const user = mockDb.users.find(u => u.wallet_address === params[0]);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  throw new Error(`Unsupported Mock SQL Query: ${normalized}`);
}

export async function query(text, params) {
  if (pool) {
    return pool.query(text, params);
  }
  return runMockQuery(text, params);
}
