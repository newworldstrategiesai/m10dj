/**
 * Event Ticket Utilities
 * Helper functions for ticket management
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TicketConfig {
  eventId: string;
  ticketTypes: {
    [key: string]: {
      name: string;
      price: number;
      description: string;
      available: boolean;
      maxQuantity?: number;
      maxTotal?: number;
    };
  };
  capacity?: number;
}

export interface TicketPurchase {
  eventId: string;
  ticketType: string;
  quantity: number;
  purchaserName: string;
  purchaserEmail: string;
  purchaserPhone?: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  ticket_type: string;
  purchaser_name: string;
  purchaser_email: string;
  purchaser_phone?: string;
  quantity: number;
  price_per_ticket: number;
  total_amount: number;
  payment_status: string;
  payment_method?: string;
  qr_code: string;
  qr_code_short?: string;
  checked_in: boolean;
  checked_in_at?: string;
  created_at: string;
}

/**
 * Generate unique QR code for ticket
 */
export function generateQRCode(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Generate short QR code (8 characters)
 */
export function generateShortQRCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get ticket configuration for an event
 */
export function getEventTicketConfig(eventId: string): TicketConfig {
  // Default configuration for Silky O'Sullivan's event
  if (eventId === 'dj-ben-murray-silky-osullivans-2026-12-27') {
    return {
      eventId,
      capacity: 200, // Adjust based on venue capacity
      ticketTypes: {
        general_admission: {
          name: 'General Admission',
          price: 12.00,
          description: 'Entry to DJ Ben Murray Live at Silky O\'Sullivan\'s',
          available: true,
          maxQuantity: 10
        },
        early_bird: {
          name: 'Early Bird',
          price: 10.00,
          description: 'Limited early bird pricing (first 50 tickets)',
          available: true,
          maxQuantity: 4,
          maxTotal: 50
        }
      }
    };
  }
  
  // Default config for other events
  return {
    eventId,
    ticketTypes: {
      general_admission: {
        name: 'General Admission',
        price: 10.00,
        description: 'Event admission',
        available: true,
        maxQuantity: 10
      }
    }
  };
}

/**
 * Get tickets sold count for an event
 */
export async function getTicketsSold(eventId: string, ticketType?: string): Promise<number> {
  try {
    let query = supabase
      .from('event_tickets')
      .select('quantity', { count: 'exact', head: false })
      .eq('event_id', eventId)
      .in('payment_status', ['paid', 'cash', 'card_at_door']);

    if (ticketType) {
      query = query.eq('ticket_type', ticketType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting tickets sold:', error);
      return 0;
    }

    return data?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0;
  } catch (error) {
    console.error('Error getting tickets sold:', error);
    return 0;
  }
}

/**
 * Check if tickets are available
 */
export async function checkTicketAvailability(
  eventId: string,
  ticketType: string,
  quantity: number
): Promise<{ available: boolean; reason?: string }> {
  const config = getEventTicketConfig(eventId);
  const ticketTypeConfig = config.ticketTypes[ticketType];

  if (!ticketTypeConfig || !ticketTypeConfig.available) {
    return { available: false, reason: 'Ticket type not available' };
  }

  if (ticketTypeConfig.maxQuantity && quantity > ticketTypeConfig.maxQuantity) {
    return { 
      available: false, 
      reason: `Maximum ${ticketTypeConfig.maxQuantity} tickets per purchase` 
    };
  }

  // Check total tickets sold for this type
  if (ticketTypeConfig.maxTotal) {
    const sold = await getTicketsSold(eventId, ticketType);
    if (sold + quantity > ticketTypeConfig.maxTotal) {
      return { 
        available: false, 
        reason: `Only ${ticketTypeConfig.maxTotal - sold} tickets remaining` 
      };
    }
  }

  // Check overall capacity
  if (config.capacity) {
    const totalSold = await getTicketsSold(eventId);
    if (totalSold + quantity > config.capacity) {
      return { 
        available: false, 
        reason: `Only ${config.capacity - totalSold} tickets remaining` 
      };
    }
  }

  return { available: true };
}

/**
 * Create ticket record (before payment)
 */
export async function createTicketRecord(purchase: TicketPurchase): Promise<{
  success: boolean;
  ticketId?: string;
  qrCode?: string;
  error?: string;
}> {
  try {
    const config = getEventTicketConfig(purchase.eventId);
    const ticketTypeConfig = config.ticketTypes[purchase.ticketType];

    if (!ticketTypeConfig) {
      return { success: false, error: 'Invalid ticket type' };
    }

    // Check availability
    const availability = await checkTicketAvailability(
      purchase.eventId,
      purchase.ticketType,
      purchase.quantity
    );

    if (!availability.available) {
      return { success: false, error: availability.reason || 'Tickets not available' };
    }

    const qrCode = generateQRCode();
    const qrCodeShort = generateShortQRCode();
    const pricePerTicket = ticketTypeConfig.price;
    const totalAmount = pricePerTicket * purchase.quantity;

    const { data, error } = await supabase
      .from('event_tickets')
      .insert({
        event_id: purchase.eventId,
        ticket_type: purchase.ticketType,
        purchaser_name: purchase.purchaserName,
        purchaser_email: purchase.purchaserEmail,
        purchaser_phone: purchase.purchaserPhone,
        quantity: purchase.quantity,
        price_per_ticket: pricePerTicket,
        total_amount: totalAmount,
        payment_status: 'pending',
        qr_code: qrCode,
        qr_code_short: qrCodeShort
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticket record:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      ticketId: data.id,
      qrCode: qrCodeShort || qrCode
    };
  } catch (error: any) {
    console.error('Error creating ticket record:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update ticket payment status
 */
export async function updateTicketPayment(
  ticketId: string,
  paymentStatus: string,
  stripeSessionId?: string,
  stripePaymentIntentId?: string,
  paymentMethod?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    };

    if (stripeSessionId) updateData.stripe_session_id = stripeSessionId;
    if (stripePaymentIntentId) updateData.stripe_payment_intent_id = stripePaymentIntentId;
    if (paymentMethod) updateData.payment_method = paymentMethod;

    const { error } = await supabase
      .from('event_tickets')
      .update(updateData)
      .eq('id', ticketId);

    if (error) {
      console.error('Error updating ticket payment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating ticket payment:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get ticket by ID or QR code
 */
export async function getTicket(
  identifier: string,
  byQRCode: boolean = false
): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  try {
    const query = byQRCode
      ? supabase
          .from('event_tickets')
          .select('*')
          .or(`qr_code.eq.${identifier},qr_code_short.eq.${identifier}`)
          .single()
      : supabase
          .from('event_tickets')
          .select('*')
          .eq('id', identifier)
          .single();

    const { data, error } = await query;

    if (error) {
      return { success: false, error: 'Ticket not found' };
    }

    return { success: true, ticket: data as Ticket };
  } catch (error: any) {
    console.error('Error getting ticket:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check in ticket
 */
export async function checkInTicket(
  qrCode: string,
  checkedInBy: string
): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
  try {
    // First, get the ticket
    const ticketResult = await getTicket(qrCode, true);
    if (!ticketResult.success || !ticketResult.ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    const ticket = ticketResult.ticket;

    // Validate ticket
    if (ticket.checked_in) {
      return { success: false, error: 'Ticket already checked in' };
    }

    if (!['paid', 'cash', 'card_at_door'].includes(ticket.payment_status)) {
      return { success: false, error: 'Ticket payment not confirmed' };
    }

    // Check in the ticket
    const { data, error } = await supabase
      .from('event_tickets')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: checkedInBy
      })
      .eq('id', ticket.id)
      .select()
      .single();

    if (error) {
      console.error('Error checking in ticket:', error);
      return { success: false, error: error.message };
    }

    return { success: true, ticket: data as Ticket };
  } catch (error: any) {
    console.error('Error checking in ticket:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get event ticket statistics
 */
export async function getEventTicketStats(eventId: string): Promise<{
  totalSold: number;
  totalRevenue: number;
  checkedIn: number;
  byType: { [key: string]: { sold: number; revenue: number } };
  byPaymentMethod: { [key: string]: { count: number; revenue: number } };
}> {
  try {
    const { data, error } = await supabase
      .from('event_tickets')
      .select('*')
      .eq('event_id', eventId)
      .in('payment_status', ['paid', 'cash', 'card_at_door']);

    if (error) {
      console.error('Error getting ticket stats:', error);
      return {
        totalSold: 0,
        totalRevenue: 0,
        checkedIn: 0,
        byType: {},
        byPaymentMethod: {}
      };
    }

    let totalSold = 0;
    let totalRevenue = 0;
    let checkedIn = 0;
    const byType: { [key: string]: { sold: number; revenue: number } } = {};
    const byPaymentMethod: { [key: string]: { count: number; revenue: number } } = {};

    data?.forEach((ticket: any) => {
      totalSold += ticket.quantity;
      totalRevenue += parseFloat(ticket.total_amount);
      if (ticket.checked_in) checkedIn += ticket.quantity;

      // By type
      if (!byType[ticket.ticket_type]) {
        byType[ticket.ticket_type] = { sold: 0, revenue: 0 };
      }
      byType[ticket.ticket_type].sold += ticket.quantity;
      byType[ticket.ticket_type].revenue += parseFloat(ticket.total_amount);

      // By payment method
      const method = ticket.payment_method || 'stripe';
      if (!byPaymentMethod[method]) {
        byPaymentMethod[method] = { count: 0, revenue: 0 };
      }
      byPaymentMethod[method].count += ticket.quantity;
      byPaymentMethod[method].revenue += parseFloat(ticket.total_amount);
    });

    return {
      totalSold,
      totalRevenue,
      checkedIn,
      byType,
      byPaymentMethod
    };
  } catch (error) {
    console.error('Error getting ticket stats:', error);
    return {
      totalSold: 0,
      totalRevenue: 0,
      checkedIn: 0,
      byType: {},
      byPaymentMethod: {}
    };
  }
}

