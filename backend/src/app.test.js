import test from 'node:test';
import assert from 'node:assert';
import app from './app.js';
import { mockDb } from './db.js';

// Helper to make mock requests
async function mockFetch(path, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body ? JSON.stringify(options.body) : null;

  if (body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Use dynamic import for supertest or simulate request if we want to avoid extra dependencies.
  // Actually, we can use a custom request dispatcher since standard node fetch isn't bound to express directly without listening.
  // Wait, is supertest or similar installed? Let's check package.json:
  // It only lists: @stellar/stellar-sdk, bcryptjs, cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken, pg, winston.
  // So we don't have supertest. But we can easily start the express app on a random port, query it using global `fetch`, and shut it down after tests!
  // This is a native and beautiful way to do it.
}

// Let's write the test suite
test('ChronosPay API Integration Tests', async (t) => {
  // Start server on a dynamic port
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let senderToken = '';
  let recipientToken = '';
  let testStreamId = '';
  
  const recipientWalletAddress = 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH';

  await t.test('Register Sender', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Sender',
        email: 'alice@chronospay.io',
        password: 'Password123!',
        role: 'sender'
      })
    });
    
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.token);
    assert.strictEqual(data.user.email, 'alice@chronospay.io');
    senderToken = data.token;
  });

  await t.test('Register Recipient', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Recipient',
        email: 'bob@chronospay.io',
        password: 'Password123!',
        role: 'recipient',
        walletAddress: recipientWalletAddress
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.token);
    assert.strictEqual(data.user.wallet_address, recipientWalletAddress);
    recipientToken = data.token;
  });

  await t.test('Login User', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@chronospay.io',
        password: 'Password123!'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token);
  });

  await t.test('Create Payment Stream', async () => {
    const startTime = new Date(Date.now() - 5000).toISOString(); // 5 seconds ago
    const stopTime = new Date(Date.now() + 10000).toISOString(); // 10 seconds from now

    const res = await fetch(`${baseUrl}/streams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${senderToken}`
      },
      body: JSON.stringify({
        recipientAddress: recipientWalletAddress,
        amount: '100.0000000',
        startTime,
        stopTime
      })
    });

    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.success);
    assert.strictEqual(data.stream.recipient_address, recipientWalletAddress);
    assert.strictEqual(data.stream.status, 'active');
    testStreamId = data.stream.id;
  });

  await t.test('List Sent Streams', async () => {
    const res = await fetch(`${baseUrl}/streams/sent`, {
      headers: { 'Authorization': `Bearer ${senderToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.streams.length > 0);
  });

  await t.test('List Received Streams', async () => {
    const res = await fetch(`${baseUrl}/streams/received`, {
      headers: { 'Authorization': `Bearer ${recipientToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.streams.length > 0);
  });

  await t.test('Withdraw Vested Funds', async () => {
    const res = await fetch(`${baseUrl}/streams/${testStreamId}/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recipientToken}`
      },
      body: JSON.stringify({
        amountToWithdraw: '10.0000000'
      })
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.strictEqual(data.stream.withdrawn, 10);
  });

  await t.test('Cancel Stream', async () => {
    const res = await fetch(`${baseUrl}/streams/${testStreamId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${senderToken}` }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.strictEqual(data.stream.status, 'cancelled');
  });

  // Close server
  server.close();
});
