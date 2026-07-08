import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Global Rate Limiting: 100 requests per 15 mins
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});

// Authentication Rate Limiting: 10 requests per 15 mins
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

app.use(globalLimiter);

// Routes mounting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/jobs', jobsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'GigFlow API' });
});

export default app;
