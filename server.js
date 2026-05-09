const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const { getGmailClient, fetchBrandDealThreads } = require('./services/gmailService');
const supabase = require('./services/supabaseClient');

const { initStripeProducts } = require('./services/stripeService');
const { router: billingRouter, webhookHandler } = require('./routes/billingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Stripe Webhook MUST be before express.json()
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());
const requestLogger = require('./middleware/logger');
app.use(requestLogger);

// Init Stripe Products
initStripeProducts();

// Billing routes
app.use('/api/billing', billingRouter);

const dealRoutes = require('./routes/dealRoutes');
const profileRoutes = require('./routes/profileRoutes');
const syncRoutes = require('./routes/syncRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Vercel Cron Endpoint
const { runSync } = require('./services/cronService');
app.get('/api/internal/cron/sync', async (req, res) => {
  // Protect this route from unauthorized access
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Triggering Vercel auto-sync for all users...');
  
  // Since runSync might exceed Vercel's 10s or 60s timeout,
  // we trigger it and immediately return 200 OK.
  // Note: Vercel might suspend the execution context, so this is best-effort.
  runSync().catch(err => console.error('Auto-sync failed:', err));
  
  res.status(200).json({ success: true, message: 'Sync triggered' });
});

// Only listen if not running in Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

module.exports = app;
