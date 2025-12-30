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
        const leadId = session.metadata?.lead_id || session.metadata?.leadId;
        const requestId = session.metadata?.request_id;

        // Handle quote/lead payment from checkout session
        if (leadId) {
          const paymentAmount = session.amount_total / 100;
          const paymentType = session.metadata?.payment_type || 'deposit';
          
          // Extract gratuity information from metadata
          const gratuityAmount = session.metadata?.gratuity_amount ? parseFloat(session.metadata.gratuity_amount) : 0;
          const gratuityType = session.metadata?.gratuity_type || null;
          const gratuityPercentage = session.metadata?.gratuity_percentage ? parseInt(session.metadata.gratuity_percentage) : null;
          
          // Find the contact_id from the lead_id
          let contactId = leadId;
          
          // Try to find contact_id via quote_selections -> contact_submissions
          const { data: quoteSelection } = await supabase
            .from('quote_selections')
            .select('contact_submission_id')
            .eq('lead_id', leadId)
            .single();
          
          if (quoteSelection?.contact_submission_id) {
            const { data: submission } = await supabase
              .from('contact_submissions')
              .select('contact_id')
              .eq('id', quoteSelection.contact_submission_id)
              .single();
            
            if (submission?.contact_id) {
              contactId = submission.contact_id;
            }
          }
          
          // Update quote_selections
          await supabase
            .from('quote_selections')
            .update({
              payment_status: paymentType === 'full' ? 'paid' : 'partial',
              payment_intent_id: session.payment_intent || session.id,
              deposit_amount: paymentType === 'deposit' ? paymentAmount : null,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('lead_id', leadId);

          // Build payment notes with gratuity info if applicable
          let paymentNotes = `Stripe Payment Intent: ${session.payment_intent || session.id}`;
          if (gratuityAmount > 0) {
            if (gratuityType === 'percentage' && gratuityPercentage) {
              paymentNotes += ` | Gratuity: ${gratuityPercentage}% ($${gratuityAmount.toFixed(2)})`;
            } else {
              paymentNotes += ` | Gratuity: $${gratuityAmount.toFixed(2)}`;
            }
          }

          // Create payment record in payments table
          const paymentRecord = {
            contact_id: contactId,
            payment_name: paymentType === 'deposit' ? 'Deposit' : 'Full Payment',
            total_amount: paymentAmount,
            gratuity: gratuityAmount,
            payment_status: 'Paid',
            payment_method: 'Credit Card',
            transaction_date: new Date().toISOString().split('T')[0], // Date only
            payment_notes: paymentNotes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: paymentError } = await supabase
            .from('payments')
            .insert(paymentRecord);

          if (paymentError) {
            console.error('⚠️ Error creating payment record from checkout session:', paymentError);
            if (paymentError.code !== '23505') { // Ignore duplicate key errors
              console.error('Payment record error details:', paymentError);
            }
          } else {
            console.log('✅ Payment record created from checkout session for lead:', leadId);
          }

          // Send client payment confirmation notification
          (async () => {
            try {
              const { notifyPaymentReceived } = await import('../../../utils/client-notifications');
              await notifyPaymentReceived(leadId, {
                amount: paymentAmount,
                payment_type: paymentType,
                payment_intent_id: session.payment_intent || session.id
              });
            } catch (err) {
              console.error('Error sending payment confirmation to client:', err);
            }
          })();
        }

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
          
          // Get request data before updating (for notifications)
          const { data: requestDataBeforeUpdate } = await supabase
            .from('crowd_requests')
            .select('*, organization_id')
            .eq('id', requestId)
            .single();

          const { error: updateError } = await supabase
            .from('crowd_requests')
            .update(updateData)
            .eq('id', requestId);

          if (updateError) {
            console.error('⚠️ Error updating crowd request:', updateError);
          } else {
            console.log('✅ Crowd request payment processed:', requestId);
            
            // Also update any bundle requests with the same payment_code
            // Bundle songs should be marked as paid when the main payment succeeds
            if (requestDataBeforeUpdate?.payment_code) {
              const bundleUpdateData = {
                payment_status: 'paid',
                payment_intent_id: session.payment_intent || session.id,
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                payment_method: 'card'
              };
              
              // Update customer info on bundle songs too
              if (customerEmail) bundleUpdateData.requester_email = customerEmail;
              if (customerName && !session.metadata?.requester_name) bundleUpdateData.requester_name = customerName;
              if (customerPhone) bundleUpdateData.requester_phone = customerPhone;
              
              const { error: bundleError, count: bundleCount } = await supabase
                .from('crowd_requests')
                .update(bundleUpdateData)
                .eq('payment_code', requestDataBeforeUpdate.payment_code)
                .neq('id', requestId); // Don't update the main request again
              
              if (bundleError) {
                console.error('⚠️ Error updating bundle requests:', bundleError);
              } else {
                console.log(`✅ Updated bundle requests with payment_code ${requestDataBeforeUpdate.payment_code}`);
              }
            }
            
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

            // Notify DJ of payment (non-blocking)
            if (requestDataBeforeUpdate?.organization_id) {
              (async () => {
                try {
                  const { notifyDJOfPayment } = await import('../../../utils/dj-payment-notifications');
                  
                  // Get organization to check if using Connect (for payout amount calculation)
                  const { data: org } = await supabase
                    .from('organizations')
                    .select('stripe_connect_account_id, platform_fee_percentage, platform_fee_fixed')
                    .eq('id', requestDataBeforeUpdate.organization_id)
                    .single();

                  let payoutAmount, platformFee;
                  if (org?.stripe_connect_account_id) {
                    // Calculate payout if using Connect
                    const feePercentage = org.platform_fee_percentage || 3.50;
                    const feeFixed = org.platform_fee_fixed || 0.30;
                    const feeAmount = (paymentAmount * feePercentage / 100) + feeFixed;
                    platformFee = feeAmount;
                    payoutAmount = paymentAmount - feeAmount;
                  }

                  await notifyDJOfPayment({
                    organizationId: requestDataBeforeUpdate.organization_id,
                    amount: paymentAmount,
                    requestId: requestId,
                    requestType: requestDataBeforeUpdate.request_type,
                    requesterName: requestDataBeforeUpdate.requester_name || 'Customer',
                    songTitle: requestDataBeforeUpdate.song_title,
                    songArtist: requestDataBeforeUpdate.song_artist,
                    recipientName: requestDataBeforeUpdate.recipient_name,
                    payoutAmount,
                    platformFee,
                  });
                } catch (err) {
                  console.error('Error sending DJ payment notification:', err);
                }
              })();
            }
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
        const leadIdFromIntent = paymentIntent.metadata.lead_id || paymentIntent.metadata.leadId;
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
          const paymentAmount = paymentIntent.amount / 100;
          const paymentType = paymentIntent.metadata.payment_type || 'deposit';
          
          // First, find the contact_id from the lead_id
          // The lead_id could be a contact_id directly, or we need to find it via quote_selections
          let contactId = leadIdFromIntent;
          
          // Try to find contact_id via quote_selections -> contact_submissions
          const { data: quoteSelection } = await supabaseForPaymentIntent
            .from('quote_selections')
            .select('contact_submission_id')
            .eq('lead_id', leadIdFromIntent)
            .single();
          
          if (quoteSelection?.contact_submission_id) {
            const { data: submission } = await supabaseForPaymentIntent
              .from('contact_submissions')
              .select('contact_id')
              .eq('id', quoteSelection.contact_submission_id)
              .single();
            
            if (submission?.contact_id) {
              contactId = submission.contact_id;
            }
          }
          
          // Update quote_selections
          const { error: quoteError } = await supabaseForPaymentIntent
            .from('quote_selections')
            .update({
              payment_status: paymentType === 'full' ? 'paid' : 'partial',
              payment_intent_id: paymentIntent.id,
              deposit_amount: paymentType === 'deposit' ? paymentAmount : null,
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('lead_id', leadIdFromIntent);

          if (quoteError) {
            console.error('⚠️ Error updating quote_selections:', quoteError);
          }

          // Create payment record in payments table
          const paymentRecord = {
            contact_id: contactId,
            payment_name: paymentType === 'deposit' ? 'Deposit' : 'Full Payment',
            total_amount: paymentAmount,
            payment_status: 'Paid',
            payment_method: 'Credit Card',
            transaction_date: new Date().toISOString().split('T')[0], // Date only
            payment_notes: `Stripe Payment Intent: ${paymentIntent.id}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: paymentError, data: insertedPayment } = await supabaseForPaymentIntent
            .from('payments')
            .insert(paymentRecord)
            .select()
            .single();

          if (paymentError) {
            console.error('⚠️ Error creating payment record:', paymentError);
            // Check if payment already exists (duplicate webhook)
            if (paymentError.code === '23505') { // Unique constraint violation
              console.log('ℹ️ Payment record already exists, skipping insert');
            }
          } else {
            console.log('✅ Payment record created:', insertedPayment?.id);
          }

          console.log('✅ Database updated for lead:', leadIdFromIntent);
          
          // Notify admin about payment (non-blocking)
          (async () => {
            try {
              const { sendAdminNotification } = await import('../../../utils/admin-notifications');
              const { data: contactData } = await supabaseForPaymentIntent
                .from('contacts')
                .select('id, first_name, last_name')
                .eq('id', contactId)
                .single();
              
              const { data: payments } = await supabaseForPaymentIntent
                .from('payments')
                .select('total_amount')
                .eq('contact_id', contactId)
                .eq('payment_status', 'Paid');
              
              const totalPaid = payments?.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0) || 0;
              
              sendAdminNotification('payment_made', {
                leadId: leadIdFromIntent,
                contactId: contactId,
                leadName: contactData ? `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim() : 'Client',
                amount: paymentAmount,
                totalPaid: totalPaid,
                remaining: (paymentIntent.metadata.totalPrice ? parseFloat(paymentIntent.metadata.totalPrice) - totalPaid : 0)
              }).catch(err => console.error('Failed to notify admin:', err));
            } catch (err) {
              console.error('Error sending payment notification:', err);
            }
          })();

          // Send client payment confirmation notification
          (async () => {
            try {
              const { notifyPaymentReceived } = await import('../../../utils/client-notifications');
              await notifyPaymentReceived(leadIdFromIntent, {
                amount: paymentAmount,
                payment_type: paymentType,
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
