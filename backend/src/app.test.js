import test from 'node:test';
import assert from 'node:assert';
import app from './app.js';
import { query } from './db.js';

let server;
let port;
let baseUrl;
let token;
let userPub = 'GB3R2XWH7XCSHOHH23V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AX';

test.before(() => {
  return new Promise((resolve) => {
    // Force test environment variables
    process.env.ENCRYPTION_KEY = 'your_32_character_encryption_key_';
    process.env.JWT_SECRET = 'dev_secret_key_korapay';
    
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(() => {
  return new Promise((resolve) => {
    if (server) {
      server.close(resolve);
    } else {
      resolve();
    }
  });
});

test('GET /health returns 200 OK', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.status, 'OK');
});

test('POST /api/auth/register creates user, wallet, and returns token', async () => {
  const payload = {
    name: 'Kora Developer',
    email: `dev_${Date.now()}@korapay.com`,
    password: 'securePassword123'
  };

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 201);
  const json = await res.json();
  assert.ok(json.token);
  assert.ok(json.user.publicKey);
  token = json.token; // Save token for authenticated requests
});

test('POST /api/auth/login validates credentials and returns token', async () => {
  const payload = {
    email: 'test_login@korapay.com',
    password: 'password123'
  };

  // Seed user in mock db
  await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Tester', email: payload.email, password: payload.password })
  });

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.ok(json.token);
});

test('GET /api/wallet/contacts CRUD flows', async () => {
  // Add contact
  const addRes = await fetch(`${baseUrl}/api/wallet/contacts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: 'Alice Friend', walletAddress: 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH' })
  });
  assert.strictEqual(addRes.status, 201);
  const addJson = await addRes.json();
  assert.strictEqual(addJson.contact.name, 'Alice Friend');

  // List contacts
  const listRes = await fetch(`${baseUrl}/api/wallet/contacts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(listRes.status, 200);
  const listJson = await listRes.json();
  assert.ok(listJson.contacts.length > 0);
});

test('POST /api/payments/send executes payment transfer', async () => {
  const payload = {
    recipientAddress: 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH',
    amount: '10.5',
    asset: 'XLM'
  };

  const res = await fetch(`${baseUrl}/api/payments/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 201);
  const json = await res.json();
  assert.ok(json.success);
  assert.ok(json.txHash);
});

test('POST /api/escrow/create rejects unapproved agents', async () => {
  const payload = {
    agent_wallet: 'GCSUPERUNAPPROVEDAGENT12345678901234567890123456789012345',
    amount: '100.0',
    asset: 'USDC'
  };

  const res = await fetch(`${baseUrl}/api/escrow/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  // Rejects because the agent is not approved in database
  assert.strictEqual(res.status, 400);
  const json = await res.json();
  assert.strictEqual(json.error, 'Agent is not registered in the AfriPay network');
});
