/**
 * Verify Stripe Payment
 * Get payment details after successful checkout
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get invoice details from metadata
    const invoiceId = session.metadata.invoice_id;
    const invoiceNumber = session.metadata.invoice_number;

    // Get invoice from database
    let invoiceData = null;
    if (invoiceId) {
      const { data } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, status')
        .eq('id', invoiceId)
        .single();
      
      invoiceData = data;
    }

    res.status(200).json({
      success: true,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber || invoiceData?.invoice_number,
      amount: session.amount_total / 100,
      transaction_id: session.payment_intent,
      customer_email: session.customer_email,
      payment_status: session.payment_status,
      status: invoiceData?.status || 'processing'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message
    });
  }
}

