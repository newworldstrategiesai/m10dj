/**
 * Stripe Webhook Handler
 * Processes payment events and updates invoices
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Disable body parsing, need raw body for signature verification
export const config = {
  api: {
    bodyParser: false
  }
};

// Helper function to read raw body as buffer
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object, supabase);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object, supabase);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object, supabase);
      break;

    case 'charge.refunded':
      await handleRefund(event.data.object, supabase);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
}

async function handleCheckoutCompleted(session, supabase) {
  const invoiceId = session.metadata.invoice_id;

  if (!invoiceId) {
    console.warn('No invoice_id in checkout session metadata');
    return;
  }

  try {
    // Update invoice status
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: 'stripe',
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        amount_paid: session.amount_total / 100, // Convert from cents
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (invoiceError) throw invoiceError;

    // Get invoice and contact details
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, contacts(*)')
      .eq('id', invoiceId)
      .single();

    if (invoice) {
      // Create payment record
      await supabase
        .from('payments')
        .insert({
          contact_id: invoice.contact_id,
          invoice_id: invoice.id,
          amount: session.amount_total / 100,
          payment_method: 'stripe',
          status: 'completed',
          transaction_id: session.payment_intent,
          stripe_session_id: session.id,
          payment_date: new Date().toISOString()
        });

      // Send confirmation email
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: invoice.contacts?.email_address || invoice.contacts?.primary_email,
            subject: '✅ Payment Received - M10 DJ Company',
            body: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Payment Received!</h2>
                
                <p>Hi ${invoice.contacts?.first_name}!</p>
                
                <p>We've received your payment of <strong>$${(session.amount_total / 100).toFixed(2)}</strong>. Thank you!</p>
                
                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Payment Details:</h3>
                  <p><strong>Invoice:</strong> ${invoice.invoice_number}</p>
                  <p><strong>Amount:</strong> $${(session.amount_total / 100).toFixed(2)}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p><strong>Payment Method:</strong> Credit Card</p>
                </div>
                
                <p>You'll receive a receipt from Stripe via email as well.</p>
                
                <p>Looking forward to your event!</p>
                
                <p>Best,<br>
                Ben Murray<br>
                M10 DJ Company<br>
                (901) 410-2020</p>
              </div>
            `,
            contactId: invoice.contact_id
          })
        });
      } catch (emailError) {
        console.error('Error sending payment confirmation:', emailError);
      }

      // Send admin notification
      await supabase.from('notification_log').insert({
        notification_type: 'payment_received',
        recipient: 'admin',
        subject: `💰 Payment Received: ${invoice.contacts?.first_name} ${invoice.contacts?.last_name}`,
        body: `Amount: $${(session.amount_total / 100).toFixed(2)}\nInvoice: ${invoice.invoice_number}\nPayment ID: ${session.payment_intent}`,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      console.log(`✅ Payment processed for invoice ${invoice.invoice_number}`);
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent, supabase) {
  console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
  
  // Additional processing if needed
  const invoiceId = paymentIntent.metadata.invoice_id;
  
  if (invoiceId) {
    await supabase
      .from('invoices')
      .update({
        stripe_payment_intent: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);
  }
}

async function handlePaymentFailed(paymentIntent, supabase) {
  console.error(`❌ Payment failed: ${paymentIntent.id}`);
  
  const invoiceId = paymentIntent.metadata.invoice_id;
  
  if (invoiceId) {
    await supabase
      .from('invoices')
      .update({
        status: 'payment_failed',
        stripe_payment_intent: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    // Send admin notification
    await supabase.from('notification_log').insert({
      notification_type: 'payment_failed',
      recipient: 'admin',
      subject: `❌ Payment Failed`,
      body: `Payment Intent: ${paymentIntent.id}\nInvoice ID: ${invoiceId}\nError: ${paymentIntent.last_payment_error?.message || 'Unknown'}`,
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  }
}

async function handleRefund(charge, supabase) {
  console.log(`💸 Refund processed: ${charge.id}`);
  
  // Find invoice by payment intent
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('stripe_payment_intent', charge.payment_intent)
    .single();

  if (invoice) {
    await supabase
      .from('invoices')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refund_amount: charge.amount_refunded / 100,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    // Log refund
    await supabase.from('notification_log').insert({
      notification_type: 'payment_refunded',
      recipient: 'admin',
      subject: `💸 Refund Processed`,
      body: `Invoice: ${invoice.invoice_number}\nAmount: $${(charge.amount_refunded / 100).toFixed(2)}\nCharge: ${charge.id}`,
      status: 'sent',
      sent_at: new Date().toISOString()
    });
  }
}

