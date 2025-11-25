/**
 * Create a SetupIntent to save payment method without charging
 * This allows clients to save their card for future payments
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { createOrRetrieveStripeCustomer } = require('../../../utils/stripe-customer');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId } = req.body;

  if (!leadId) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get contact info
    const { data: contact } = await supabase
      .from('contacts')
      .select('email_address, first_name, last_name')
      .eq('id', leadId)
      .single();

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const customerName = contact.first_name && contact.last_name 
      ? `${contact.first_name} ${contact.last_name}`.trim()
      : contact.first_name || contact.last_name || null;

    // Create or retrieve Stripe customer
    const stripeCustomerId = await createOrRetrieveStripeCustomer(
      leadId,
      contact.email_address,
      customerName
    );

    // Create SetupIntent to save payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      usage: 'off_session', // For future, automatic charges
      payment_method_types: ['card'],
      metadata: {
        lead_id: leadId
      }
    });

    res.status(200).json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    });
  } catch (error) {
    console.error('Error creating SetupIntent:', error);
    res.status(500).json({ error: 'Failed to create setup intent', message: error.message });
  }
}

