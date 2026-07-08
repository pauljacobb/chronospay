import test from 'node:test';
import assert from 'node:assert';
import app from './app.js';

let server;
let port;
let baseUrl;

test.before(() => {
  return new Promise((resolve) => {
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

test('POST /v1/auth/sep10 returns challenge transaction', async () => {
  const wallet = 'GB3R2XWH7XCSHOHH23V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AX';
  const res = await fetch(`${baseUrl}/v1/auth/sep10`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet }),
  });
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.ok(json.challengeTx);
});

test('Unversioned path redirects to /v1 with 308 redirect and Deprecation header', async () => {
  const res = await fetch(`${baseUrl}/auth/sep10`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet: 'GB3R2XWH7XCSHOHH23V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AX' }),
    redirect: 'manual'
  });
  assert.strictEqual(res.status, 308);
  assert.strictEqual(res.headers.get('deprecation'), 'true');
  assert.ok(res.headers.get('location').includes('/v1/auth/sep10'));
});

test('GET /v1/verify/:wallet returns verified false for empty records', async () => {
  const wallet = 'GB3R2XWH7XCSHOHH23V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AX';
  const res = await fetch(`${baseUrl}/v1/verify/${wallet}`);
  assert.strictEqual(res.status, 200);
  const json = await res.json();
  assert.strictEqual(json.verified, false);
  assert.strictEqual(json.count, 0);
});
