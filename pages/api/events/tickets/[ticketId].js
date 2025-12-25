/**
 * Get ticket by ID
 * GET /api/events/tickets/[ticketId]
 */

import { getTicket } from '../../../../utils/event-tickets';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticketId } = req.query;

    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID required' });
    }

    const ticketResult = await getTicket(ticketId, false);

    if (!ticketResult.success || !ticketResult.ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.status(200).json({
      success: true,
      ticket: ticketResult.ticket
    });

  } catch (error) {
    console.error('Error getting ticket:', error);
    return res.status(500).json({
      error: 'Failed to get ticket',
      message: error.message
    });
  }
}

