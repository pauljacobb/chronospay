import test from 'node:test';
import assert from 'node:assert';
import app from './app.js';
import { mockDb } from './db.js';

let server;
let port;
let baseUrl;

let clientToken;
let freelancerToken;
let jobId;
let proposalId;

test.before(() => {
  return new Promise((resolve) => {
    process.env.ENCRYPTION_KEY = 'your_32_character_encryption_key_';
    process.env.JWT_SECRET = 'dev_secret_key_gigflow';
    
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

test('POST /api/auth/register (Client)', async () => {
  const payload = {
    name: 'Gig Client',
    email: `client_${Date.now()}@gigflow.com`,
    password: 'password123',
    role: 'client'
  };

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 201);
  const json = await res.json();
  assert.ok(json.token);
  assert.strictEqual(json.user.role, 'client');
  clientToken = json.token;
});

test('POST /api/auth/register (Freelancer)', async () => {
  const payload = {
    name: 'Gig Freelancer',
    email: `freelancer_${Date.now()}@gigflow.com`,
    password: 'password123',
    role: 'freelancer'
  };

  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 201);
  const json = await res.json();
  assert.ok(json.token);
  assert.strictEqual(json.user.role, 'freelancer');
  freelancerToken = json.token;
});

test('POST /api/jobs creates a job listing and locks budget', async () => {
  const payload = {
    title: 'Develop Soroban Smart Contract',
    description: 'Looking for a Rust developer to write custom escrow modules on Stellar.',
    budget: '1500.00'
  };

  const res = await fetch(`${baseUrl}/api/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 201);
  const json = await res.json();
  assert.ok(json.success);
  assert.strictEqual(json.job.title, payload.title);
  assert.strictEqual(json.job.status, 'open');
  jobId = json.job.id; // Save job ID
});

test('POST /api/jobs/:job_id/proposals bids on job', async () => {
  const payload = {
    bid_amount: '1450.00',
    cover_letter: 'I have 3 years of Soroban and Stellar Rust experience.'
  };

  const res = await fetch(`${baseUrl}/api/jobs/${jobId}/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${freelancerToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(res.status, 201);
  const json = await res.json();
  assert.ok(json.success);
  assert.strictEqual(json.proposal.cover_letter, payload.cover_letter);
  proposalId = json.proposal.id; // Save proposal ID
});

test('POST /api/jobs/:id/assign assigns proposal to job', async () => {
  const res = await fetch(`${baseUrl}/api/jobs/${jobId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${clientToken}`
    },
    body: JSON.stringify({ proposal_id: proposalId })
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.ok(json.success);
  assert.ok(json.escrowId);
  assert.strictEqual(json.job.status, 'assigned');
});

test('POST /api/jobs/:id/release completes job and releases escrow', async () => {
  const res = await fetch(`${baseUrl}/api/jobs/${jobId}/release`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clientToken}`
    }
  });

  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.ok(json.success);
  assert.strictEqual(json.job.status, 'completed');
  assert.ok(json.txHash);
});
