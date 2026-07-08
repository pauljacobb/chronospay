/**
 * Middleware to restrict access to administrators
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access restricted to administrators only' });
  }
  next();
}
