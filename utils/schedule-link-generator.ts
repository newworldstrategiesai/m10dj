/**
 * Utility to generate customized schedule links with pre-filled client information
 * These links can be sent to clients after they submit a contact form
 */

export interface ScheduleLinkParams {
  name?: string;
  email?: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  venueName?: string;
  venueAddress?: string;
  notes?: string;
  baseUrl?: string;
}

/**
 * Generate a customized schedule link with pre-filled information
 * @param params - Client information to pre-fill
 * @returns Full URL to the schedule page with query parameters
 */
export function generateScheduleLink(params: ScheduleLinkParams): string {
  const baseUrl = params.baseUrl || 
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.m10djcompany.com';

  const schedulePath = '/schedule';
  const queryParams = new URLSearchParams();

  // Add parameters if provided
  if (params.name) queryParams.append('name', params.name);
  if (params.email) queryParams.append('email', params.email);
  if (params.phone) queryParams.append('phone', params.phone);
  if (params.eventType) queryParams.append('eventType', params.eventType);
  if (params.eventDate) queryParams.append('eventDate', params.eventDate);
  if (params.venueName) queryParams.append('venueName', params.venueName);
  if (params.venueAddress) queryParams.append('venueAddress', params.venueAddress);
  if (params.notes) queryParams.append('notes', params.notes);

  const queryString = queryParams.toString();
  return `${baseUrl}${schedulePath}${queryString ? `?${queryString}` : ''}`;
}

/**
 * Generate a schedule link from a contact submission object
 * Useful for creating links from the admin panel
 */
export function generateScheduleLinkFromSubmission(submission: {
  name?: string;
  email?: string;
  phone?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  message?: string;
  venue_name?: string;
  venue_address?: string;
}, baseUrl?: string): string {
  return generateScheduleLink({
    name: submission.name,
    email: submission.email,
    phone: submission.phone,
    eventType: submission.event_type,
    eventDate: submission.event_date,
    venueName: submission.venue_name || submission.location,
    venueAddress: submission.venue_address,
    notes: submission.message,
    baseUrl
  });
}

/**
 * Generate a schedule link from a contact record
 * Useful for creating links from the contacts/CRM system
 */
export function generateScheduleLinkFromContact(contact: {
  first_name?: string;
  last_name?: string;
  email_address?: string;
  phone?: string;
  event_type?: string;
  event_date?: string;
  venue_name?: string;
  venue_address?: string;
  special_requests?: string;
  notes?: string;
}, baseUrl?: string): string {
  const fullName = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || undefined;

  return generateScheduleLink({
    name: fullName,
    email: contact.email_address,
    phone: contact.phone,
    eventType: contact.event_type,
    eventDate: contact.event_date,
    venueName: contact.venue_name,
    venueAddress: contact.venue_address,
    notes: contact.special_requests || contact.notes,
    baseUrl
  });
}

