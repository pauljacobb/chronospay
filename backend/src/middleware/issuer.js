/**
 * Middleware to restrict access to authenticated issuers
 */
export function requireIssuer(req, res, next) {
  if (!req.user || req.user.role !== 'issuer') {
    return res.status(403).json({ error: 'Access restricted to authorized issuers only' });
  }
  next();
}
