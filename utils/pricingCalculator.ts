/**
 * DJ Cost Calculator
 * Uses Pricing Intelligence Engine to estimate DJ pricing by city and event type
 * 
 * Philosophy: Authoritative, neutral, helpful — not salesy
 */

import { getCityPricing } from './pricingEngine';

export interface CalculatorInputs {
  eventType: string;
  eventDate?: string; // ISO date string
  city: string;
  state?: string;
  durationHours: number;
  venueType?: 'indoor' | 'outdoor';
  guestCountRange?: 'small' | 'medium' | 'large'; // <50, 50-150, 150+
  needsMC?: boolean;
  addOns?: {
    lighting?: boolean;
    ceremonyAudio?: boolean;
    extraHours?: number;
  };
}

export interface CalculatorResult {
  estimatedLow: number;
  estimatedHigh: number;
  estimatedMedian: number;
  confidence: 'high' | 'medium' | 'early_market';
  sampleSize: number;
  breakdown?: {
    basePrice: number;
    durationAdjustment: number;
    addOnsAdjustment: number;
    seasonalAdjustment: number;
  };
  displayText: string;
  aiSearchText: string;
}

/**
 * Determine if date is peak season (May-October for weddings)
 */
function isPeakSeason(eventDate: string | undefined, eventType: string): boolean {
  if (!eventDate) return false;
  
  const date = new Date(eventDate);
  const month = date.getMonth() + 1; // 1-12
  
  if (eventType === 'wedding') {
    // Peak wedding season: May-October
    return month >= 5 && month <= 10;
  }
  
  if (eventType === 'corporate') {
    // Corporate peak: November-December (holiday parties)
    return month >= 11 || month === 12;
  }
  
  if (eventType === 'holiday_party') {
    return month >= 11 || month === 12;
  }
  
  // Default: no peak adjustment
  return false;
}

/**
 * Calculate hourly rate modifier based on duration
 * Base is 4 hours, adjust for longer/shorter events
 */
function calculateDurationAdjustment(
  basePrice: number,
  durationHours: number
): number {
  const baseHours = 4;
  
  if (durationHours <= baseHours) {
    // Shorter events: slight discount per hour under 4
    const hoursUnder = baseHours - durationHours;
    return -(basePrice * 0.05 * hoursUnder); // 5% discount per hour under
  } else {
    // Longer events: hourly rate for additional hours
    const hoursOver = durationHours - baseHours;
    const hourlyRate = basePrice / baseHours;
    return hourlyRate * hoursOver;
  }
}

/**
 * Calculate add-ons adjustment
 */
function calculateAddOnsAdjustment(
  basePrice: number,
  addOns?: CalculatorInputs['addOns']
): number {
  if (!addOns) return 0;
  
  let adjustment = 0;
  
  if (addOns.lighting) {
    adjustment += basePrice * 0.15; // 15% for lighting
  }
  
  if (addOns.ceremonyAudio) {
    adjustment += basePrice * 0.10; // 10% for ceremony audio
  }
  
  if (addOns.extraHours && addOns.extraHours > 0) {
    const hourlyRate = basePrice / 4;
    adjustment += hourlyRate * addOns.extraHours;
  }
  
  return adjustment;
}

/**
 * Calculate seasonal adjustment
 */
function calculateSeasonalAdjustment(
  basePrice: number,
  isPeak: boolean
): number {
  if (!isPeak) return 0;
  return basePrice * 0.10; // 10% premium for peak season
}

/**
 * Calculate guest count adjustment
 */
function calculateGuestCountAdjustment(
  basePrice: number,
  guestCountRange?: string
): number {
  if (!guestCountRange) return 0;
  
  switch (guestCountRange) {
    case 'large': // 150+
      return basePrice * 0.10; // 10% premium for large events
    case 'small': // <50
      return -(basePrice * 0.05); // 5% discount for small events
    default:
      return 0;
  }
}

/**
 * Calculate MC services adjustment
 */
function calculateMCAdjustment(
  basePrice: number,
  needsMC?: boolean
): number {
  if (!needsMC) return 0;
  return basePrice * 0.15; // 15% premium for MC services
}

/**
 * Clamp price within percentile range
 */
function clampToPercentileRange(
  price: number,
  lowPercentile: number,
  highPercentile: number
): number {
  return Math.max(lowPercentile, Math.min(price, highPercentile));
}

