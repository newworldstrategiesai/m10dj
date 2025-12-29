// Simple endpoint to sync a single payment from Stripe to the database
// Usage: POST /api/admin/sync-payment with { payment_intent_id: "pi_xxx" }
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Require admin authentication to sync payments
  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { payment_intent_id, transaction_id } = req.body;

  if (!payment_intent_id && !transaction_id) {
    return res.status(400).json({ error: 'Either payment_intent_id or transaction_id is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let paymentIntent;
    let paymentIntentId = payment_intent_id;

    // If transaction_id is provided, find the associated payment intent
    if (transaction_id && !payment_intent_id) {
      console.log('🔍 Retrieving balance transaction from Stripe:', transaction_id);
      const balanceTransaction = await stripe.balanceTransactions.retrieve(transaction_id);
      
      // Balance transactions have a source field that points to the payment intent
      if (balanceTransaction.source && balanceTransaction.source.startsWith('pi_')) {
        paymentIntentId = balanceTransaction.source;
        console.log('✅ Found payment intent from balance transaction:', paymentIntentId);
      } else if (balanceTransaction.source) {
        // Try to retrieve the source object
        try {
          const source = await stripe.paymentIntents.retrieve(balanceTransaction.source);
          if (source) {
            paymentIntentId = source.id;
            console.log('✅ Found payment intent from source:', paymentIntentId);
          }
        } catch (e) {
          // Source might not be a payment intent
          console.log('⚠️ Source is not a payment intent:', balanceTransaction.source);
        }
      }
    }

    // Retrieve payment intent from Stripe
    console.log('🔍 Retrieving payment intent from Stripe:', paymentIntentId);
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ 
        error: `Payment intent status is ${paymentIntent.status}, not succeeded`,
        status: paymentIntent.status
      });
    }

    const paymentAmount = paymentIntent.amount / 100;
    const paymentType = paymentIntent.metadata?.payment_type || 'deposit';
    const leadId = paymentIntent.metadata?.lead_id || paymentIntent.metadata?.leadId;

    if (!leadId) {
      return res.status(400).json({ 
        error: 'lead_id not found in payment intent metadata',
        metadata: paymentIntent.metadata,
        suggestion: 'The payment may have been created before we added metadata tracking. You may need to manually link it.'
      });
    }

    console.log('📋 Payment details:', {
      amount: paymentAmount,
      paymentType,
      leadId,
      metadata: paymentIntent.metadata
    });

    // Find the contact_id from the lead_id
    let contactId = leadId;
    
    // Try to find via quote_selections -> contact_submissions
    console.log('🔗 Finding contact_id for lead_id:', leadId);
    const { data: quoteSelection, error: quoteError } = await supabaseAdmin
      .from('quote_selections')
      .select('contact_submission_id')
      .eq('lead_id', leadId)
      .single();
    
    if (quoteError && quoteError.code !== 'PGRST116') {
      console.error('Error finding quote selection:', quoteError);
    }
    
    if (quoteSelection?.contact_submission_id) {
      const { data: submission } = await supabaseAdmin
        .from('contact_submissions')
        .select('contact_id')
        .eq('id', quoteSelection.contact_submission_id)
        .single();
      
      if (submission?.contact_id) {
        contactId = submission.contact_id;
        console.log('✅ Found contact_id via quote_selections:', contactId);
      }
    }

    // Check if payment record already exists
    console.log('🔍 Checking for existing payment record...');
    const { data: existingPayment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .ilike('payment_notes', `%${payment_intent_id}%`)
      .maybeSingle();

    if (existingPayment) {
      console.log('ℹ️ Payment record already exists:', existingPayment.id);
      return res.status(200).json({
        message: 'Payment record already exists',
        payment: existingPayment,
        payment_intent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentAmount,
          metadata: paymentIntent.metadata
        },
        already_linked: true
      });
    }

    // Create payment record
    console.log('💾 Creating payment record...');
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
      console.error('❌ Error creating payment record:', paymentError);
      if (paymentError.code === '23505') {
        return res.status(200).json({
          message: 'Payment record already exists (duplicate key)',
          error: paymentError.message
        });
      }
      return res.status(500).json({ 
        error: 'Failed to create payment record',
        details: paymentError
      });
    }

    console.log('✅ Payment record created:', newPayment.id);

    // Update quote_selections
    console.log('📝 Updating quote_selections...');
    const { error: quoteUpdateError } = await supabaseAdmin
      .from('quote_selections')
      .update({
        payment_status: paymentType === 'full' ? 'paid' : 'partial',
        payment_intent_id: payment_intent_id,
        deposit_amount: paymentType === 'deposit' ? paymentAmount : null,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId);

    if (quoteUpdateError) {
      console.error('⚠️ Error updating quote_selections:', quoteUpdateError);
    } else {
      console.log('✅ Quote selection updated');
    }

    return res.status(200).json({
      success: true,
      message: 'Payment synced successfully',
      payment: newPayment,
      payment_intent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentAmount,
        currency: paymentIntent.currency,
        created: new Date(paymentIntent.created * 1000).toISOString(),
        metadata: paymentIntent.metadata
      },
      lead_id: leadId,
      contact_id: contactId,
      payment_type: paymentType
    });

  } catch (error) {
    console.error('❌ Error syncing payment:', error);
    return res.status(500).json({ 
      error: 'Failed to sync payment',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

