import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import paymentRoutes from './routes/payments.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Global rate limiting: 100 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again after 15 minutes.' }
});

// Auth-specific rate limiting: 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use(globalLimiter);

// Register routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'KoraPay API' });
});

export default app;
