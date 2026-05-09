let currentUser = null;
let currentTier = 'free';

document.addEventListener('DOMContentLoaded', async () => {
  // Ensure user is authenticated before showing dashboard
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/index.html';
    return;
  }

  currentUser = session.user;
  document.getElementById('user-email').textContent = currentUser.email;

  // Initialize UI
  setupNavigation();
  setupUserControls();
  
  // Load Initial Data
  await fetchUserData();
  await loadDeals();
  await loadProfile();
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      // Remove active classes
      navLinks.forEach(n => n.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // Add active class to clicked link and corresponding section
      link.classList.add('active');
      const targetId = link.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');
    });
  });
}

function setupUserControls() {
  // Sign Out
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/index.html';
  });

  // Connect Gmail
  document.getElementById('connect-gmail-btn').addEventListener('click', (e) => {
    e.preventDefault();
    // Redirect to Express Google OAuth route, passing Supabase User ID in query
    window.location.href = `/auth/google?userId=${currentUser.id}`;
  });

  // Sync Deals
  document.getElementById('sync-btn').addEventListener('click', async () => {
    const btn = document.getElementById('sync-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="spinner"></div> Syncing...';
    btn.disabled = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || result.message || 'Sync failed');
      
      showToast(result.message || 'Sync started successfully!', 'success');
      
      // Auto-refresh deals after 5 seconds to catch background updates
      setTimeout(loadDeals, 5000);
      setTimeout(loadDeals, 15000); 

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  // Save Profile
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nicheDesc = document.getElementById('niche-description').value;
    const btn = document.getElementById('save-profile-btn');
    const originalText = btn.textContent;
    btn.innerHTML = '<div class="spinner"></div> Saving...';
    btn.disabled = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ niche_description: nicheDesc })
      });
      
      if (!res.ok) throw new Error('Failed to save profile');
      showToast('Creator profile saved!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  // Billing Upgrades
  document.querySelectorAll('.upgrade-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tier = e.target.getAttribute('data-tier');
      e.target.innerHTML = '<div class="spinner"></div> Redirecting...';
      e.target.disabled = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch('/billing/create-checkout-session', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tier })
        });
        
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Failed to generate checkout session');
        }
      } catch (err) {
        showToast(err.message, 'error');
        e.target.textContent = `Upgrade to ${tier === 'pro' ? 'Pro' : 'Creator'}`;
        e.target.disabled = false;
      }
    });
  });

  // Delete Account
  document.getElementById('delete-account-btn').addEventListener('click', async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    
    const btn = document.getElementById('delete-account-btn');
    btn.innerHTML = '<div class="spinner"></div> Deleting...';
    btn.disabled = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/auth/account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to delete account');
      await supabase.auth.signOut();
      window.location.href = '/index.html';
    } catch (err) {
      showToast(err.message, 'error');
      btn.textContent = 'Delete Account';
      btn.disabled = false;
    }
  });
}

async function fetchUserData() {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_tier, google_access_token')
      .eq('id', currentUser.id)
      .single();

    if (error) throw error;

    currentTier = user.subscription_tier || 'free';
    
    // Update Badge
    const badge = document.getElementById('user-tier-badge');
    badge.textContent = `${currentTier.toUpperCase()} TIER`;
    if (currentTier === 'pro') badge.style.background = 'rgba(139, 92, 246, 0.2)';
    if (currentTier === 'creator') badge.style.background = 'rgba(16, 185, 129, 0.2)';

    // Update Pricing Buttons
    document.querySelectorAll('.pricing-card button').forEach(btn => {
      const btnTier = btn.getAttribute('data-tier');
      if (btnTier === currentTier) {
        btn.textContent = 'Current Plan';
        btn.disabled = true;
        btn.className = 'btn btn-secondary current-tier-btn';
      }
    });

    // Update Gmail Status
    const gmailStatus = document.getElementById('gmail-status');
    const connectBtn = document.getElementById('connect-gmail-btn');
    if (user.google_access_token) {
      gmailStatus.innerHTML = '<div class="status-dot connected"></div> Gmail Connected';
      connectBtn.innerHTML = 'Reconnect Gmail';
      connectBtn.classList.replace('btn-secondary', 'btn-primary');
    }

  } catch (err) {
    console.error('Error fetching user data:', err);
  }
}

