// collectors-market/netlify/functions/create-payment-intent.js
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
    const { amount, applicationFeeAmount, sellerStripeAccountId, description, itemsSubtotal } = JSON.parse(event.body);

    if (!amount || amount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount.' }) };
    }

    const paymentIntentConfig = {
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd',
      description: description || 'Collectors Market Purchase',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    };

    // Set destination Connected Account details if it's a seller transaction
    if (sellerStripeAccountId && sellerStripeAccountId.startsWith('acct_')) {
      if (itemsSubtotal === undefined) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing itemsSubtotal for application fee validation.' }) };
      }
      const calculatedFee = parseFloat((itemsSubtotal * 0.05).toFixed(2));
      if (Math.abs(calculatedFee - applicationFeeAmount) > 0.02) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Security alert: Application fee amount mismatch.' }) };
      }

      paymentIntentConfig.application_fee_amount = Math.round((applicationFeeAmount || 0) * 100);
      paymentIntentConfig.transfer_data = {
        destination: sellerStripeAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentConfig);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    };
  } catch (error) {
    console.error('Stripe Payment Confirmation Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
