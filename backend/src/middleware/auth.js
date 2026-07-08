import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_secret_key_korapay';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded; // decoded: { id, email, role }
    next();
  });
}
