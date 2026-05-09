const express = require('express');
const { runSync } = require('../services/cronService');
const authMiddleware = require('../middleware/authMiddleware');
const checkTier = require('../middleware/checkTier');
const syncRateLimiter = require('../middleware/rateLimiter');
const supabase = require('../services/supabaseClient');

const router = express.Router();

router.use(authMiddleware);
router.use(checkTier);

// POST /sync - manually trigger sync
router.post('/', syncRateLimiter, async (req, res) => {
  try {
    if (req.userTier === 'free') {
      const { count, error } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id);
        
      if (!error && count >= 5) {
        return res.status(403).json({ error: 'Free tier limit reached. Please upgrade to sync more deals.' });
      }
    }

    // Run sync asynchronously for this specific user
    runSync(req.user.id);
    res.json({ success: true, message: 'Sync process started in the background. Check server logs for progress.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start sync' });
  }
});

module.exports = router;
