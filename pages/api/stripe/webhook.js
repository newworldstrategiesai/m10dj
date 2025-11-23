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
      case 'checkout.session.completed':
        // This event has complete customer information from Stripe Checkout
        const session = event.data.object;
        console.log('💰 Checkout completed:', {
          id: session.id,
          amount: session.amount_total / 100,
          customer_email: session.customer_email,
          customer_details: session.customer_details,
          metadata: session.metadata,
          timestamp: new Date().toISOString()
        });

        // Update database
        const supabase = createClient(supabaseUrl, supabaseKey);
        const leadId = session.metadata?.leadId;
        const requestId = session.metadata?.request_id;

        // Handle crowd request payment
        if (requestId) {
          const paymentAmount = session.amount_total / 100;
          
          // Extract customer information from checkout session
          const customerEmail = session.customer_email || session.customer_details?.email;
          const customerName = session.customer_details?.name;
          const customerPhone = session.customer_details?.phone;
          
          const updateData = {
            payment_status: 'paid',
            payment_intent_id: session.payment_intent || session.id,
            amount_paid: session.amount_total, // Store in cents
            paid_at: new Date().toISOString(),
            status: 'acknowledged',
            updated_at: new Date().toISOString(),
            payment_method: 'card'
          };

          // Update customer information if available and not already set
          if (customerEmail) {
            updateData.requester_email = customerEmail;
          }
          if (customerName && !session.metadata?.requester_name) {
            updateData.requester_name = customerName;
          }
          if (customerPhone) {
            updateData.requester_phone = customerPhone;
          }
          
          const { error: updateError } = await supabase
            .from('crowd_requests')
            .update(updateData)
            .eq('id', requestId);

          if (updateError) {
            console.error('⚠️ Error updating crowd request:', updateError);
          } else {
            console.log('✅ Crowd request payment processed:', requestId);
            
            // Notify admin about crowd request payment (non-blocking)
            (async () => {
              try {
                const { sendAdminNotification } = await import('../../../utils/admin-notifications');
                const { data: requestData } = await supabase
                  .from('crowd_requests')
                  .select('*')
                  .eq('id', requestId)
                  .single();
                
                if (requestData) {
                  const requestTypeLabel = requestData.request_type === 'song_request' ? 'Song Request' : 'Shoutout';
                  const requestDetail = requestData.request_type === 'song_request'
                    ? `${requestData.song_title}${requestData.song_artist ? ` by ${requestData.song_artist}` : ''}`
                    : `For ${requestData.recipient_name}`;
                  
                  sendAdminNotification('crowd_request_payment', {
                    requestId: requestId,
                    requestType: requestTypeLabel,
                    requestDetail: requestDetail,
                    requesterName: requestData.requester_name,
                    amount: paymentAmount,
                    eventCode: requestData.event_qr_code
                  }).catch(err => console.error('Failed to notify admin:', err));
                }
              } catch (err) {
                console.error('Error sending crowd request notification:', err);
              }
            })();
          }
        }
        break;

      case 'payment_intent.succeeded':
        // Fallback for direct payment intents (not from Checkout)
        const paymentIntent = event.data.object;
        console.log('💰 Payment succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          metadata: paymentIntent.metadata,
          timestamp: new Date().toISOString()
        });

        // Update database
        const supabaseForPaymentIntent = createClient(supabaseUrl, supabaseKey);
        const leadIdFromIntent = paymentIntent.metadata.leadId;
        const requestIdFromIntent = paymentIntent.metadata.request_id;

        // Handle crowd request payment
        if (requestIdFromIntent) {
          const paymentAmount = paymentIntent.amount / 100;
          
          const { error: updateError } = await supabaseForPaymentIntent
            .from('crowd_requests')
            .update({
              payment_status: 'paid',
              payment_intent_id: paymentIntent.id,
              amount_paid: paymentIntent.amount, // Store in cents
              paid_at: new Date().toISOString(),
              status: 'acknowledged',
              updated_at: new Date().toISOString()
            })
            .eq('id', requestIdFromIntent);

          if (updateError) {
            console.error('⚠️ Error updating crowd request:', updateError);
          } else {
            console.log('✅ Crowd request payment processed:', requestIdFromIntent);
            
            // Notify admin about crowd request payment (non-blocking)
            (async () => {
              try {
                const { sendAdminNotification } = await import('../../../utils/admin-notifications');
                const { data: requestData } = await supabaseForPaymentIntent
                  .from('crowd_requests')
                  .select('*')
                  .eq('id', requestIdFromIntent)
                  .single();
                
                if (requestData) {
                  const requestTypeLabel = requestData.request_type === 'song_request' ? 'Song Request' : 'Shoutout';
                  const requestDetail = requestData.request_type === 'song_request'
                    ? `${requestData.song_title}${requestData.song_artist ? ` by ${requestData.song_artist}` : ''}`
                    : `For ${requestData.recipient_name}`;
                  
                  sendAdminNotification('crowd_request_payment', {
                    requestId: requestIdFromIntent,
                    requestType: requestTypeLabel,
                    requestDetail: requestDetail,
                    requesterName: requestData.requester_name,
                    amount: paymentAmount,
                    eventCode: requestData.event_qr_code
                  }).catch(err => console.error('Failed to notify admin:', err));
                }
              } catch (err) {
                console.error('Error sending crowd request notification:', err);
              }
            })();
          }
        }

        // Handle quote/lead payment
        if (leadIdFromIntent) {
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
            console.log('✅ Database updated for lead:', leadIdFromIntent);
            
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

          // Send client payment confirmation notification
          (async () => {
            try {
              const { notifyPaymentReceived } = await import('../../../utils/client-notifications');
              await notifyPaymentReceived(leadId, {
                amount: paymentAmount,
                payment_type: paymentIntent.metadata.payment_type || 'deposit',
                payment_intent_id: paymentIntent.id
              });
            } catch (err) {
              console.error('Error sending payment confirmation to client:', err);
            }
          })();
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
