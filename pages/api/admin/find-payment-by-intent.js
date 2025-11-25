// API endpoint to find a payment record by Stripe payment intent ID
// Useful for debugging and linking payments to quotes
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { payment_intent_id } = req.query;

  if (!payment_intent_id) {
    return res.status(400).json({ error: 'payment_intent_id is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    // Find payment record in database
    const { data: paymentRecord } = await supabaseAdmin
      .from('payments')
      .select('*')
      .ilike('payment_notes', `%${payment_intent_id}%`)
      .single();

    // Find quote_selection with this payment intent
    const { data: quoteSelection } = await supabaseAdmin
      .from('quote_selections')
      .select('*, contact_submissions(contact_id)')
      .eq('payment_intent_id', payment_intent_id)
      .single();

    // Get lead/contact info
    let leadInfo = null;
    if (quoteSelection) {
      const { data: lead } = await supabaseAdmin
        .from('contacts')
        .select('id, first_name, last_name, email_address, event_date')
        .eq('id', quoteSelection.lead_id)
        .single();
      
      leadInfo = lead;
    }

    return res.status(200).json({
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000).toISOString(),
        metadata: paymentIntent.metadata
      },
      payment_record: paymentRecord || null,
      quote_selection: quoteSelection ? {
        lead_id: quoteSelection.lead_id,
        payment_status: quoteSelection.payment_status,
        deposit_amount: quoteSelection.deposit_amount,
        paid_at: quoteSelection.paid_at,
        contact_id: quoteSelection.contact_submissions?.contact_id
      } : null,
      lead_info: leadInfo,
      linked: !!(paymentRecord && quoteSelection),
      needs_sync: !paymentRecord || !quoteSelection
    });

  } catch (error) {
    console.error('Error finding payment:', error);
    return res.status(500).json({ 
      error: 'Failed to find payment',
      message: error.message
    });
  }
}