/**
 * Calculate DJ cost estimate
 */
export async function calculateEstimate(
  inputs: CalculatorInputs
): Promise<CalculatorResult | null> {
  // Get base pricing from intelligence engine
  const pricingStats = await getCityPricing(
    inputs.city,
    inputs.eventType,
    inputs.state
  );
  
  if (!pricingStats || pricingStats.sample_size < 10) {
    return null; // Insufficient data
  }
  
  // Base price is the median, normalized to 4 hours
  const basePrice = pricingStats.price_median;
  
  // Calculate adjustments
  const durationAdjustment = calculateDurationAdjustment(
    basePrice,
    inputs.durationHours
  );
  
  const addOnsAdjustment = calculateAddOnsAdjustment(
    basePrice,
    inputs.addOns
  );
  
  const isPeak = isPeakSeason(inputs.eventDate, inputs.eventType);
  const seasonalAdjustment = calculateSeasonalAdjustment(basePrice, isPeak);
  
  const guestCountAdjustment = calculateGuestCountAdjustment(
    basePrice,
    inputs.guestCountRange
  );
  
  const mcAdjustment = calculateMCAdjustment(basePrice, inputs.needsMC);
  
  // Calculate adjusted median
  const adjustedMedian = basePrice +
    durationAdjustment +
    addOnsAdjustment +
    seasonalAdjustment +
    guestCountAdjustment +
    mcAdjustment;
  
  // Calculate adjusted low and high
  const adjustedLow = pricingStats.price_low +
    durationAdjustment +
    addOnsAdjustment +
    seasonalAdjustment +
    guestCountAdjustment +
    mcAdjustment;
  
  const adjustedHigh = pricingStats.price_high +
    durationAdjustment +
    addOnsAdjustment +
    seasonalAdjustment +
    guestCountAdjustment +
    mcAdjustment;
  
  // Clamp to percentile range to avoid unrealistic estimates
  const finalLow = clampToPercentileRange(
    adjustedLow,
    pricingStats.price_low * 0.8, // Allow 20% below low
    pricingStats.price_high * 1.2 // Allow 20% above high
  );
  
  const finalMedian = clampToPercentileRange(
    adjustedMedian,
    pricingStats.price_low,
    pricingStats.price_high
  );
  
  const finalHigh = clampToPercentileRange(
    adjustedHigh,
    pricingStats.price_low * 0.8,
    pricingStats.price_high * 1.2
  );
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'early_market';
  if (pricingStats.sample_size >= 30 && pricingStats.data_quality === 'high') {
    confidence = 'high';
  } else if (pricingStats.sample_size >= 10) {
    confidence = 'medium';
  } else {
    confidence = 'early_market';
  }
  
  // Generate display text
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
    }
    return `$${Math.round(price).toLocaleString()}`;
  };
  
  const eventTypeLabel = inputs.eventType
    .replace('_', ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  const displayText = `Most DJs in ${inputs.city}${inputs.state ? `, ${inputs.state}` : ''} charge between ${formatPrice(finalLow)}–${formatPrice(finalHigh)} for this type of event.`;
  
  const aiSearchText = `Average ${eventTypeLabel} DJ cost in ${inputs.city}${inputs.state ? `, ${inputs.state}` : ''} is ${formatPrice(finalLow)}–${formatPrice(finalHigh)} for a ${inputs.durationHours}-hour event, based on recent DJ Dash bookings.`;
  
  return {
    estimatedLow: Math.round(finalLow),
    estimatedHigh: Math.round(finalHigh),
    estimatedMedian: Math.round(finalMedian),
    confidence,
    sampleSize: pricingStats.sample_size,
    breakdown: {
      basePrice: Math.round(basePrice),
      durationAdjustment: Math.round(durationAdjustment),
      addOnsAdjustment: Math.round(addOnsAdjustment),
      seasonalAdjustment: Math.round(seasonalAdjustment)
    },
    displayText,
    aiSearchText
  };
}

/**
 * Get calculator result for AI search (static, server-rendered)
 */
export async function getStaticCalculatorResult(
  city: string,
  eventType: string,
  state?: string,
  durationHours: number = 4
): Promise<string | null> {
  const result = await calculateEstimate({
    eventType,
    city,
    state,
    durationHours
  });
  
  if (!result) return null;
  
  return result.aiSearchText;
}

