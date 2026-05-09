const syncUsage = new Map();

// 1 hour in milliseconds
const WINDOW_MS = 3600000;
const MAX_FREE_SYNCS = 2;

function syncRateLimiter(req, res, next) {
  // Only limit free tier users
  if (req.userTier !== 'free') {
    return next();
  }

  const userId = req.user.id;
  const now = Date.now();

  if (!syncUsage.has(userId)) {
    syncUsage.set(userId, []);
  }

  let timestamps = syncUsage.get(userId);
  
  // Clean up old timestamps outside the window
  timestamps = timestamps.filter(time => now - time < WINDOW_MS);
  
  if (timestamps.length >= MAX_FREE_SYNCS) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded', 
      message: 'Free tier is limited to 2 manual syncs per hour. Please upgrade for unlimited syncs or try again later.' 
    });
  }

  // Record this sync attempt
  timestamps.push(now);
  syncUsage.set(userId, timestamps);

  next();
}

module.exports = syncRateLimiter;
