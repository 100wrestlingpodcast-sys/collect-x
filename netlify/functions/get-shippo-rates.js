// collectors-market/netlify/functions/get-shippo-rates.js
const shippo = require('shippo')(process.env.SHIPPO_API_KEY);

exports.handler = async (event, context) => {
  // CORS Headers
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
    const { parcel, fromAddress, toAddress } = JSON.parse(event.body);

    if (!fromAddress || !toAddress) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing address details.' }) };
    }

    // Call Shippo API to create a shipment
    const shipment = await shippo.shipment.create({
      address_from: {
        name: fromAddress.name || "GEEK STORE",
        street1: fromAddress.street,
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country || 'US',
        phone: fromAddress.phone || "5555555555"
      },
      address_to: {
        name: toAddress.name,
        street1: toAddress.street,
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country || 'US',
        phone: toAddress.phone
      },
      parcels: [{
        length: parcel.length || 6,
        width: parcel.width || 5,
        height: parcel.height || 4,
        distance_unit: 'in',
        weight: parcel.weight || 8,
        mass_unit: 'oz'
      }],
      async: false
    });

    // Format the rates to match the frontend expectations
    const formattedRates = shipment.rates.map(r => ({
      id: r.object_id,
      carrier: r.provider,
      service: r.servicelevel.name,
      shipping_cost: parseFloat(r.amount),
      days: r.days,
      tier: r.duration_terms || (r.days <= 2 ? 'Express' : 'Ground'),
      insurance_cost: parseFloat(r.insurance_amount || 0),
      notes: r.messages && r.messages[0] ? r.messages[0].text : ''
    }));

    // Sort rates by cheapest first
    formattedRates.sort((a, b) => a.shipping_cost - b.shipping_cost);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        shipment_id: shipment.object_id,
        rates: formattedRates,
        recommended_rate_id: formattedRates[0] ? formattedRates[0].id : null,
        insurance_suggested: parcel.declared_value >= 100 || parcel.category === "Autografiados",
        fragile_warning: parcel.fragile
      })
    };
  } catch (error) {
    console.error('Shippo Endpoint Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
