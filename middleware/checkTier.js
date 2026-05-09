const supabase = require('../services/supabaseClient');

/**
 * Middleware to fetch the user's tier from Supabase and attach it to req.userTier
 * Must be used after authMiddleware.
 */
async function checkTier(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      // Default to free if we can't find them, but log the error
      console.error('Failed to find user for tier check:', error);
      req.userTier = 'free';
    } else {
      req.userTier = user.subscription_tier || 'free';
    }

    next();
  } catch (err) {
    console.error('Tier check error:', err);
    res.status(500).json({ error: 'Internal Server Error during tier check' });
  }
}

module.exports = checkTier;
