/**
 * API endpoint to create Stripe checkout session for ticket purchase
 * POST /api/events/tickets/purchase
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getEventTicketConfig, createTicketRecord, checkTicketAvailability } from '../../../../utils/event-tickets';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE || '', {
  apiVersion: '2025-07-30.preview',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      eventId,
      ticketType,
      quantity,
      purchaserName,
      purchaserEmail,
      purchaserPhone
    } = req.body;

    // Validate input
    if (!eventId || !ticketType || !quantity || !purchaserName || !purchaserEmail) {
      return res.status(400).json({ 
        error: 'Missing required fields: eventId, ticketType, quantity, purchaserName, purchaserEmail' 
      });
    }

    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 10' });
    }

    // Check ticket availability
    const availability = await checkTicketAvailability(eventId, ticketType, quantity);
    if (!availability.available) {
      return res.status(400).json({ 
        error: availability.reason || 'Tickets not available' 
      });
    }

    // Get ticket configuration
    const config = getEventTicketConfig(eventId);
    const ticketTypeConfig = config.ticketTypes[ticketType];

    if (!ticketTypeConfig) {
      return res.status(400).json({ error: 'Invalid ticket type' });
    }

    // Create ticket record (pending payment)
    const ticketResult = await createTicketRecord({
      eventId,
      ticketType,
      quantity,
      purchaserName,
      purchaserEmail,
      purchaserPhone
    });

    if (!ticketResult.success) {
      return res.status(400).json({ error: ticketResult.error });
    }

    // Create Stripe checkout session
    const pricePerTicket = ticketTypeConfig.price;
    const totalAmount = pricePerTicket * quantity;

    // Create or retrieve Stripe customer
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if customer exists in Stripe
    let customerId;
    try {
      const customers = await stripe.customers.list({
        email: purchaserEmail,
        limit: 1
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email: purchaserEmail,
          name: purchaserName,
          phone: purchaserPhone,
          metadata: {
            event_id: eventId,
            ticket_id: ticketResult.ticketId
          }
        });
        customerId = customer.id;
      }
    } catch (error) {
      console.error('Error with Stripe customer:', error);
      // Continue without customer (guest checkout)
    }

    // Create Stripe product and price if they don't exist
    // For simplicity, we'll create them on-the-fly or use existing ones
    // You can also pre-create them in Stripe dashboard
    
    const productName = `${ticketTypeConfig.name} - ${eventId}`;
    const productDescription = ticketTypeConfig.description;

    // Create checkout session
    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
              metadata: {
                event_id: eventId,
                ticket_type: ticketType
              }
            },
            unit_amount: Math.round(pricePerTicket * 100), // Convert to cents
          },
          quantity: quantity,
        },
      ],
      metadata: {
        event_id: eventId,
        ticket_id: ticketResult.ticketId,
        ticket_type: ticketType,
        purchaser_name: purchaserName,
        purchaser_email: purchaserEmail,
        quantity: quantity.toString()
      },
      success_url: `${req.headers.origin || 'https://www.m10djcompany.com'}/events/tickets/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://www.m10djcompany.com'}/events/live/${eventId}?canceled=true`,
      customer_email: purchaserEmail,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update ticket record with Stripe session ID
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    await supabaseAdmin
      .from('event_tickets')
      .update({ stripe_session_id: session.id })
      .eq('id', ticketResult.ticketId);

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating ticket purchase:', error);
    return res.status(500).json({
      error: 'Failed to create ticket purchase',
      message: error.message
    });
  }
}

