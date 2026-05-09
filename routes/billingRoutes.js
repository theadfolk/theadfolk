const express = require('express');
const { stripe, config } = require('../services/stripeService');
const supabase = require('../services/supabaseClient');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /create-checkout-session
// Protected by authMiddleware
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  const { tier } = req.body; // 'creator' or 'pro'

  if (!tier || !['creator', 'pro'].includes(tier)) {
    return res.status(400).json({ error: 'Valid tier (creator or pro) is required' });
  }

  const priceId = config.priceIds[tier];
  if (!priceId) {
    return res.status(500).json({ error: 'Stripe products not initialized' });
  }

  try {
    // Check if user already has a stripe customer ID
    let customerId;
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', req.user.id)
      .single();

    if (user && user.stripe_customer_id) {
      customerId = user.stripe_customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: req.user.id }
      });
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', req.user.id);
    }

    // Create session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
      subscription_data: {
        metadata: { supabase_user_id: req.user.id, tier }
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// The webhook handler to be mounted BEFORE express.json()
const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.subscription_data?.metadata?.supabase_user_id || session.metadata?.supabase_user_id;
        // The tier might be stored in metadata during checkout
        // Let's retrieve the subscription to find the price and determine the tier
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0].price.id;
        
        let tier = 'free';
        if (priceId === config.priceIds.creator) tier = 'creator';
        if (priceId === config.priceIds.pro) tier = 'pro';

        if (userId) {
          await supabase.from('users').update({ subscription_tier: tier }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.supabase_user_id;
        const priceId = subscription.items.data[0].price.id;

        let tier = 'free';
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          if (priceId === config.priceIds.creator) tier = 'creator';
          if (priceId === config.priceIds.pro) tier = 'pro';
        }

        if (userId) {
          await supabase.from('users').update({ subscription_tier: tier }).eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.supabase_user_id;
        
        if (userId) {
          await supabase.from('users').update({ subscription_tier: 'free' }).eq('id', userId);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  router,
  webhookHandler
};
