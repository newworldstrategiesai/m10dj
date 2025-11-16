import { createClient } from '@supabase/supabase-js';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const rawBody = await getRawBody(req);
    
    // Verify webhook signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
  switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          metadata: paymentIntent.metadata,
          timestamp: new Date().toISOString()
        });

        // Update database
        const supabase = createClient(supabaseUrl, supabaseKey);
        const leadId = paymentIntent.metadata.leadId;

        if (leadId) {
          const { error } = await supabase
            .from('quote_selections')
      .update({
              payment_status: 'deposit_paid',
              payment_intent_id: paymentIntent.id,
              deposit_amount: paymentIntent.amount / 100,
              paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
            .eq('lead_id', leadId);

          if (error) {
            console.error('⚠️ Error updating database:', error);
          } else {
            console.log('✅ Database updated for lead:', leadId);
            
            // Notify admin about payment (non-blocking)
            (async () => {
              try {
                const { sendAdminNotification } = await import('../../../utils/admin-notifications');
                const { data: contactData } = await supabase
                  .from('contacts')
                  .select('id, first_name, last_name')
                  .eq('id', leadId)
                  .single();
                
                const { data: payments } = await supabase
                  .from('payments')
                  .select('total_amount')
                  .eq('contact_id', leadId)
                  .eq('payment_status', 'Paid');
                
                const totalPaid = payments?.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0) || 0;
                const paymentAmount = paymentIntent.amount / 100;
                
                sendAdminNotification('payment_made', {
                  leadId: leadId,
                  contactId: leadId,
                  leadName: contactData ? `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() : 'Client',
                  amount: paymentAmount,
                  totalPaid: totalPaid,
                  remaining: (paymentIntent.metadata.totalPrice ? parseFloat(paymentIntent.metadata.totalPrice) - totalPaid : 0)
                }).catch(err => console.error('Failed to notify admin:', err));
              } catch (err) {
                console.error('Error sending payment notification:', err);
              }
            })();
          }

          // TODO: Send confirmation email here
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('❌ Payment failed:', {
          id: failedPayment.id,
          error: failedPayment.last_payment_error,
          timestamp: new Date().toISOString()
        });
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}
