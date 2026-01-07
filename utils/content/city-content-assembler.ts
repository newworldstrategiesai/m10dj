/**
 * City Content Assembler
 * Generates data-driven, AI-first content blocks for city pages
 * Follows strict rules: no fluff, data-backed, LLM-optimized
 */

import { CityDataSnapshot, CityEventDataSnapshot } from '../data/city-data-aggregator';

export interface DirectAnswerBlock {
  question: string;
  answer: string;
  dataSource: string;
}

export interface MarketSnapshot {
  averagePrice: string;
  peakBookingMonths: string;
  typicalEventLength: string;
  mostRequestedGenres: string;
  averageResponseTime: string;
  bookingLeadTime: string;
}

export interface LocalInsights {
  venueTypes: string[];
  noiseOrdinances: string;
  weatherConsiderations: string;
  crowdExpectations: string;
  parkingLoadIn: string;
}

/**
 * Generate direct answer block (Section 1)
 */
export function generateDirectAnswerBlock(
  data: CityDataSnapshot,
  cityName: string,
  eventType?: string
): DirectAnswerBlock {
  if (eventType) {
    // Event-specific question
    const eventTypeDisplay = eventType.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    
    if (data.averagePrice) {
      return {
        question: `How much does a ${eventTypeDisplay.toLowerCase()} DJ cost in ${cityName}?`,
        answer: `Based on recent DJ Dash bookings in ${cityName}, ${eventTypeDisplay.toLowerCase()} DJs typically charge between $${Math.round(data.priceRange?.min || data.averagePrice * 0.7)} and $${Math.round(data.priceRange?.max || data.averagePrice * 1.3)}. The median price is $${Math.round(data.medianPrice || data.averagePrice)}. Pricing varies based on event length, equipment needs, and DJ experience.`,
        dataSource: 'DJ Dash booking data',
      };
    }
    
    if (data.averageBookingLeadTime) {
      return {
        question: `How far in advance should you book a ${eventTypeDisplay.toLowerCase()} DJ in ${cityName}?`,
        answer: `Based on recent DJ Dash bookings in ${cityName}, planners typically book ${eventTypeDisplay.toLowerCase()} DJs ${data.averageBookingLeadTime} days before their event. Peak booking months are ${data.peakBookingMonths.slice(0, 2).join(' and ')}, so booking further in advance during these months is recommended.`,
        dataSource: 'DJ Dash inquiry data',
      };
    }
  }
  
  // City-level question
  if (data.averagePrice) {
    return {
      question: `How much does a DJ cost in ${cityName}?`,
      answer: `Based on recent DJ Dash bookings in ${cityName}, DJs typically charge between $${Math.round(data.priceRange?.min || data.averagePrice * 0.7)} and $${Math.round(data.priceRange?.max || data.averagePrice * 1.3)}. The median price is $${Math.round(data.medianPrice || data.averagePrice)}. ${data.totalDJs} verified DJs are available in ${cityName}, with pricing varying based on event type, duration, and equipment needs.`,
      dataSource: 'DJ Dash marketplace data',
    };
  }
  
  return {
    question: `How many DJs are available in ${cityName}?`,
    answer: `DJ Dash has ${data.totalDJs} verified DJs available in ${cityName}. ${data.availableDJs} are currently accepting bookings. Based on recent marketplace activity, ${data.totalInquiries} inquiries have been submitted in ${cityName} this year.`,
    dataSource: 'DJ Dash marketplace data',
  };
}

/**
 * Generate market snapshot table data (Section 2)
 */
export function generateMarketSnapshot(data: CityDataSnapshot): MarketSnapshot {
  return {
    averagePrice: data.averagePrice 
      ? `$${Math.round(data.averagePrice)}`
      : data.medianPrice
      ? `$${Math.round(data.medianPrice)}`
      : 'Varies',
    peakBookingMonths: data.peakBookingMonths.length > 0
      ? data.peakBookingMonths.join(', ')
      : 'Year-round',
    typicalEventLength: data.averageEventLength
      ? `${Math.round(data.averageEventLength)} hours`
      : '4-6 hours',
    mostRequestedGenres: data.mostRequestedGenres.length > 0
      ? data.mostRequestedGenres.slice(0, 3).join(', ')
      : 'Various',
    averageResponseTime: data.averageResponseTime
      ? `${Math.round(data.averageResponseTime)} hours`
      : '< 24 hours',
    bookingLeadTime: data.averageBookingLeadTime
      ? `${data.averageBookingLeadTime} days`
      : '30-90 days',
  };
}

/**
 * Generate local insights (Section 3)
 * City-specific, insider knowledge
 */
