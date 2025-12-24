/**
 * Utility to generate case study data from event database records
 * This helps convert completed events into publishable case studies
 */

/**
 * Generate a case study slug from event data
 * @param {Object} event - Event object from database
 * @returns {string} URL-friendly slug
 */
export function generateCaseStudySlug(event) {
  const venue = event.venue_name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'memphis';
  const client = event.client_name?.split(' ')[0]?.toLowerCase() || 'event';
  const year = event.event_date ? new Date(event.event_date).getFullYear() : new Date().getFullYear();
  
  return `${venue}-${client}-${year}`.replace(/--+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Generate case study title from event data
 * @param {Object} event - Event object from database
 * @returns {string} Case study title
 */
export function generateCaseStudyTitle(event) {
  const venue = event.venue_name || 'Memphis';
  const eventType = event.event_type || 'Event';
  const year = event.event_date ? new Date(event.event_date).getFullYear() : new Date().getFullYear();
  
  return `${venue} ${eventType} - ${year}`;
}

/**
 * Generate case study excerpt from event data
 * @param {Object} event - Event object from database
 * @param {Object} testimonial - Optional testimonial object
 * @returns {string} Case study excerpt
 */
export function generateCaseStudyExcerpt(event, testimonial = null) {
  if (testimonial?.testimonial_text) {
    // Use testimonial as excerpt if available
    return testimonial.testimonial_text.substring(0, 200) + '...';
  }
  
  const venue = event.venue_name || 'Memphis';
  const eventType = event.event_type || 'event';
  const guests = event.number_of_guests ? `${event.number_of_guests} guests` : '';
  
  return `A beautiful ${eventType.toLowerCase()} at ${venue}${guests ? ` with ${guests}` : ''}. See how M10 DJ Company created an unforgettable celebration.`;
}

/**
 * Generate case study highlights from event data
 * @param {Object} event - Event object from database
 * @returns {string[]} Array of highlights
 */
export function generateCaseStudyHighlights(event) {
  const highlights = [];
  
  if (event.venue_name) {
    highlights.push(`Venue: ${event.venue_name}`);
  }
  
  if (event.number_of_guests) {
    highlights.push(`${event.number_of_guests} guests`);
  }
  
  if (event.equipment_needed && event.equipment_needed.length > 0) {
    highlights.push(`Special equipment: ${event.equipment_needed.join(', ')}`);
  }
  
  if (event.special_requests) {
    highlights.push(`Special requests handled: ${event.special_requests.substring(0, 50)}...`);
  }
  
  return highlights;
}

/**
 * Generate full case study content from event data
 * @param {Object} event - Event object from database
 * @param {Object} testimonial - Optional testimonial object
 * @returns {string} HTML content for case study
 */
export function generateCaseStudyContent(event, testimonial = null) {
  const venue = event.venue_name || 'Memphis';
  const eventType = event.event_type || 'event';
  const date = event.event_date ? new Date(event.event_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
  
  let content = `<h2>About This ${eventType}</h2>`;
  content += `<p>This ${eventType.toLowerCase()} took place at ${venue}${date ? ` on ${date}` : ''}.`;
  
  if (event.number_of_guests) {
    content += ` We entertained ${event.number_of_guests} guests throughout the celebration.`;
  }
  
  content += `</p>`;
  
  if (event.special_requests) {
    content += `<h3>Special Requirements</h3>`;
    content += `<p>${event.special_requests}</p>`;
  }
  
  if (event.music_preferences) {
    content += `<h3>Music Preferences</h3>`;
    content += `<p>${event.music_preferences}</p>`;
  }
  
  if (testimonial) {
    content += `<h3>Client Feedback</h3>`;
    content += `<p>"${testimonial.testimonial_text}"</p>`;
    content += `<p><strong>— ${testimonial.client_name}</strong></p>`;
  }
  
  content += `<h3>Why This Event Was Special</h3>`;
  content += `<p>This ${eventType.toLowerCase()} at ${venue} showcased our ability to adapt to unique requirements and create a memorable experience. Our team handled every detail, from setup to the final song, ensuring a seamless celebration.</p>`;
  
  return content;
}

/**
 * Convert event database record to case study format
 * @param {Object} event - Event object from database
 * @param {Object} testimonial - Optional testimonial object
 * @returns {Object} Case study object ready for database
 */
export function eventToCaseStudy(event, testimonial = null) {
  return {
    title: generateCaseStudyTitle(event),
    slug: generateCaseStudySlug(event),
    excerpt: generateCaseStudyExcerpt(event, testimonial),
    content: generateCaseStudyContent(event, testimonial),
    event_date: event.event_date,
    event_type: event.event_type,
    venue_name: event.venue_name,
    venue_address: event.venue_address,
    number_of_guests: event.number_of_guests,
    highlights: generateCaseStudyHighlights(event),
    testimonial: testimonial ? {
      client_name: testimonial.client_name,
      testimonial_text: testimonial.testimonial_text,
      rating: testimonial.rating,
      event_date: testimonial.event_date
    } : null,
    is_published: false, // Review before publishing
    is_featured: false,
    seo_title: `${event.venue_name || 'Memphis'} ${event.event_type || 'Event'} Case Study | M10 DJ Company`,
    seo_description: `Real case study from a ${event.event_type?.toLowerCase() || 'event'} at ${event.venue_name || 'Memphis'}. See how M10 DJ Company created an unforgettable celebration.`,
    seo_keywords: [
      `${event.venue_name} wedding DJ`,
      `${event.event_type} Memphis`,
      `Memphis ${event.event_type?.toLowerCase()} DJ`,
      `${event.venue_name} DJ services`
    ].filter(Boolean)
  };
}

