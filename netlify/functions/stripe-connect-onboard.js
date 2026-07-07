// collectors-market/netlify/functions/stripe-connect-onboard.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { email, storeName, returnOrigin } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing seller email.' }) };
    }

    const origin = returnOrigin || "http://localhost:8000";

    // 1. Create a Stripe Express Connected Account
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: storeName || 'Collectors Market Seller'
      }
    });

    // 2. Create the Account Link for secure Stripe hosted onboarding flow
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/#seller`,
      return_url: `${origin}/#seller`,
      type: 'account_onboarding'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stripeConnectId: account.id,
        onboardingUrl: accountLink.url
      })
    };
  } catch (error) {
    console.error('Stripe Connect Onboarding Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
