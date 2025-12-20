/**
 * Generate AggregateOffer structured data for pricing intelligence
 * This helps AI search engines understand pricing ranges
 */

import { getCityPricing } from './pricingEngine';

export interface AggregateOfferData {
  '@type': 'AggregateOffer';
  priceCurrency: string;
  lowPrice?: number;
  highPrice?: number;
  offerCount?: number;
  availability?: string;
  itemCondition?: string;
  seller?: {
    '@type': string;
    name: string;
  };
}

/**
 * Generate AggregateOffer schema for a city and event type
 */
export async function generateAggregateOffer(
  city: string,
  eventType: string,
  state?: string
): Promise<AggregateOfferData | null> {
  const stats = await getCityPricing(city, eventType, state);
  
  if (!stats || stats.sample_size < 10) {
    return null;
  }
  
  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: Math.round(stats.price_low),
    highPrice: Math.round(stats.price_high),
    offerCount: stats.sample_size,
    availability: 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: 'DJ Dash'
    }
  };
}

/**
 * Generate AggregateOffer for multiple event types
 */
export async function generateMultipleAggregateOffers(
  city: string,
  eventTypes: string[],
  state?: string
): Promise<AggregateOfferData[]> {
  const offers: AggregateOfferData[] = [];
  
  for (const eventType of eventTypes) {
    const offer = await generateAggregateOffer(city, eventType, state);
    if (offer) {
      offers.push(offer);
    }
  }
  
  return offers;
}

