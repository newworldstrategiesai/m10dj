// API endpoint to sync Stripe payments with existing quotes
// This will fetch payments from Stripe and create/update payment records in the database
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

  const { 
    payment_intent_id, 
    lead_id, 
    days_back = 7, // Default to last 7 days
    limit = 100 
  } = req.body;

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    let paymentIntents = [];

    if (payment_intent_id) {
      // Sync specific payment intent
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        if (paymentIntent.status === 'succeeded') {
          paymentIntents = [paymentIntent];
        } else {
          return res.status(400).json({ 
            error: `Payment intent status is ${paymentIntent.status}, not succeeded`,
            status: paymentIntent.status
          });
        }
      } catch (error) {
        return res.status(400).json({ 
          error: 'Failed to retrieve payment intent',
          message: error.message
        });
      }
    } else if (lead_id) {
      // Find payment intents for a specific lead by checking quote_selections
      const { data: quoteSelection } = await supabaseAdmin
        .from('quote_selections')
        .select('payment_intent_id')
        .eq('lead_id', lead_id)
        .not('payment_intent_id', 'is', null)
        .single();

      if (quoteSelection?.payment_intent_id) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(quoteSelection.payment_intent_id);
          if (paymentIntent.status === 'succeeded') {
            paymentIntents = [paymentIntent];
          }
        } catch (error) {
          return res.status(400).json({ 
            error: 'Failed to retrieve payment intent',
            message: error.message
          });
        }
      } else {
        return res.status(404).json({ 
          error: 'No payment intent found for this lead_id',
          lead_id
        });
      }
    } else {
      // Sync recent payments from Stripe
      const since = Math.floor((Date.now() - days_back * 24 * 60 * 60 * 1000) / 1000);
      
      try {
        const allIntents = await stripe.paymentIntents.list({
          limit: limit,
          created: { gte: since }
        });
        
        // Filter for succeeded payments
        paymentIntents = allIntents.data.filter(pi => pi.status === 'succeeded');
      } catch (error) {
        return res.status(500).json({ 
          error: 'Failed to fetch payment intents from Stripe',
          message: error.message
        });
      }
    }

    // Process each payment intent
    for (const paymentIntent of paymentIntents) {
      try {
        results.processed++;
        
        const paymentAmount = paymentIntent.amount / 100;
        const paymentType = paymentIntent.metadata?.payment_type || 'deposit';
        const leadId = paymentIntent.metadata?.lead_id || paymentIntent.metadata?.leadId;

        if (!leadId) {
          results.skipped++;
          results.errors.push({
            payment_intent_id: paymentIntent.id,
            reason: 'No lead_id in metadata',
            metadata: paymentIntent.metadata
          });
          continue;
        }

        // Find the contact_id from the lead_id
        let contactId = leadId;
        
        // Try to find via quote_selections -> contact_submissions
        const { data: quoteSelection } = await supabaseAdmin
          .from('quote_selections')
          .select('contact_submission_id, payment_intent_id')
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
          .ilike('payment_notes', `%${paymentIntent.id}%`)
          .single();

        if (existingPayment) {
          // Update existing payment if needed
          const needsUpdate = 
            existingPayment.payment_status !== 'Paid' ||
            existingPayment.total_amount !== paymentAmount ||
            existingPayment.contact_id !== contactId;

          if (needsUpdate) {
            await supabaseAdmin
              .from('payments')
              .update({
                payment_status: 'Paid',
                total_amount: paymentAmount,
                contact_id: contactId,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPayment.id);
            
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // Create new payment record
          const paymentRecord = {
            contact_id: contactId,
            payment_name: paymentType === 'deposit' ? 'Deposit' : 'Full Payment',
            total_amount: paymentAmount,
            payment_status: 'Paid',
            payment_method: 'Credit Card',
            transaction_date: new Date(paymentIntent.created * 1000).toISOString().split('T')[0],
            payment_notes: `Stripe Payment Intent: ${paymentIntent.id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newPayment, error: paymentError } = await supabaseAdmin
            .from('payments')
            .insert(paymentRecord)
            .select()
            .single();

          if (paymentError) {
            if (paymentError.code === '23505') {
              // Duplicate key - payment already exists with different identifier
              results.skipped++;
            } else {
              throw paymentError;
            }
          } else {
            results.created++;
          }
        }

        // Update quote_selections with payment status
        if (quoteSelection) {
          await supabaseAdmin
            .from('quote_selections')
            .update({
              payment_status: paymentType === 'full' ? 'paid' : 'partial',
              payment_intent_id: paymentIntent.id,
              deposit_amount: paymentType === 'deposit' ? paymentAmount : null,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('lead_id', leadId);
        }

      } catch (error) {
        console.error(`Error processing payment intent ${paymentIntent.id}:`, error);
        results.errors.push({
          payment_intent_id: paymentIntent.id,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      summary: results,
      message: `Processed ${results.processed} payment(s). Created ${results.created}, updated ${results.updated}, skipped ${results.skipped}.`
    });

  } catch (error) {
    console.error('Error syncing Stripe payments:', error);
    return res.status(500).json({ 
      error: 'Failed to sync payments',
      message: error.message
    });
  }
}

