/**
 * Create Stripe Checkout Session
 * For service selection or invoice payments
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId, leadId, amount, description, successUrl, cancelUrl } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle quote payment (leadId provided)
    if (leadId) {
      if (!amount || !description) {
        return res.status(400).json({ error: 'Amount and description required for quote payment' });
      }

      // Get lead/quote data
      const { data: quote, error: quoteError } = await supabase
        .from('quote_selections')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      // Get lead contact info
      let customerEmail = null;
      try {
        const { data: lead } = await supabase
          .from('contacts')
          .select('email_address')
          .eq('id', leadId)
          .single();
        if (lead) {
          customerEmail = lead.email_address;
        } else {
          // Try contact_submissions
          const { data: submission } = await supabase
            .from('contact_submissions')
            .select('email')
            .eq('id', leadId)
            .single();
          if (submission) {
            customerEmail = submission.email;
          }
        }
      } catch (e) {
        console.log('Could not fetch customer email:', e);
      }

      // Create line item for quote payment
      const lineItems = [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: description,
            description: quote?.package_name || 'DJ Services'
          },
          unit_amount: Math.round(amount) // Amount already in cents
        },
        quantity: 1
      }];

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/quote/${leadId}/confirmation?payment_intent={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/quote/${leadId}/payment`,
        customer_email: customerEmail,
        metadata: {
          lead_id: leadId,
          payment_type: amount === Math.round((quote?.total_price || 0) * 100) ? 'full' : 'deposit'
        },
        payment_intent_data: {
          metadata: {
            lead_id: leadId,
            payment_type: amount === Math.round((quote?.total_price || 0) * 100) ? 'full' : 'deposit'
          }
        }
      });

      // Update quote_selections with payment intent
      if (quote) {
        await supabase
          .from('quote_selections')
          .update({
            payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString()
          })
          .eq('lead_id', leadId);
      }

      console.log(`✅ Created Stripe checkout session for quote payment (lead: ${leadId})`);

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url
      });
    }

    // Handle invoice payment (invoiceId provided)
    if (!invoiceId) {
      return res.status(400).json({ error: 'Either invoiceId or leadId required' });
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, contacts(*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if already paid
    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }

    // Create line items for Stripe
    const lineItems = (invoice.line_items || []).map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.description,
          description: `Invoice ${invoice.invoice_number}`
        },
        unit_amount: Math.round(item.total * 100) // Convert to cents
      },
      quantity: item.quantity || 1
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancelled`,
      customer_email: invoice.contacts?.email_address || invoice.contacts?.primary_email,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        contact_id: invoice.contact_id
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number
        }
      }
    });

    // Store session ID for tracking
    await supabase
      .from('invoices')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id);

    console.log(`✅ Created Stripe checkout session for invoice ${invoice.invoice_number}`);

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('❌ Error creating Stripe checkout:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
}

