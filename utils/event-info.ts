/**
 * Event Information Utilities
 * Helper functions to get event details from event IDs
 */

export interface EventInfo {
  id: string;
  name: string;
  date?: string;
  venue?: string;
  description?: string;
}

/**
 * Get human-readable event name from event ID
 */
export function getEventName(eventId: string): string {
  if (!eventId) return 'Unknown Event';

  // Known events mapping
  const knownEvents: { [key: string]: string } = {
    'dj-ben-murray-silky-osullivans-2026-12-27': "DJ Ben Murray Live at Silky O'Sullivan's",
  };

  if (knownEvents[eventId]) {
    return knownEvents[eventId];
  }

  // Fallback: format the event ID
  return eventId
    .split('-')
    .map(word => {
      // Capitalize first letter
      if (word.toLowerCase() === 'dj') return 'DJ';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Get event info object
 */
export function getEventInfo(eventId: string): EventInfo {
  if (!eventId) {
    return {
      id: '',
      name: 'Unknown Event',
    };
  }

  const knownEvents: { [key: string]: EventInfo } = {
    'dj-ben-murray-silky-osullivans-2026-12-27': {
      id: eventId,
      name: "DJ Ben Murray Live at Silky O'Sullivan's",
      date: 'December 27, 2026',
      venue: "Silky O'Sullivan's",
      description: 'Live performance on Beale Street'
    },
  };

  if (knownEvents[eventId]) {
    return knownEvents[eventId];
  }

  return {
    id: eventId,
    name: getEventName(eventId),
  };
}

/**
 * Get event date from event ID (if extractable)
 */
export function getEventDate(eventId: string): string | null {
  if (!eventId) return null;

  // Try to extract date from event ID
  // Format: event-name-YYYY-MM-DD
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

