// API endpoint to process Stripe payment success and update crowd request
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, requestId } = req.body;

  if (!sessionId || !requestId) {
    return res.status(400).json({ error: 'Session ID and Request ID are required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });

    if (!session) {
      return res.status(404).json({ error: 'Stripe session not found' });
    }

    // Get the payment intent ID
    const paymentIntentId = session.payment_intent;
    const paymentIntent = typeof paymentIntentId === 'string' 
      ? await stripe.paymentIntents.retrieve(paymentIntentId)
      : paymentIntentId;

    // Get customer details
    let customerName = null;
    let customerEmail = null;
    let customerPhone = null;

    if (session.customer) {
      try {
        const customer = typeof session.customer === 'string'
          ? await stripe.customers.retrieve(session.customer)
          : session.customer;
        
        customerName = customer.name;
        customerEmail = customer.email || session.customer_email;
        customerPhone = customer.phone;
      } catch (err) {
        console.warn('Could not fetch customer:', err.message);
      }
    }

    // Get customer details from session if not from customer object
    if (!customerName && session.customer_details?.name) {
      customerName = session.customer_details.name;
    }
    if (!customerEmail && session.customer_email) {
      customerEmail = session.customer_email;
    }
    if (!customerPhone && session.customer_details?.phone) {
      customerPhone = session.customer_details.phone;
    }

    // Calculate amount paid (from session or payment intent)
    const amountPaid = session.amount_total || (paymentIntent ? paymentIntent.amount : 0);

    // Update the crowd request with payment information
    const updateData = {
      payment_status: session.payment_status === 'paid' ? 'paid' : 'pending',
      payment_method: 'card',
      stripe_session_id: sessionId,
      updated_at: new Date().toISOString(),
    };

    // Add payment_intent_id if available
    if (paymentIntentId) {
      updateData.payment_intent_id = typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId.id;
    }

    // Update amount_paid if payment was successful
    if (session.payment_status === 'paid' && amountPaid > 0) {
      updateData.amount_paid = amountPaid;
      updateData.paid_at = new Date().toISOString();
    }

    // ALWAYS update customer information from Stripe when available (Stripe is source of truth)
    // Stripe data is more reliable than form data since it's collected during payment
    if (customerName && customerName.trim() && customerName !== 'Guest') {
      updateData.requester_name = customerName.trim();
    } else if (session.customer_details?.name && session.customer_details.name.trim() && session.customer_details.name !== 'Guest') {
      // Fallback to session customer_details if customer object doesn't have name
      updateData.requester_name = session.customer_details.name.trim();
    }
    
    // Always update email and phone from Stripe if available (more reliable)
    if (customerEmail && customerEmail.trim()) {
      updateData.requester_email = customerEmail.trim();
    } else if (session.customer_email && session.customer_email.trim()) {
      updateData.requester_email = session.customer_email.trim();
    }
    
    if (customerPhone && customerPhone.trim()) {
      updateData.requester_phone = customerPhone.trim();
    } else if (session.customer_details?.phone && session.customer_details.phone.trim()) {
      updateData.requester_phone = session.customer_details.phone.trim();
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('crowd_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating request:', updateError);
      return res.status(500).json({
        error: 'Failed to update request',
        details: updateError.message,
      });
    }

    console.log(`✅ Updated request ${requestId} with payment info from Stripe session ${sessionId}`);

    // Create invoice for successful payments
    if (session.payment_status === 'paid' && paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        const { createInvoiceFromCrowdRequest } = await import('../../../utils/create-invoice-from-crowd-request');
        const invoiceResult = await createInvoiceFromCrowdRequest(requestId, paymentIntent, supabase);
        
        if (invoiceResult.success) {
          console.log(`✅ Created invoice ${invoiceResult.invoice_id} for crowd request ${requestId}`);
        } else {
          console.warn(`⚠️ Could not create invoice for request ${requestId}:`, invoiceResult.error);
          // Non-critical - payment is still processed
        }
      } catch (invoiceError) {
        console.warn(`⚠️ Error creating invoice for request ${requestId}:`, invoiceError);
        // Non-critical - payment is still processed
      }
    }

    return res.status(200).json({
      success: true,
      request: updatedRequest,
      paymentIntentId: typeof paymentIntentId === 'string' ? paymentIntentId : paymentIntentId?.id,
      customerName,
      customerEmail,
    });
  } catch (error) {
    console.error('Error processing payment success:', error);
    
    // Log error for monitoring
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      // Could log to an error tracking table here if needed
    } catch (logError) {
      // Ignore logging errors
    }
    
    return res.status(500).json({
      error: 'Failed to process payment success',
      message: error.message,
      // Don't expose internal details in production
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  }
}

