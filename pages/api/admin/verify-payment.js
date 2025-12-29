// API endpoint to verify and manually create payment record if missing
// This is useful for troubleshooting payments that didn't get recorded
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Require admin authentication to verify payments
  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { payment_intent_id, lead_id } = req.body;

  if (!payment_intent_id) {
    return res.status(400).json({ error: 'payment_intent_id is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: `Payment intent status is ${paymentIntent.status}, not succeeded`,
        status: paymentIntent.status
      });
    }

    const paymentAmount = paymentIntent.amount / 100;
    const paymentType = paymentIntent.metadata?.payment_type || 'deposit';
    const leadId = lead_id || paymentIntent.metadata?.lead_id || paymentIntent.metadata?.leadId;

    if (!leadId) {
      return res.status(400).json({ 
        error: 'lead_id not found in payment intent metadata. Please provide lead_id in request body.',
        metadata: paymentIntent.metadata
      });
    }

    // Find the contact_id from the lead_id
    let contactId = leadId;
    
    // Try to find via quote_selections -> contact_submissions
    const { data: quoteSelection } = await supabaseAdmin
      .from('quote_selections')
      .select('contact_submission_id')
      .eq('lead_id', leadId)
      .single();
    
    if (quoteSelection?.contact_submission_id) {
      const { data: submission } = await supabaseAdmin
        .from('contact_submissions')
        .select('contact_id')
        .eq('id', quoteSelection.contact_submission_id)
        .single();
      
      if (submission?.contact_id) {
        contactId = submission.contact_id;
      }
    }

    // Check if payment record already exists
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('payment_notes', `Stripe Payment Intent: ${payment_intent_id}`)
      .single();

    if (existingPayment) {
      return res.status(200).json({
        message: 'Payment record already exists',
        payment: existingPayment,
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentAmount,
          metadata: paymentIntent.metadata
        }
      });
    }

    // Create payment record
    const paymentRecord = {
      contact_id: contactId,
      payment_name: paymentType === 'deposit' ? 'Deposit' : 'Full Payment',
      total_amount: paymentAmount,
      payment_status: 'Paid',
      payment_method: 'Credit Card',
      transaction_date: new Date(paymentIntent.created * 1000).toISOString().split('T')[0],
      payment_notes: `Stripe Payment Intent: ${payment_intent_id}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newPayment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return res.status(500).json({ 
        error: 'Failed to create payment record',
        details: paymentError
      });
    }

    // Update quote_selections
    await supabaseAdmin
      .from('quote_selections')
      .update({
        payment_status: paymentType === 'full' ? 'paid' : 'partial',
        payment_intent_id: payment_intent_id,
        deposit_amount: paymentType === 'deposit' ? paymentAmount : null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId);

    return res.status(200).json({
      message: 'Payment record created successfully',
      payment: newPayment,
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentAmount,
        metadata: paymentIntent.metadata
      },
      lead_id: leadId,
      contact_id: contactId
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      error: 'Failed to verify payment',
      message: error.message
    });
  }
}