async function loadProfile() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/profile', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (res.ok) {
      const result = await res.json();
      if (result.profile && result.profile.niche_description) {
        document.getElementById('niche-description').value = result.profile.niche_description;
      }
    }
  } catch (err) {
    console.error('Error loading profile:', err);
  }
}

async function loadDeals() {
  const container = document.getElementById('deals-container');
  const emptyState = document.getElementById('deals-empty-state');
  const loadingState = document.getElementById('deals-loading-state');
  
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  
  // Clear existing deals (except empty and loading states)
  Array.from(container.children).forEach(child => {
    if (child.id !== 'deals-empty-state' && child.id !== 'deals-loading-state') {
      child.remove();
    }
  });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/deals', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    const result = await res.json();
    loadingState.style.display = 'none';
    
    if (!res.ok || !result.success || result.deals.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    result.deals.forEach(deal => {
      const screening = deal.brand_screenings && deal.brand_screenings.length > 0 ? deal.brand_screenings[0] : null;
      container.appendChild(createDealCard(deal, screening));
    });

  } catch (err) {
    loadingState.style.display = 'none';
    emptyState.style.display = 'block';
    console.error('Error loading deals:', err);
  }
}

function createDealCard(deal, screening) {
  const el = document.createElement('div');
  el.className = 'glass-card deal-card';
  
  let statusClass = 'status-outreach';
  if (deal.status && deal.status.toLowerCase() === 'negotiating') statusClass = 'status-negotiating';
  if (deal.status && deal.status.toLowerCase() === 'confirmed') statusClass = 'status-confirmed';

  let html = `
    <div class="deal-header">
      <div>
        <div class="brand-name">${deal.brand_name || 'Unknown Brand'}</div>
        <div class="campaign-name">${deal.campaign_name || 'No Campaign Name'}</div>
      </div>
      <div class="status-badge ${statusClass}">${deal.status || 'Outreach'}</div>
    </div>
    
    <div class="deal-details">
      <div class="detail-row">
        <div class="detail-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Deadline</div>
        <div class="detail-value">${deal.deadline || 'TBD'}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> Rate</div>
        <div class="detail-value">${deal.rate || 'Not specified'}</div>
      </div>
      <div class="detail-row" style="margin-top: 1rem;">
        <div class="detail-value" style="color: var(--text-secondary); font-size: 0.85rem;">${deal.poc_name || 'Unknown POC'} • ${deal.poc_email || 'No email extracted'}</div>
      </div>
    </div>
  `;

  // Render Screening Tags if they exist
  let tagsHtml = '';
  
  // Basic verification (Creator+)
  if (screening && screening.is_business_email !== null) {
    if (screening.is_business_email) {
      tagsHtml += `<span class="tag tag-good"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Business Email</span>`;
    } else {
      tagsHtml += `<span class="tag tag-neutral"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> Personal Email</span>`;
    }
  }

  // AI Red Flags
  if (deal.red_flags && deal.red_flags.length > 0) {
    tagsHtml += `<span class="tag tag-bad"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> ${deal.red_flags.length} Red Flag(s)</span>`;
  }

  // Full AI Synergy (Pro)
  if (screening && screening.legimacy_score) {
    tagsHtml += `<span class="tag tag-pro">⚡ Legit: ${screening.legimacy_score}/100</span>`;
    tagsHtml += `<span class="tag tag-pro">✨ Synergy: ${screening.synergy_score}/100</span>`;
  }

  if (tagsHtml) {
    html += `<div class="screening-tags">${tagsHtml}</div>`;
  } else if (currentTier === 'free') {
    html += `<div class="screening-tags"><span class="tag tag-neutral" style="opacity:0.6; cursor:pointer;" onclick="document.querySelector('[data-target=billing-section]').click()">🔒 Upgrade to unlock AI screening</span></div>`;
  }

  el.innerHTML = html;
  return el;
}
