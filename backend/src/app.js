import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import vaccinationRoutes from './routes/vaccination.js';
import verifyRoutes from './routes/verify.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

const auditLogPath = process.env.AUDIT_LOG_PATH || './audit.log';
let auditLogStream;
try {
  auditLogStream = fs.createWriteStream(auditLogPath, { flags: 'a' });
} catch (e) {
  logger.error(`Could not open audit log file at ${auditLogPath}: ${e.message}`);
}

app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    if (req.path.includes('/vaccination/issue') && res.statusCode === 201 && auditLogStream) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'ISSUE_RECORD',
        patient: req.body.patient,
        vaccine: req.body.vaccine,
        date: req.body.date,
        issuer: req.user ? req.user.address : 'UNKNOWN',
        ip: req.ip,
        statusCode: res.statusCode,
      };
      auditLogStream.write(JSON.stringify(logEntry) + '\n');
    }
    originalSend.call(this, data);
  };
  next();
});

// Middleware for versioning headers
app.use('/v1', (req, res, next) => {
  res.setHeader('API-Version', '1');
  next();
});

// Rate limiting
const sep10Limit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_SEP10) || 10,
  message: { error: 'Too many SEP-10 requests, please try again later' },
});

const verifyLimit = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_VERIFY) || 60,
  message: { error: 'Too many verification queries, rate limit reached' },
});

// Version 1 Routes
app.use('/v1/auth', sep10Limit, authRoutes);
app.use('/v1/vaccination', vaccinationRoutes);
app.use('/v1/verify', verifyLimit, verifyRoutes);

// Unversioned routing redirection (308 Permanent Redirect with Deprecation: true)
app.use((req, res, next) => {
  const urlPath = req.path;
  const prefixes = ['/auth', '/vaccination', '/verify'];
  const matched = prefixes.find(p => urlPath.startsWith(p));
  if (matched) {
    res.setHeader('Deprecation', 'true');
    const newPath = `/v1${urlPath}`;
    return res.redirect(308, newPath);
  }
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: process.env.STELLAR_NETWORK || 'testnet' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`StellarVax backend server listening on port ${PORT}`);
  });
}

export default app;
