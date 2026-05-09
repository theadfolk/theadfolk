const cron = require('node-cron');
const supabase = require('./supabaseClient');
const { getGmailClient, fetchBrandDealThreads } = require('./gmailService');
const { processDealThread } = require('./claudeService');
const { decryptToken } = require('./cryptoService');

async function runSync(targetUserId = null) {
  console.log(`[${new Date().toISOString()}] Starting sync process${targetUserId ? ` for user ${targetUserId}` : ' (global auto-sync)'}...`);
  
  // 1. Fetch users
  let query = supabase
    .from('users')
    .select('id, google_access_token, google_refresh_token, google_token_expiry, subscription_tier')
    .not('google_access_token', 'is', null);
    
  if (targetUserId) {
    query = query.eq('id', targetUserId);
  }

  const { data: users, error: usersError } = await query;
    
  if (usersError || !users) {
    console.error('Failed to fetch users for sync:', usersError);
    return;
  }
  
  for (const user of users) {
    const tier = user.subscription_tier || 'free';
    
    // Feature Gate: Auto-sync is only for creator and pro tiers
    // If targetUserId is set, this is a manual sync, so we allow it to proceed.
    if (!targetUserId && tier === 'free') {
      continue;
    }

    try {
      // 2. Fetch user's creator profile
      const { data: profile } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      // Decrypt tokens
      const decryptedUser = {
        ...user,
        google_access_token: decryptToken(user.google_access_token),
        google_refresh_token: user.google_refresh_token ? decryptToken(user.google_refresh_token) : null
      };

      // 3. Init gmail client and fetch threads
      const gmail = getGmailClient(decryptedUser);
      const threads = await fetchBrandDealThreads(gmail);
      
      let newDealsCount = 0;
      
      for (const thread of threads) {
        // To respect Anthropic rate limits (30k TPM), process a maximum of 5 new threads per sync run.
        if (newDealsCount >= 5) {
          console.log(`Reached 5 new deals limit for this sync run for user ${user.id}. Remaining threads will be processed in the next run.`);
          break;
        }

        // 4. Check if thread already processed
        const { data: existingDeal } = await supabase
          .from('deals')
          .select('id')
          .eq('user_id', user.id)
          .eq('thread_id', thread.threadId)
          .single();
          
        if (existingDeal) {
          continue; // Skip already processed thread
        }
        
        // 5. Process new thread
        const { dealInfo, brandScreening } = await processDealThread(
          thread.content, 
          profile, 
          thread.senderEmail || 'unknown@example.com',
          tier
        );
        
        // 6. Insert Deal
        const { data: insertedDeal, error: dealError } = await supabase
          .from('deals')
          .insert({
            user_id: user.id,
            thread_id: thread.threadId,
            brand_name: dealInfo.brandName,
            poc_name: dealInfo.pocName,
            poc_email: dealInfo.pocEmail,
            rate: dealInfo.rate,
            deliverables: dealInfo.deliverables,
            deadline: dealInfo.deadline,
            campaign_name: dealInfo.campaignName,
            status: dealInfo.status || 'Outreach',
            red_flags: dealInfo.redFlags
          })
          .select()
          .single();
          
        if (dealError) {
          console.error(`Error inserting deal for user ${user.id}:`, dealError);
          continue;
        }
        
        // 7. Insert Brand Screening
        const { error: screeningError } = await supabase
          .from('brand_screenings')
          .insert({
            deal_id: insertedDeal.id,
            sender_domain: brandScreening.isBusinessEmail ? 'business' : 'personal',
            is_business_email: brandScreening.isBusinessEmail,
            brand_description: brandScreening.brandDescription,
            company_size: brandScreening.companySize,
            industry: brandScreening.industry,
            social_presence: brandScreening.socialPresence,
            legimacy_score: brandScreening.legitimacyScore, // Matches our schema typo 'legimacy_score'
            synergy_score: brandScreening.synergyScore,
            recommendation: brandScreening.recommendation,
            synergy_summary: brandScreening.synergySummary
          });
          
        if (screeningError) {
          console.error(`Error inserting screening for deal ${insertedDeal.id}:`, screeningError);
        }
        
        newDealsCount++;
      }
      console.log(`[${new Date().toISOString()}] Synced ${newDealsCount} new deals for user ${user.id}`);
    } catch (err) {
      console.error(`Sync error for user ${user.id}:`, err.message);
    }
  }
  
  console.log(`[${new Date().toISOString()}] Global sync process completed.`);
}

function initCron() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    runSync();
  });
  console.log('Cron service initialized: Sync engine will run every 30 minutes.');
}

module.exports = {
  initCron,
  runSync // export for manual trigger endpoint
};
