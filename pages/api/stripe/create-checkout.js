/**
 * Create Stripe Checkout Session
 * For service selection or invoice payments
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { createOrRetrieveStripeCustomer } = require('../../../utils/stripe-customer');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { invoiceId, leadId, amount, description, successUrl, cancelUrl, paymentType, gratuityAmount, gratuityType, gratuityPercentage } = req.body;
  
  // For invoice payments, if amount is provided, use it (includes gratuity)
  // Otherwise, calculate from invoice total + gratuity

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle quote payment (leadId provided)
    if (leadId) {
      if (!description) {
        return res.status(400).json({ error: 'Description required for quote payment' });
      }

      // Get lead/quote data
      const { data: quote, error: quoteError } = await supabase
        .from('quote_selections')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      // Handle $0 payments (free orders, 100% discount codes, etc.)
      // Stripe doesn't support $0 checkout sessions, so we mark payment as complete directly
      // Note: amount is already in cents from the frontend
      const amountInCents = Math.round(amount || 0);
      if (amountInCents === 0) {
        console.log(`💰 Handling $0 payment for lead ${leadId} - marking as paid directly`);

        // Mark quote as paid in database
        if (quote) {
          await supabase
            .from('quote_selections')
            .update({
              payment_status: 'paid',
              payment_intent_id: 'free_order',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('lead_id', leadId);
        }

        // Update contact status if needed
        try {
          await supabase
            .from('contacts')
            .update({
              payment_status: 'paid',
              deposit_paid: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', leadId);
        } catch (e) {
          console.log('Could not update contact payment status:', e);
        }

        // Send client payment confirmation for $0 payment (non-blocking)
        (async () => {
          try {
            const { notifyPaymentReceived } = await import('../../../utils/client-notifications');
            await notifyPaymentReceived(leadId, {
              amount: 0,
              payment_type: 'full',
              payment_intent_id: 'free_order'
            });
          } catch (err) {
            console.error('Error sending $0 payment confirmation to client:', err);
          }
        })();

        // Return success without Stripe session
        return res.status(200).json({
          success: true,
          sessionId: 'free_order',
          url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/quote/${leadId}/thank-you?session_id=free_order&amount=0`,
          isFreeOrder: true
        });
      }

      // Validate amount for non-zero payments
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0 for Stripe payment' });
      }

      // Get lead contact info and create/retrieve Stripe customer
      let customerEmail = null;
      let customerName = null;
      let stripeCustomerId = null;
      
      try {
        const { data: lead } = await supabase
          .from('contacts')
          .select('email_address, first_name, last_name, stripe_customer_id')
          .eq('id', leadId)
          .single();
        if (lead) {
          customerEmail = lead.email_address;
          customerName = lead.first_name && lead.last_name 
            ? `${lead.first_name} ${lead.last_name}`.trim()
            : lead.first_name || lead.last_name || null;
          stripeCustomerId = lead.stripe_customer_id;
        } else {
          // Try contact_submissions
          const { data: submission } = await supabase
            .from('contact_submissions')
            .select('email, name')
            .eq('id', leadId)
            .single();
          if (submission) {
            customerEmail = submission.email;
            customerName = submission.name || null;
          }
        }
      } catch (e) {
        console.log('Could not fetch customer info:', e);
      }

      // Create or retrieve Stripe customer for saving payment methods
      if (customerEmail && leadId) {
        try {
          stripeCustomerId = await createOrRetrieveStripeCustomer(
            leadId,
            customerEmail,
            customerName
          );
        } catch (error) {
          console.error('Error creating/retrieving Stripe customer:', error);
          // Continue without customer (payment will still work, just won't save payment method)
        }
      }

      // Create line items for quote payment
      const lineItems = [];
      
      // Base payment amount (without gratuity)
      const baseAmount = gratuityAmount ? (amount - Math.round(gratuityAmount * 100)) : amount;
      
      // Add base payment line item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: description,
            description: quote?.package_name || 'DJ Services'
          },
          unit_amount: Math.round(baseAmount) // Amount already in cents
        },
        quantity: 1
      });
      
      // Add gratuity as separate line item if provided (only for full payments)
      if (gratuityAmount && gratuityAmount > 0 && paymentType === 'full') {
        const gratuityLabel = gratuityType === 'percentage' 
          ? `Gratuity (${gratuityPercentage}%)`
          : 'Gratuity';
        
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: gratuityLabel,
              description: 'Thank you for your generosity!'
            },
            unit_amount: Math.round(gratuityAmount * 100) // Convert to cents
          },
          quantity: 1
        });
      }

      // Create Stripe checkout session with customer for saving payment methods
      const sessionParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/quote/${leadId}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/quote/${leadId}/payment`,
        metadata: {
          lead_id: leadId,
          payment_type: paymentType || (amount === Math.round((quote?.total_price || 0) * 100) ? 'full' : 'deposit'),
          ...(gratuityAmount && gratuityAmount > 0 && paymentType === 'full' ? {
            gratuity_amount: gratuityAmount.toString(),
            gratuity_type: gratuityType || '',
            gratuity_percentage: gratuityPercentage?.toString() || ''
          } : {})
        },
        payment_intent_data: {
          metadata: {
            lead_id: leadId,
            payment_type: paymentType || (amount === Math.round((quote?.total_price || 0) * 100) ? 'full' : 'deposit'),
            ...(gratuityAmount && gratuityAmount > 0 && paymentType === 'full' ? {
              gratuity_amount: gratuityAmount.toString(),
              gratuity_type: gratuityType || '',
              gratuity_percentage: gratuityPercentage?.toString() || ''
            } : {})
          }
        }
      };

      // Enable saving payment methods for future use if customer exists
      // This allows Stripe to save the payment method for future charges
      if (stripeCustomerId) {
        sessionParams.payment_method_options = {
          card: {
            setup_future_usage: 'off_session' // Save card for future payments
          }
        };
      }

      // Use customer if we have one (enables saving payment methods), otherwise use customer_email
      if (stripeCustomerId) {
        sessionParams.customer = stripeCustomerId;
        sessionParams.customer_update = {
          address: 'auto',
          name: 'auto'
        };
      } else if (customerEmail) {
        sessionParams.customer_email = customerEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

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

    // Check if already paid (handle both status field names)
    const invoiceStatus = invoice.invoice_status || invoice.status;
    if (invoiceStatus === 'Paid' || invoiceStatus === 'paid') {
      return res.status(400).json({ error: 'Invoice already paid' });
    }
    
    // Check if invoice has a payable amount
    const balanceDue = invoice.balance_due || invoice.total_amount || 0;
    if (balanceDue <= 0) {
      return res.status(400).json({ error: 'Invoice has no balance due' });
    }

    // Create line items for Stripe from invoice line items
    const lineItems = [];
    
    // Calculate base invoice amount (without gratuity)
    const baseInvoiceAmount = invoice.balance_due || invoice.total_amount || 0;
    
    // If amount is provided from frontend, it includes gratuity - calculate base amount
    let paymentAmountBase = baseInvoiceAmount;
    if (amount && gratuityAmount) {
      // Amount is in cents and includes gratuity
      paymentAmountBase = (amount / 100) - gratuityAmount;
    }
    
    // Process invoice line items if they exist
    if (invoice.line_items && Array.isArray(invoice.line_items) && invoice.line_items.length > 0) {
      invoice.line_items.forEach(item => {
        // Calculate item total - handle multiple field names
        const itemTotal = item.total || item.amount || item.total_amount || 
                         ((item.rate || item.unit_price || 0) * (item.quantity || 1));
        
        // Only add if we have a valid amount
        if (itemTotal && !isNaN(itemTotal) && itemTotal > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.description || 'Invoice Item',
                description: `Invoice ${invoice.invoice_number}`
              },
              unit_amount: Math.round(parseFloat(itemTotal) * 100) // Convert to cents
            },
            quantity: item.quantity || 1
          });
        }
      });
    }
    
    // If no line items or empty line items, use base amount as a single line item
    if (lineItems.length === 0) {
      if (paymentAmountBase > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `Payment for invoice ${invoice.invoice_number}`
            },
            unit_amount: Math.round(parseFloat(paymentAmountBase) * 100) // Convert to cents
          },
          quantity: 1
        });
      }
    }
    
    // Add gratuity as separate line item if provided (similar to quote flow)
    if (gratuityAmount && gratuityAmount > 0) {
      const gratuityLabel = gratuityType === 'percentage' 
        ? `Gratuity (${gratuityPercentage}%)`
        : 'Gratuity';
      
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: gratuityLabel,
            description: 'Thank you for your generosity!'
          },
          unit_amount: Math.round(parseFloat(gratuityAmount) * 100) // Convert to cents
        },
        quantity: 1
      });
    }

    // Validate we have at least one line item
    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'Invoice has no payable amount' });
    }

    // Get contact email for customer
    const contactEmail = invoice.contacts?.email_address || 
                        invoice.contacts?.primary_email ||
                        (typeof invoice.contacts === 'object' && invoice.contacts?.contacts?.email_address) ||
                        null;

    // Get contact info for Stripe customer
    let customerEmail = contactEmail;
    let customerName = null;
    let stripeCustomerId = null;
    
    if (invoice.contacts) {
      const contact = invoice.contacts;
      customerEmail = contact.email_address || contactEmail;
      if (contact.first_name || contact.last_name) {
        customerName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      }
      stripeCustomerId = contact.stripe_customer_id;
    }

    // Create or retrieve Stripe customer for saving payment methods
    if (customerEmail && invoice.contact_id) {
      try {
        stripeCustomerId = await createOrRetrieveStripeCustomer(
          invoice.contact_id,
          customerEmail,
          customerName
        );
      } catch (error) {
        console.error('Error creating/retrieving Stripe customer:', error);
        // Continue without customer (payment will still work)
      }
    }

    // Create Stripe checkout session parameters
    const sessionParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pay/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pay/cancelled?invoiceId=${invoice.id}`,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        contact_id: invoice.contact_id,
        ...(gratuityAmount && gratuityAmount > 0 ? {
          gratuity_amount: gratuityAmount.toString(),
          gratuity_type: gratuityType || '',
          gratuity_percentage: gratuityPercentage?.toString() || ''
        } : {})
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          contact_id: invoice.contact_id,
          ...(gratuityAmount && gratuityAmount > 0 ? {
            gratuity_amount: gratuityAmount.toString(),
            gratuity_type: gratuityType || '',
            gratuity_percentage: gratuityPercentage?.toString() || ''
          } : {})
        }
      }
    };

    // Enable saving payment methods for future use if customer exists
    if (stripeCustomerId) {
      sessionParams.payment_method_options = {
        card: {
          setup_future_usage: 'off_session'
        }
      };
    }

    // Use customer if we have one, otherwise use customer_email
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
      sessionParams.customer_update = {
        address: 'auto',
        name: 'auto'
      };
    } else if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

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

