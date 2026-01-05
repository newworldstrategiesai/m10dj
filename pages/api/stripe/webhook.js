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
        const organizationId = session.metadata?.organization_id;

        // Handle subscription checkout
        if (session.mode === 'subscription' && organizationId && session.subscription) {
          console.log('📦 Subscription checkout completed:', {
            sessionId: session.id,
            subscriptionId: session.subscription,
            organizationId: organizationId,
            subscriptionTier: session.metadata?.subscription_tier,
            timestamp: new Date().toISOString()
          });

          try {
            // Retrieve subscription details from Stripe
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            
            // Determine subscription tier from metadata or price
            let subscriptionTier = session.metadata?.subscription_tier || 'starter';
            if (!subscriptionTier && subscription.items?.data?.[0]?.price?.id) {
              // Fallback: determine tier from price ID
              const priceId = subscription.items.data[0].price.id;
              const { getTierFromPriceId } = await import('../../../utils/subscription-pricing');
              // Get product context from organization
              const { data: org } = await supabase
                .from('organizations')
                .select('product_context')
                .eq('id', organizationId)
                .single();
              const productContext = org?.product_context || 'tipjar';
              subscriptionTier = getTierFromPriceId(priceId, productContext);
            }

            // Map Stripe subscription status to our status
            let subscriptionStatus = 'active';
            if (subscription.status === 'trialing') {
              subscriptionStatus = 'trial';
            } else if (subscription.status === 'active') {
              subscriptionStatus = 'active';
            } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
              subscriptionStatus = 'past_due';
            } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
              subscriptionStatus = 'cancelled';
            }

            // Update organization with subscription details
            const updateData = {
              subscription_tier: subscriptionTier,
              subscription_status: subscriptionStatus,
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            };

            // Set trial_ends_at if in trial period
            if (subscription.trial_end) {
              updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
            } else if (subscriptionStatus === 'active') {
              // Clear trial_ends_at if subscription is active and not in trial
              updateData.trial_ends_at = null;
            }

            // Ensure stripe_customer_id is set
            if (session.customer && typeof session.customer === 'string') {
              updateData.stripe_customer_id = session.customer;
            } else if (subscription.customer && typeof subscription.customer === 'string') {
              updateData.stripe_customer_id = subscription.customer;
            }

            const { error: updateError } = await supabase
              .from('organizations')
              .update(updateData)
              .eq('id', organizationId);

            if (updateError) {
              console.error('❌ Error updating organization subscription:', updateError);
            } else {
              console.log(`✅ Organization ${organizationId} subscription updated:`, {
                tier: subscriptionTier,
                status: subscriptionStatus,
                subscriptionId: subscription.id
              });
            }
          } catch (err) {
            console.error('❌ Error processing subscription checkout:', err);
          }
        }

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
          
          // Use the actual payment time from Stripe, not current server time
          // session.created is a Unix timestamp in seconds, convert to ISO string
          const paidAt = session.created 
            ? new Date(session.created * 1000).toISOString()
            : new Date().toISOString(); // Fallback to current time if created not available
          
          const updateData = {
            payment_status: 'paid',
            payment_intent_id: session.payment_intent || session.id,
            amount_paid: session.amount_total, // Store in cents
            paid_at: paidAt, // Use actual payment time from Stripe
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
              // Use the actual payment time from Stripe for bundle requests too
              const bundlePaidAt = session.created 
                ? new Date(session.created * 1000).toISOString()
                : new Date().toISOString();
              
              const bundleUpdateData = {
                payment_status: 'paid',
                payment_intent_id: session.payment_intent || session.id,
                paid_at: bundlePaidAt, // Use actual payment time from Stripe
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

      case 'charge.succeeded':
        // Fallback handler for charge.succeeded events
        // Usually payment_intent.succeeded handles this, but this is a backup
        const charge = event.data.object;
        console.log('💰 Charge succeeded:', {
          id: charge.id,
          payment_intent: charge.payment_intent,
          amount: charge.amount / 100,
          timestamp: new Date().toISOString()
        });
        
        // If we have a payment_intent, try to process it
        if (charge.payment_intent) {
          const supabaseForCharge = createClient(supabaseUrl, supabaseKey);
          const { data: paymentIntent } = await stripe.paymentIntents.retrieve(charge.payment_intent);
          
          if (paymentIntent?.metadata?.request_id) {
            const requestId = paymentIntent.metadata.request_id;
            console.log(`Processing charge.succeeded for request: ${requestId}`);
            
            // Update crowd request if not already paid
            const { data: existingRequest } = await supabaseForCharge
              .from('crowd_requests')
              .select('payment_status')
              .eq('id', requestId)
              .single();
            
            if (existingRequest && existingRequest.payment_status !== 'paid') {
              await supabaseForCharge
                .from('crowd_requests')
                .update({
                  payment_status: 'paid',
                  payment_intent_id: paymentIntent.id,
                  amount_paid: charge.amount,
                  paid_at: new Date(paymentIntent.created * 1000).toISOString(),
                  status: 'acknowledged',
                  updated_at: new Date().toISOString()
                })
                .eq('id', requestId);
              
              console.log(`✅ Updated request ${requestId} from charge.succeeded event`);
            }
          }
        }
        break;

      case 'checkout.session.expired':
        // Normal event - sessions expire if user doesn't complete checkout
        // No action needed, just log for visibility
        console.log(`ℹ️ Checkout session expired: ${event.data.object.id}`);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Handle subscription lifecycle events
        const subscription = event.data.object;
        console.log(`📦 Subscription ${event.type}:`, {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          timestamp: new Date().toISOString()
        });

        try {
          const supabaseForSubscription = createClient(supabaseUrl, supabaseKey);

          // Find organization by Stripe customer ID
          const { data: org, error: orgError } = await supabaseForSubscription
            .from('organizations')
            .select('id, product_context')
            .eq('stripe_customer_id', subscription.customer)
            .single();

          if (orgError || !org) {
            console.error('⚠️ Organization not found for subscription:', subscription.customer);
            break;
          }

          // Determine subscription tier from price ID
          const priceId = subscription.items?.data?.[0]?.price?.id;
          if (!priceId) {
            console.error('⚠️ No price ID found in subscription');
            break;
          }

          const { getTierFromPriceId } = await import('../../../utils/subscription-pricing');
          const productContext = org.product_context || 'tipjar';
          const subscriptionTier = getTierFromPriceId(priceId, productContext);

          // Map Stripe subscription status to our status
          let subscriptionStatus = 'active';
          if (subscription.status === 'trialing') {
            subscriptionStatus = 'trial';
          } else if (subscription.status === 'active') {
            subscriptionStatus = 'active';
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            subscriptionStatus = 'past_due';
          } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
            subscriptionStatus = 'cancelled';
          }

          // Update organization
          const updateData = {
            subscription_tier: subscriptionTier,
            subscription_status: subscriptionStatus,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          };

          // Set trial_ends_at if in trial period
          if (subscription.trial_end) {
            updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
          } else if (subscriptionStatus === 'active') {
            // Clear trial_ends_at if subscription is active and not in trial
            updateData.trial_ends_at = null;
          }

          const { error: updateError } = await supabaseForSubscription
            .from('organizations')
            .update(updateData)
            .eq('id', org.id);

          if (updateError) {
            console.error('❌ Error updating organization subscription:', updateError);
          } else {
            console.log(`✅ Organization ${org.id} subscription updated:`, {
              tier: subscriptionTier,
              status: subscriptionStatus
            });
          }
        } catch (err) {
          console.error('❌ Error processing subscription event:', err);
        }
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const deletedSubscription = event.data.object;
        console.log(`🗑️ Subscription deleted:`, {
          subscriptionId: deletedSubscription.id,
          customerId: deletedSubscription.customer,
          timestamp: new Date().toISOString()
        });

        try {
          const supabaseForDeleted = createClient(supabaseUrl, supabaseKey);

          // Find organization by Stripe customer ID or subscription ID
          const { data: org, error: orgError } = await supabaseForDeleted
            .from('organizations')
            .select('id')
            .or(`stripe_customer_id.eq.${deletedSubscription.customer},stripe_subscription_id.eq.${deletedSubscription.id}`)
            .single();

          if (orgError || !org) {
            console.error('⚠️ Organization not found for deleted subscription:', deletedSubscription.customer);
            break;
          }

          // Update organization to cancelled status
          const { error: updateError } = await supabaseForDeleted
            .from('organizations')
            .update({
              subscription_status: 'cancelled',
              stripe_subscription_id: null, // Clear subscription ID
              updated_at: new Date().toISOString(),
            })
            .eq('id', org.id);

          if (updateError) {
            console.error('❌ Error updating organization for deleted subscription:', updateError);
          } else {
            console.log(`✅ Organization ${org.id} subscription marked as cancelled`);
          }
        } catch (err) {
          console.error('❌ Error processing subscription deletion:', err);
        }
        break;

      case 'invoice.payment_succeeded':
        // Handle successful invoice payment (renewals, etc.)
        const invoice = event.data.object;
        if (invoice.subscription) {
          console.log(`💰 Invoice payment succeeded for subscription:`, {
            invoiceId: invoice.id,
            subscriptionId: invoice.subscription,
            amount: invoice.amount_paid / 100,
            timestamp: new Date().toISOString()
          });

          try {
            const supabaseForInvoice = createClient(supabaseUrl, supabaseKey);

            // Find organization by subscription ID
            const { data: org, error: orgError } = await supabaseForInvoice
              .from('organizations')
              .select('id')
              .eq('stripe_subscription_id', invoice.subscription)
              .single();

            if (orgError || !org) {
              console.error('⚠️ Organization not found for invoice:', invoice.subscription);
              break;
            }

            // Ensure subscription is marked as active
            const { error: updateError } = await supabaseForInvoice
              .from('organizations')
              .update({
                subscription_status: 'active',
                trial_ends_at: null, // Clear trial_ends_at on successful payment
                updated_at: new Date().toISOString(),
              })
              .eq('id', org.id);

            if (updateError) {
              console.error('❌ Error updating organization for invoice payment:', updateError);
            } else {
              console.log(`✅ Organization ${org.id} subscription confirmed active`);
            }
          } catch (err) {
            console.error('❌ Error processing invoice payment:', err);
          }
        }
        break;

      case 'invoice.payment_failed':
        // Handle failed invoice payment
        const failedInvoice = event.data.object;
        if (failedInvoice.subscription) {
          console.log(`❌ Invoice payment failed for subscription:`, {
            invoiceId: failedInvoice.id,
            subscriptionId: failedInvoice.subscription,
            timestamp: new Date().toISOString()
          });

          try {
            const supabaseForFailedInvoice = createClient(supabaseUrl, supabaseKey);

            // Find organization by subscription ID
            const { data: org, error: orgError } = await supabaseForFailedInvoice
              .from('organizations')
              .select('id')
              .eq('stripe_subscription_id', failedInvoice.subscription)
              .single();

            if (orgError || !org) {
              console.error('⚠️ Organization not found for failed invoice:', failedInvoice.subscription);
              break;
            }

            // Mark subscription as past_due
            const { error: updateError } = await supabaseForFailedInvoice
              .from('organizations')
              .update({
                subscription_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('id', org.id);

            if (updateError) {
              console.error('❌ Error updating organization for failed invoice:', updateError);
            } else {
              console.log(`⚠️ Organization ${org.id} subscription marked as past_due`);
            }
          } catch (err) {
            console.error('❌ Error processing failed invoice:', err);
          }
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Always return 200 to Stripe, even if there were errors
    // This prevents Stripe from retrying and disabling the webhook
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    // CRITICAL: Always return 200 to Stripe, even on errors
    // Stripe requires 200-299 status codes. Returning 500 causes Stripe to retry and eventually disable the webhook
    // Log the error but acknowledge receipt to prevent webhook disable
    res.status(200).json({ 
      received: true,
      error: 'Webhook handler encountered an error but event was received',
      error_message: error.message 
    });
  }
}
