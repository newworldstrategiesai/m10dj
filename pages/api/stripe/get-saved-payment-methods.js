/**
 * Get saved payment methods for a contact/lead
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId } = req.query;

  if (!leadId) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get contact's Stripe customer ID
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('stripe_customer_id')
      .eq('id', leadId)
      .single();

    if (contactError || !contact?.stripe_customer_id) {
      return res.status(200).json({ paymentMethods: [] });
    }

    // Get saved payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: contact.stripe_customer_id,
      type: 'card'
    });

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year
      }
    }));

    res.status(200).json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error('Error fetching saved payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch saved payment methods' });
  }
}

