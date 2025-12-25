/**
 * Comprehensive Event Details Utility
 * Provides detailed event information including venue info, instructions, etc.
 */

export interface EventDetails {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  parking?: {
    info: string;
    cost?: string;
  };
  policies?: string[];
  contact?: {
    phone?: string;
    email?: string;
  };
  additionalInfo?: string;
}

/**
 * Get comprehensive event details by event ID
 */
export function getEventDetails(eventId: string): EventDetails {
  if (!eventId) {
    return getDefaultEventDetails();
  }

  const knownEvents: { [key: string]: EventDetails } = {
    'dj-ben-murray-silky-osullivans-2026-12-27': {
      id: eventId,
      name: "DJ Ben Murray Live at Silky O'Sullivan's",
      date: 'December 27, 2026',
      time: '10:00 PM',
      venue: "Silky O'Sullivan's",
      address: '183 Beale St',
      city: 'Memphis',
      state: 'TN',
      zip: '38103',
      description: 'Live DJ performance on Beale Street. Open to the public.',
      parking: {
        info: 'Parking is available in nearby lots and garages. Street parking may be limited. We recommend arriving early or using ride-sharing services.',
        cost: 'Parking fees vary by location ($5-$20)'
      },
      policies: [
        'Must be 21+ to enter',
        'Valid ID required at door',
        'No outside food or beverages',
        'Smoking allowed on outdoor patio',
        'Dress code: Casual attire welcome'
      ],
      contact: {
        phone: '(901) 410-2020',
        email: 'info@m10djcompany.com'
      },
      additionalInfo: "Located in the heart of Beale Street, Silky O'Sullivan's is one of Memphis's most iconic venues. Enjoy great music, food, and drinks in an authentic Beale Street atmosphere."
    },
  };

  if (knownEvents[eventId]) {
    return knownEvents[eventId];
  }

  // Fallback: try to extract basic info from event ID
  return {
    id: eventId,
    name: formatEventName(eventId),
    date: extractDate(eventId) || 'TBD',
    time: 'TBD',
    venue: 'TBD',
    address: 'TBD',
    contact: {
      phone: '(901) 410-2020',
      email: 'info@m10djcompany.com'
    }
  };
}

/**
 * Format event ID into readable name
 */
function formatEventName(eventId: string): string {
  return eventId
    .split('-')
    .map(word => {
      if (word.toLowerCase() === 'dj') return 'DJ';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Extract date from event ID (format: event-name-YYYY-MM-DD)
 */
function extractDate(eventId: string): string | null {
  const dateMatch = eventId.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const date = new Date(`${year}-${month}-${day}`);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return null;
}

/**
 * Get default event details when event ID is unknown
 */
function getDefaultEventDetails(): EventDetails {
  return {
    id: '',
    name: 'Unknown Event',
    date: 'TBD',
    time: 'TBD',
    venue: 'TBD',
    address: 'TBD',
    contact: {
      phone: '(901) 410-2020',
      email: 'info@m10djcompany.com'
    }
  };
}

/**
 * Get full address string
 */
export function getFullAddress(eventDetails: EventDetails): string {
  const parts = [
    eventDetails.address,
    eventDetails.city,
    eventDetails.state,
    eventDetails.zip
  ].filter(Boolean);
  
  return parts.join(', ') || eventDetails.address || 'Address TBD';
}

