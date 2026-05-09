const Stripe = require('stripe');
require('dotenv').config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Ensure stable API version
});

const config = {
  priceIds: {
    creator: null,
    pro: null
  }
};

async function initStripeProducts() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'your_stripe_secret_key') {
    console.log('Skipping Stripe initialization (no valid STRIPE_SECRET_KEY)');
    return;
  }

  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    
    let creatorProduct = products.data.find(p => p.name === 'Creator Tier');
    if (!creatorProduct) {
      creatorProduct = await stripe.products.create({ name: 'Creator Tier' });
    }
    
    let proProduct = products.data.find(p => p.name === 'Pro Tier');
    if (!proProduct) {
      proProduct = await stripe.products.create({ name: 'Pro Tier' });
    }

    const prices = await stripe.prices.list({ active: true, limit: 100 });
    
    let creatorPrice = prices.data.find(p => p.product === creatorProduct.id && p.unit_amount === 1200);
    if (!creatorPrice) {
      creatorPrice = await stripe.prices.create({
        product: creatorProduct.id,
        unit_amount: 1200,
        currency: 'usd',
        recurring: { interval: 'month' }
      });
    }
    config.priceIds.creator = creatorPrice.id;

    let proPrice = prices.data.find(p => p.product === proProduct.id && p.unit_amount === 2900);
    if (!proPrice) {
      proPrice = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 2900,
        currency: 'usd',
        recurring: { interval: 'month' }
      });
    }
    config.priceIds.pro = proPrice.id;

    console.log('Stripe products configured.');
  } catch (err) {
    console.error('Failed to init Stripe products:', err.message);
  }
}

module.exports = {
  stripe,
  config,
  initStripeProducts
};
