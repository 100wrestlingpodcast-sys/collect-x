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
    const { amount, applicationFeeAmount, sellerStripeAccountId, card, description } = JSON.parse(event.body);

    if (!amount || amount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid amount.' }) };
    }

    let paymentMethodId = null;

    // Create payment method on the server if card details are passed
    if (card && card.number) {
      const parts = card.expiry.split('/');
      const exp_month = parseInt(parts[0]);
      const exp_year = parseInt(parts[1]);

      // Handle two-digit year (e.g. "28" -> 2028)
      const currentYearPrefix = Math.floor(new Date().getFullYear() / 100) * 100;
      const full_exp_year = exp_year < 100 ? currentYearPrefix + exp_year : exp_year;

      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: card.number.replace(/\s+/g, ''),
          exp_month: exp_month,
          exp_year: full_exp_year,
          cvc: card.cvc,
        },
      });
      paymentMethodId = paymentMethod.id;
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

    if (paymentMethodId) {
      paymentIntentConfig.payment_method = paymentMethodId;
      paymentIntentConfig.confirm = true;
    }

    // Set destination Connected Account details if it's a seller transaction
    if (sellerStripeAccountId && sellerStripeAccountId.startsWith('acct_')) {
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
        success: paymentIntent.status === 'succeeded',
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
