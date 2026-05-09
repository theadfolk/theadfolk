const express = require('express');
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');
const checkTier = require('../middleware/checkTier');

const router = express.Router();

// All routes are protected by Supabase Auth and Tier checking
router.use(authMiddleware);
router.use(checkTier);

// GET /deals - all deals with screening data for the authenticated user
router.get('/', async (req, res) => {
  try {
    const { data: deals, error } = await supabase
      .from('deals')
      .select(`
        *,
        brand_screenings (*)
      `)
      .eq('user_id', req.user.id)
      .order('last_updated', { ascending: false });

    if (error) throw error;

    // Feature Gate: Strip brand screenings if free tier
    if (req.userTier === 'free') {
      deals.forEach(d => delete d.brand_screenings);
    }

    res.json({ success: true, deals });
  } catch (err) {
    console.error('Error fetching deals:', err);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// GET /deals/:id - single deal full detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: deal, error } = await supabase
      .from('deals')
      .select(`
        *,
        brand_screenings (*)
      `)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    // Feature Gate: Strip brand screenings if free tier
    if (req.userTier === 'free') {
      delete deal.brand_screenings;
    }

    res.json({ success: true, deal });
  } catch (err) {
    console.error('Error fetching deal details:', err);
    res.status(500).json({ error: 'Failed to fetch deal details' });
  }
});

// PATCH /deals/:id - update deal status manually
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Outreach', 'Negotiating', 'Confirmed', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: updatedDeal, error } = await supabase
      .from('deals')
      .update({ status, last_updated: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !updatedDeal) {
      return res.status(404).json({ error: 'Deal not found or update failed' });
    }

    res.json({ success: true, deal: updatedDeal });
  } catch (err) {
    console.error('Error updating deal:', err);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

module.exports = router;
