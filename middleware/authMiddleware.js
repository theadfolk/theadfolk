const supabase = require('../services/supabaseClient');

/**
 * Middleware to protect routes by verifying Supabase JWT.
 * It expects an Authorization header with 'Bearer <token>'.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Supabase auth error:', error);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware exception:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = authMiddleware;
