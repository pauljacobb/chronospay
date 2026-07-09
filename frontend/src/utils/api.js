import axios from 'axios';

// Detect if we are hosted on GitHub Pages or if mock mode has been activated
const isMockMode = typeof window !== 'undefined' && (
  window.location.hostname.includes('github.io') ||
  localStorage.getItem('chronospay_mock_api') === 'true'
);

// Retrieve local mock database
const getMockDb = () => {
  let users = [];
  let streams = [];
  let withdrawals = [];

  try {
    users = JSON.parse(localStorage.getItem('chronospay_mock_users') || '[]');
    streams = JSON.parse(localStorage.getItem('chronospay_mock_streams') || '[]');
    withdrawals = JSON.parse(localStorage.getItem('chronospay_mock_withdrawals') || '[]');
  } catch (e) {
    console.error('Failed to parse mock database', e);
  }

  // Seed default users if empty
  if (users.length === 0) {
    users = [
      {
        id: 'u-sender1',
        name: 'John Sender',
        email: 'sender@chronospay.io',
        password: 'password',
        role: 'sender',
        wallet_address: 'GD3V7SOP5HET7N2GCRMXK75L62LCR6WFFY6C6Y5AXKB3R2XWH7XCSHOH',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'u-recipient1',
        name: 'Alice Recipient',
        email: 'recipient@chronospay.io',
        password: 'password',
        role: 'recipient',
        wallet_address: 'GBRECIPIENT1234567890123456789012345678901234567890123456',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ];
    localStorage.setItem('chronospay_mock_users', JSON.stringify(users));
  }

  // Seed default streams if empty
  if (streams.length === 0) {
    const oneHour = 3600 * 1000;
    const oneDay = 24 * oneHour;
    streams = [
      {
        id: 's-1',
        sender_id: 'u-sender1',
        recipient_address: 'GBRECIPIENT1234567890123456789012345678901234567890123456',
        amount: '150.0000',
        start_time: new Date(Date.now() - oneHour).toISOString(),
        stop_time: new Date(Date.now() + 9 * oneHour).toISOString(),
        status: 'active',
        withdrawn: '10.0000',
        escrow_id: '123456',
        tx_hash: '0xmocktxhash1000000000000000000000000000000000000000000000000001',
        created_at: new Date(Date.now() - oneHour).toISOString(),
        updated_at: new Date(Date.now() - oneHour).toISOString()
      },
      {
        id: 's-2',
        sender_id: 'u-sender1',
        recipient_address: 'GBRECIPIENT1234567890123456789012345678901234567890123456',
        amount: '500.0000',
        start_time: new Date(Date.now() - 2 * oneDay).toISOString(),
        stop_time: new Date(Date.now() - oneDay).toISOString(),
        status: 'completed',
        withdrawn: '500.0000',
        escrow_id: '654321',
        tx_hash: '0xmocktxhash2000000000000000000000000000000000000000000000000002',
        created_at: new Date(Date.now() - 2 * oneDay).toISOString(),
        updated_at: new Date(Date.now() - oneDay).toISOString()
      }
    ];
    localStorage.setItem('chronospay_mock_streams', JSON.stringify(streams));
  }

  return { users, streams, withdrawals };
};

const saveMockDb = (db) => {
  localStorage.setItem('chronospay_mock_users', JSON.stringify(db.users));
  localStorage.setItem('chronospay_mock_streams', JSON.stringify(db.streams));
  localStorage.setItem('chronospay_mock_withdrawals', JSON.stringify(db.withdrawals));
};

// Mock Axios Adapter
const mockAdapter = async (config) => {
  const { url, method, data: rawData, headers } = config;
  const db = getMockDb();
  
  // Extract auth user from token (we store user id as token in mock mode)
  let currentUser = null;
  const authHeader = headers['Authorization'] || headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const userId = authHeader.substring(7);
    currentUser = db.users.find(u => u.id === userId);
  }

  // Parse path out of the URL
  let path = url || '';
  if (path.startsWith('http')) {
    try {
      const parsed = new URL(path);
      path = parsed.pathname;
    } catch (e) {}
  }
  
  // Remove baseURL prefix if present
  if (path.startsWith('/api')) {
    path = path.substring(4);
  }
  if (path.startsWith('api')) {
    path = path.substring(3);
  }

  // Handle optional query parameters
  const queryIndex = path.indexOf('?');
  if (queryIndex !== -1) {
    path = path.substring(0, queryIndex);
  }

  let responseData = null;
  let status = 200;

  try {
    // GET /auth/me
    if (path === '/auth/me' && method.toLowerCase() === 'get') {
      if (!currentUser) {
        status = 401;
        throw new Error('Unauthorized');
      }
      responseData = currentUser;
    }
    // POST /auth/login
    else if (path === '/auth/login' && method.toLowerCase() === 'post') {
      const { email } = JSON.parse(rawData || '{}');
      const user = db.users.find(u => u.email === email);
      if (!user) {
        status = 401;
        throw new Error('Invalid email or password');
      }
      responseData = {
        token: user.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          wallet_address: user.wallet_address
        }
      };
    }
    // POST /auth/register
    else if (path === '/auth/register' && method.toLowerCase() === 'post') {
      const { name, email, role, walletAddress } = JSON.parse(rawData || '{}');
      if (!name || !email) {
        status = 400;
        throw new Error('Name and email are required');
      }
      if (db.users.some(u => u.email === email)) {
        status = 409;
        throw new Error('Email already registered');
      }
      
      const newUserId = `u-${Math.random().toString(36).substring(2, 9)}`;
      const newUser = {
        id: newUserId,
        name,
        email,
        role: role || 'sender',
        wallet_address: walletAddress || 'GD' + Math.random().toString(36).substring(2, 10).toUpperCase() + 'MOCK' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        created_at: new Date().toISOString()
      };
      
      db.users.push(newUser);
      saveMockDb(db);
      
      responseData = {
        token: newUser.id,
        user: newUser
      };
      status = 201;
    }
    // GET /streams/sent
    else if (path === '/streams/sent' && method.toLowerCase() === 'get') {
      if (!currentUser) {
        status = 401;
        throw new Error('Unauthorized');
      }
      const sent = db.streams.filter(s => s.sender_id === currentUser.id);
      responseData = { streams: sent };
    }
    // GET /streams/received
    else if (path === '/streams/received' && method.toLowerCase() === 'get') {
      if (!currentUser) {
        status = 401;
        throw new Error('Unauthorized');
      }
      const received = db.streams.filter(s => s.recipient_address === currentUser.wallet_address);
      responseData = { streams: received };
    }
    // GET /streams/:id
    else if (path.startsWith('/streams/') && method.toLowerCase() === 'get' && !path.endsWith('/withdraw') && !path.endsWith('/cancel')) {
      const streamId = path.split('/')[2];
      const stream = db.streams.find(s => s.id === streamId);
      if (!stream) {
        status = 404;
        throw new Error('Stream not found');
      }
      responseData = stream;
    }
    // POST /streams
    else if (path === '/streams' && method.toLowerCase() === 'post') {
      if (!currentUser) {
        status = 401;
        throw new Error('Unauthorized');
      }
      const { recipientAddress, amount, startTime, stopTime } = JSON.parse(rawData || '{}');
      if (!recipientAddress || !amount || !startTime || !stopTime || parseFloat(amount) <= 0) {
        status = 400;
        throw new Error('Valid recipient, amount, start time, and stop time are required');
      }
      
      const newStream = {
        id: `s-${Math.random().toString(36).substring(2, 9)}`,
        sender_id: currentUser.id,
        recipient_address: recipientAddress,
        amount: parseFloat(amount).toFixed(4),
        start_time: startTime,
        stop_time: stopTime,
        status: 'active',
        withdrawn: '0.0000',
        escrow_id: Math.floor(100000 + Math.random() * 900000).toString(),
        tx_hash: '0x' + Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      db.streams.push(newStream);
      saveMockDb(db);
      
      responseData = {
        success: true,
        stream: newStream
      };
      status = 201;
    }
    // POST /streams/:id/withdraw
    else if (path.startsWith('/streams/') && path.endsWith('/withdraw') && method.toLowerCase() === 'post') {
      if (!currentUser) {
        status = 401;
        throw new Error('Unauthorized');
      }
      const streamId = path.split('/')[2];
      const { amountToWithdraw } = JSON.parse(rawData || '{}');
      
      const streamIndex = db.streams.findIndex(s => s.id === streamId);
      if (streamIndex === -1) {
        status = 404;
        throw new Error('Stream not found');
      }
      const stream = db.streams[streamIndex];
      if (stream.status !== 'active') {
        status = 400;
        throw new Error('Stream is not active');
      }
      if (stream.recipient_address !== currentUser.wallet_address) {
        status = 403;
        throw new Error('Only the recipient of this stream can withdraw funds');
      }
      
      // Compute vested amount
      const now = Date.now() / 1000;
      const start = new Date(stream.start_time).getTime() / 1000;
      const stop = new Date(stream.stop_time).getTime() / 1000;
      const amount = parseFloat(stream.amount);
      const withdrawn = parseFloat(stream.withdrawn);
      
      let vested = 0;
      if (now <= start) vested = 0;
      else if (now >= stop) vested = amount;
      else vested = (amount * (now - start)) / (stop - start);
      
      const available = Math.max(0, vested - withdrawn);
      const reqWithdraw = parseFloat(amountToWithdraw);
      if (reqWithdraw <= 0 || isNaN(reqWithdraw)) {
        status = 400;
        throw new Error('Positive withdrawal amount required');
      }
      if (reqWithdraw > available) {
        status = 400;
        throw new Error(`Insufficient vested balance. Currently available: ${available.toFixed(4)} XLM`);
      }
      
      const nextWithdrawn = withdrawn + reqWithdraw;
      const nextStatus = nextWithdrawn >= amount ? 'completed' : 'active';
      
      stream.withdrawn = nextWithdrawn.toFixed(4);
      stream.status = nextStatus;
      stream.updated_at = new Date().toISOString();
      
      const newWithdrawal = {
        id: `wd-${Math.random().toString(36).substring(2, 9)}`,
        stream_id: streamId,
        amount: reqWithdraw.toFixed(4),
        tx_hash: '0x' + Math.random().toString(16).substring(2, 18),
        created_at: new Date().toISOString()
      };
      db.withdrawals.push(newWithdrawal);
      saveMockDb(db);
      
      responseData = {
        success: true,
        withdrawal: newWithdrawal,
        stream
      };
    }
    // POST /streams/:id/cancel
    else if (path.startsWith('/streams/') && path.endsWith('/cancel') && method.toLowerCase() === 'post') {
      if (!currentUser) {
        status = 401;
        throw new Error('Unauthorized');
      }
      const streamId = path.split('/')[2];
      const streamIndex = db.streams.findIndex(s => s.id === streamId);
      if (streamIndex === -1) {
        status = 404;
        throw new Error('Stream not found');
      }
      const stream = db.streams[streamIndex];
      if (stream.sender_id !== currentUser.id) {
        status = 403;
        throw new Error('Only the sender can cancel this stream');
      }
      if (stream.status !== 'active') {
        status = 400;
        throw new Error('Stream is not active');
      }
      
      // Calculate vesting splits
      const now = Date.now() / 1000;
      const start = new Date(stream.start_time).getTime() / 1000;
      const stop = new Date(stream.stop_time).getTime() / 1000;
      const amount = parseFloat(stream.amount);
      const withdrawn = parseFloat(stream.withdrawn);
      
      let vested = 0;
      if (now <= start) vested = 0;
      else if (now >= stop) vested = amount;
      else vested = (amount * (now - start)) / (stop - start);
      
      const availableVested = Math.max(0, vested - withdrawn);
      const refundUnvested = Math.max(0, amount - vested);
      
      stream.status = 'cancelled';
      stream.withdrawn = (withdrawn + availableVested).toFixed(4);
      stream.updated_at = new Date().toISOString();
      
      saveMockDb(db);
      
      responseData = {
        success: true,
        message: 'Stream cancelled. Split refunds processed successfully.',
        txHash: '0x' + Math.random().toString(16).substring(2, 18),
        stream,
        refunds: { vested: vested.toFixed(4), unvested: refundUnvested.toFixed(4) }
      };
    }
    // Endpoint not found
    else {
      status = 404;
      throw new Error(`Endpoint not found: ${method.toUpperCase()} ${path}`);
    }
  } catch (err) {
    return Promise.reject({
      response: {
        data: { error: err.message || 'Internal Server Error' },
        status: status === 200 ? 500 : status,
        statusText: 'Error',
        headers: {},
        config
      }
    });
  }

  return Promise.resolve({
    data: responseData,
    status,
    statusText: 'OK',
    headers: {},
    config
  });
};

const api = axios.create({
  baseURL: '/api'
});

// Configure adapter conditionally
if (isMockMode) {
  api.defaults.adapter = mockAdapter;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chronospay_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to catch connection failures and activate mock mode dynamically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If not in mock mode and it is a connection/network error, or a 404 (common on static servers for /api)
    if (!isMockMode && (!error.response || error.response.status === 404 || error.response.status >= 500)) {
      console.warn('Stellar ChronosPay: API connection failed. Activating local mock database.');
      localStorage.setItem('chronospay_mock_api', 'true');
      
      // Fallback this exact request to mock adapter
      try {
        const mockRes = await mockAdapter(error.config);
        // Force reload page after a brief moment to switch all future calls to mock mode smoothly
        setTimeout(() => {
          window.location.reload();
        }, 100);
        return mockRes;
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
