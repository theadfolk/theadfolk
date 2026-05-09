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
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());
const requestLogger = require('./middleware/logger');
app.use(requestLogger);
// Init Stripe Products
initStripeProducts();

// Billing routes
app.use('/billing', billingRouter);

const dealRoutes = require('./routes/dealRoutes');
const profileRoutes = require('./routes/profileRoutes');
const syncRoutes = require('./routes/syncRoutes');

// Routes
app.use('/auth', authRoutes);
app.use('/deals', dealRoutes);
app.use('/profile', profileRoutes);
app.use('/sync', syncRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Initialize Cron Jobs
const { initCron, runSync } = require('./services/cronService');
initCron();

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