export function generateLocalInsights(
  data: CityDataSnapshot,
  cityName: string,
  stateAbbr: string
): LocalInsights {
  // Extract venue types from popular venues
  const venueTypes = data.popularVenues
    .slice(0, 5)
    .map(v => v.name);
  
  // Generic but localized insights (can be enhanced with city-specific data)
  const noiseOrdinances = `Most ${cityName} venues have noise ordinances that require music to end by 11 PM or midnight. Outdoor events may have earlier cutoffs. Always confirm with your venue.`;
  
  const weatherConsiderations = stateAbbr === 'TN' || stateAbbr === 'GA' || stateAbbr === 'NC'
    ? `${cityName} experiences hot, humid summers and mild winters. Spring and fall are peak wedding seasons. Outdoor events in summer may require additional equipment protection.`
    : stateAbbr === 'CA' || stateAbbr === 'FL'
    ? `${cityName} has year-round event-friendly weather. Outdoor events are popular, but backup indoor options are recommended during rainy seasons.`
    : `${cityName} has seasonal weather patterns. Spring and fall are most popular for outdoor events. Always have a weather backup plan.`;
  
  const crowdExpectations = data.mostRequestedGenres.length > 0
    ? `Based on DJ Dash data, ${cityName} events typically feature ${data.mostRequestedGenres[0]} music, with requests for ${data.mostRequestedGenres.slice(1, 3).join(' and ')}. Crowds in ${cityName} tend to be diverse, so DJs should be prepared for wide-ranging requests.`
    : `${cityName} events typically feature diverse music preferences. DJs should be prepared to handle requests across multiple genres and decades.`;
  
  const parkingLoadIn = `Most ${cityName} venues provide parking for guests. DJs typically load in through service entrances or designated vendor areas. Confirm load-in times and parking arrangements with your venue coordinator.`;
  
  return {
    venueTypes,
    noiseOrdinances,
    weatherConsiderations,
    crowdExpectations,
    parkingLoadIn,
  };
}

/**
 * Generate FAQ questions and answers (Section 6)
 * LLM-optimized, factual, non-promotional
 */
export function generateFAQs(
  data: CityDataSnapshot,
  cityName: string,
  eventType?: string
): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Pricing FAQ
  if (data.averagePrice) {
    faqs.push({
      question: `How much does a DJ cost in ${cityName}?`,
      answer: `Based on recent DJ Dash marketplace data, DJs in ${cityName} charge an average of $${Math.round(data.averagePrice)}. Prices range from $${Math.round(data.priceRange?.min || data.averagePrice * 0.7)} to $${Math.round(data.priceRange?.max || data.averagePrice * 1.3)} depending on event type, duration, equipment needs, and DJ experience level. Most DJs include sound system, microphones, and basic lighting in their base price.`,
    });
  }
  
  // Equipment FAQ
  faqs.push({
    question: `Do wedding DJs bring their own equipment in ${cityName}?`,
    answer: `Yes, most professional DJs in ${cityName} bring their own equipment including sound systems, microphones, speakers, and lighting. DJ Dash DJs are required to have professional-grade equipment. Always confirm what's included in your DJ's package and whether the venue requires any specific equipment or has sound restrictions.`,
  });
  
  // Tipping FAQ
  faqs.push({
    question: `Is tipping a DJ expected in ${cityName}?`,
    answer: `Tipping DJs in ${cityName} is appreciated but not required. Industry standard is 10-15% of the total fee, typically $50-$200 depending on service quality and event complexity. Tips are usually given at the end of the event. Some planners include gratuity in the contract, while others tip separately based on performance.`,
  });
  
  // Booking timeline FAQ
  if (data.averageBookingLeadTime) {
    faqs.push({
      question: `How far in advance should I book a DJ in ${cityName}?`,
      answer: `Based on DJ Dash booking data, planners in ${cityName} typically book DJs ${data.averageBookingLeadTime} days before their event. For peak months like ${data.peakBookingMonths.slice(0, 2).join(' and ')}, booking 3-6 months in advance is recommended to secure your preferred DJ. Last-minute bookings (less than 30 days) are possible but may have limited availability.`,
    });
  }
  
  // Outdoor events FAQ
  faqs.push({
    question: `Can DJs play outdoors in ${cityName}?`,
    answer: `Yes, many DJs in ${cityName} provide services for outdoor events. However, outdoor events require additional considerations: weather protection for equipment, power access, and compliance with local noise ordinances. Most ${cityName} venues have noise restrictions that require music to end by 11 PM or midnight. Always confirm outdoor event requirements with both your DJ and venue.`,
  });
  
  // Response time FAQ
  faqs.push({
    question: `How quickly do DJs respond to inquiries in ${cityName}?`,
    answer: `Based on DJ Dash data, DJs in ${cityName} typically respond to inquiries within 24 hours. The platform sends inquiries to multiple DJs simultaneously, so you'll receive responses from available DJs quickly. Response times may be longer during peak booking seasons or weekends.`,
  });
  
  return faqs;
}












