/**
 * Refund ticket API endpoint
 * POST /api/events/tickets/refund/[ticketId]
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getTicket, updateTicketPayment } from '../../../../../utils/event-tickets';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2025-07-30.preview',
}) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticketId } = req.query;
    const { reason, amount, partial = false } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID required' });
    }

    // Get ticket
    const ticketResult = await getTicket(ticketId, false);
    if (!ticketResult.success || !ticketResult.ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = ticketResult.ticket;

    // Check if ticket can be refunded
    if (ticket.payment_status === 'refunded') {
      return res.status(400).json({ error: 'Ticket already refunded' });
    }

    if (!['paid', 'cash', 'card_at_door'].includes(ticket.payment_status)) {
      return res.status(400).json({ error: 'Ticket payment not confirmed, cannot refund' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let refundResult = null;

    // Process Stripe refund if paid via Stripe
    if (ticket.payment_method === 'stripe' && ticket.stripe_payment_intent_id && stripe) {
      try {
        const refundAmount = partial && amount 
          ? Math.round(amount * 100) // Convert to cents
          : undefined; // Full refund

        const refundParams = {
          payment_intent: ticket.stripe_payment_intent_id,
          reason: reason || 'requested_by_customer',
          metadata: {
            ticket_id: ticket.id,
            event_id: ticket.event_id,
            reason: reason || 'no_reason'
          }
        };

        if (refundAmount) {
          refundParams.amount = refundAmount;
        }

        refundResult = await stripe.refunds.create(refundParams);

        console.log('Stripe refund created:', refundResult.id);
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
        
        // If it's a card_at_door payment that was recorded but not actually processed via Stripe,
        // we can still mark it as refunded in our system
        if (ticket.payment_method === 'card_at_door' && stripeError.code === 'resource_missing') {
          console.log('Payment intent not found in Stripe, marking as refunded in system only');
        } else {
          return res.status(500).json({ 
            error: 'Failed to process Stripe refund',
            details: stripeError.message 
          });
        }
      }
    } else if (ticket.payment_method === 'stripe' && !stripe) {
      console.warn('Stripe not configured, marking refund in system only');
    }

    // Update ticket status
    const updateResult = await updateTicketPayment(
      ticketId,
      'refunded',
      ticket.stripe_session_id,
      ticket.stripe_payment_intent_id,
      ticket.payment_method
    );

    if (!updateResult.success) {
      return res.status(500).json({ error: 'Failed to update ticket status' });
    }

    // Add refund note to ticket
    const refundNote = `Refunded ${partial && amount ? `$${amount.toFixed(2)} (partial)` : 'full amount'}${reason ? ` - Reason: ${reason}` : ''}${refundResult ? ` - Stripe Refund ID: ${refundResult.id}` : ''}`;
    
    const { error: noteError } = await supabase
      .from('event_tickets')
      .update({ 
        notes: ticket.notes ? `${ticket.notes}\n${refundNote}` : refundNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (noteError) {
      console.error('Error adding refund note:', noteError);
    }

    return res.status(200).json({
      success: true,
      refund: {
        id: refundResult?.id || 'manual',
        amount: refundResult?.amount ? refundResult.amount / 100 : (partial && amount ? amount : ticket.total_amount),
        status: refundResult?.status || 'succeeded',
        ticket_id: ticketId
      },
      ticket: {
        ...ticket,
        payment_status: 'refunded'
      }
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({
      error: 'Failed to process refund',
      message: error.message
    });
  }
}

