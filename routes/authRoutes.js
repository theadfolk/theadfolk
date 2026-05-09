const express = require('express');
const { getAuthUrl, getTokens } = require('../services/gmailService');
const supabase = require('../services/supabaseClient');

const router = express.Router();

// Step 1: Redirect to Google
router.get('/google', (req, res) => {
  // In a real app, you get this from authenticated session
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required as query param' });
  }

  const url = getAuthUrl(userId);
  res.redirect(url);
});

// Step 2: Google redirects back here
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state; // We passed userId in the state param

  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or state in callback' });
  }

  try {
    const tokens = await getTokens(code);

const { encryptToken } = require('../services/cryptoService');

      // Save tokens securely in Supabase
      // Encrypt tokens at rest
      const encryptedAccessToken = encryptToken(tokens.access_token);
      const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined;

      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          google_access_token: encryptedAccessToken,
          ...(encryptedRefreshToken && { google_refresh_token: encryptedRefreshToken }),
          google_token_expiry: tokens.expiry_date,
        })
        .eq('id', userId)
        .select();

    if (updateError) {
      console.error('Error saving tokens:', updateError);
      return res.status(500).json({ error: 'Failed to save tokens to database' });
    }

    if (!data || data.length === 0) {
      console.error('No user found to update, or RLS blocked the update for userId:', userId);
      return res.status(403).json({ error: 'Failed to save tokens. Make sure you use the SUPABASE_SERVICE_ROLE_KEY in .env to bypass RLS in the backend.' });
    }

    res.json({ success: true, message: 'Gmail connected successfully. You can close this window.' });
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

const authMiddleware = require('../middleware/authMiddleware');

// Step 3: Account Deletion
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user's Google token to revoke it
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('google_access_token')
      .eq('id', userId)
      .single();

    if (!fetchError && user && user.google_access_token) {
      const { decryptToken } = require('../services/cryptoService');
      const decryptedToken = decryptToken(user.google_access_token);
      
      // 2. Revoke token from Google
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${decryptedToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      } catch (revokeError) {
        console.error('Failed to revoke Google token:', revokeError);
        // Continue with account deletion even if Google revoke fails
      }
    }

    // 3. Delete user from Supabase (cascades to deals, profiles, screenings)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ success: true, message: 'Account and all associated data deleted successfully. Gmail access revoked.' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
