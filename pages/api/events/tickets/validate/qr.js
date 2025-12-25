/**
 * Validate and check in ticket by QR code
 * POST /api/events/tickets/validate/qr
 */

import { checkInTicket, getTicket } from '../../../../../utils/event-tickets';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { qrCode, checkedInBy } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: 'QR code required' });
    }

    // Get ticket by QR code
    const ticketResult = await getTicket(qrCode, true);

    if (!ticketResult.success || !ticketResult.ticket) {
      return res.status(404).json({ 
        error: 'Ticket not found',
        success: false
      });
    }

    const ticket = ticketResult.ticket;

    // If just validating (not checking in)
    if (req.query.validate === 'true' || !checkedInBy) {
      return res.status(200).json({
        success: true,
        valid: true,
        ticket: {
          id: ticket.id,
          event_id: ticket.event_id,
          purchaser_name: ticket.purchaser_name,
          quantity: ticket.quantity,
          payment_status: ticket.payment_status,
          checked_in: ticket.checked_in,
          ticket_type: ticket.ticket_type
        }
      });
    }

    // Check in the ticket
    const checkInResult = await checkInTicket(
      qrCode,
      checkedInBy || 'Staff'
    );

    if (!checkInResult.success) {
      return res.status(400).json({
        success: false,
        error: checkInResult.error
      });
    }

    return res.status(200).json({
      success: true,
      checkedIn: true,
      ticket: checkInResult.ticket
    });

  } catch (error) {
    console.error('Error validating ticket:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate ticket'
    });
  }
}

