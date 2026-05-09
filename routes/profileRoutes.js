const express = require('express');
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all profile routes
router.use(authMiddleware);

// GET /profile - get creator profile
router.get('/', async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "multiple (or no) rows returned" for single()
      throw error;
    }

    if (!profile) {
      return res.json({ success: true, profile: null, message: 'No profile set up yet.' });
    }

    res.json({ success: true, profile });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// POST /profile - save/update creator profile
router.post('/', async (req, res) => {
  try {
    const { niche_description } = req.body;

    if (!niche_description) {
      return res.status(400).json({ error: 'niche_description is required' });
    }

    const { data: upsertedProfile, error } = await supabase
      .from('creator_profiles')
      .upsert({
        user_id: req.user.id,
        niche_description
      }, { onConflict: 'user_id' })
      .select()
      .single();

    // Since user_id is NOT a primary key directly, we might need to handle UPSERT via constraints.
    // In our schema, `id` is PK, but we didn't add a UNIQUE constraint on user_id in creator_profiles!
    // So upsert with onConflict: 'user_id' will fail unless user_id is unique.
    // Let's explicitly check and update/insert to be safe.
    
    if (error && error.code === '42P10') {
      // onConflict error. Let's do manual select + insert/update
      const { data: existing } = await supabase.from('creator_profiles').select('id').eq('user_id', req.user.id).single();
      
      let finalProfile;
      if (existing) {
        const { data: updated } = await supabase
          .from('creator_profiles')
          .update({ niche_description })
          .eq('id', existing.id)
          .eq('user_id', req.user.id) // Enforce data isolation
          .select()
          .single();
        finalProfile = updated;
      } else {
        const { data: inserted } = await supabase.from('creator_profiles').insert({ user_id: req.user.id, niche_description }).select().single();
        finalProfile = inserted;
      }
      return res.json({ success: true, profile: finalProfile });
    } else if (error) {
      throw error;
    }

    res.json({ success: true, profile: upsertedProfile });
  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

module.exports = router;
