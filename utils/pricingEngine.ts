/**
 * Pricing Intelligence Engine
 * Aggregates real inquiry and booking data to provide market-based pricing insights
 * 
 * Core Philosophy: Pricing must be data-backed, not opinion-based.
 * Always hedge claims with "based on recent DJ Dash bookings."
 */

import { createClient } from '@/utils/supabase/server';

export interface CityPricingStats {
  city: string;
  state?: string;
  event_type: string;
  price_low: number; // 25th percentile
  price_median: number; // 50th percentile
  price_high: number; // 75th percentile
  price_average: number;
  sample_size: number;
  data_quality: 'high' | 'medium' | 'low';
  trend_direction?: 'rising' | 'stable' | 'declining';
  trend_percentage?: number;
  period_start: string;
  period_end: string;
  computed_at: string;
}

export interface PricingRange {
  low: number;
  median: number;
  high: number;
  formatted: string; // "$900-$1,600"
}

export interface DJPricingInsight {
  dj_profile_id: string;
  city: string;
  state?: string;
  event_type: string;
  dj_current_price: number;
  market_position: 'below_market' | 'market_aligned' | 'premium';
  position_percentage: number;
  market_median: number;
  market_low: number;
  market_high: number;
  market_range_text: string;
  insight_text: string;
  positioning_text: string;
}

/**
 * Normalize pricing to 4-hour equivalent for comparison
 */
export function normalizePriceTo4Hour(
  price: number,
  pricingModel: 'flat' | 'hourly' | 'tiered' | 'custom',
  durationHours: number = 4
): number {
  if (pricingModel === 'flat' || durationHours === 4) {
    return price;
  }
  
  if (pricingModel === 'hourly') {
    return price * 4;
  }
  
  // Tiered packages are assumed to be for standard 4-hour events
  if (pricingModel === 'tiered') {
    return price;
  }
  
  // Default: assume flat rate
  return price;
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  
  const index = Math.ceil(percentile * sortedValues.length) - 1;
  const clampedIndex = Math.max(0, Math.min(index, sortedValues.length - 1));
  return sortedValues[clampedIndex];
}

/**
 * Determine data quality based on sample size
 */
function determineDataQuality(sampleSize: number): 'high' | 'medium' | 'low' {
  if (sampleSize >= 30) return 'high';
  if (sampleSize >= 10) return 'medium';
  return 'low';
}

/**
 * Format price range for display
 */
export function formatPriceRange(low: number, high: number): string {
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
    }
    return `$${Math.round(price)}`;
  };
  
  return `${formatPrice(low)}–${formatPrice(high)}`;
}

/**
 * Get city pricing statistics
 */
export async function getCityPricing(
  city: string,
  eventType?: string,
  state?: string
): Promise<CityPricingStats | null> {
  const supabase = createClient();
  
  // Query cached stats (most recent)
  // Type assertion needed because city_pricing_stats table may not be in generated types yet
  let query = (supabase
    .from('city_pricing_stats' as any) as any)
    .select('*')
    .eq('city', city)
    .eq('product_context', 'djdash')
    .gte('sample_size', 10) // Minimum sample size
    .in('data_quality', ['high', 'medium'])
    .order('computed_at', { ascending: false })
    .limit(1) as any;
  
  if (state) {
    query = query.eq('state', state);
  } else {
    query = query.is('state', null);
  }
  
  if (eventType) {
    query = query.eq('event_type', eventType);
  }
  
  const { data, error } = await query;
  
  if (error || !data || data.length === 0) {
    return null;
  }
  
  return data[0] as CityPricingStats;
}

/**
 * Get pricing range for display
 */
export async function getCityPricingRange(
  city: string,
  eventType: string,
  state?: string
): Promise<PricingRange | null> {
  const stats = await getCityPricing(city, eventType, state);
  
  if (!stats) {
    return null;
  }
  
  return {
    low: stats.price_low,
    median: stats.price_median,
    high: stats.price_high,
    formatted: formatPriceRange(stats.price_low, stats.price_high)
  };
}

/**
 * Compute and cache city pricing statistics
 * This should be run daily via cron job
 */
export async function computeCityPricingStats(
  city: string,
  eventType: string,
  state?: string,
  daysBack: number = 90
): Promise<CityPricingStats | null> {
  const supabase = createClient();
  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - daysBack);
  
  // Collect pricing data from multiple sources
  const prices: number[] = [];
  
  // 1. From dj_inquiries (budget_amount, budget_range)
  // Type assertion needed because dj_inquiries table may not be in generated types yet
  const { data: inquiries } = await ((supabase
    .from('dj_inquiries' as any) as any)
    .select('budget_amount, budget_range, event_type, created_at')
    .eq('event_type', eventType)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())
    .not('budget_amount', 'is', null)
    .limit(1000) as any);
  
  if (inquiries) {
    for (const inquiry of inquiries as any[]) {
      if (inquiry.budget_amount) {
        // Normalize to 4-hour (assuming flat rate for inquiries)
        prices.push(inquiry.budget_amount);
      } else if (inquiry.budget_range) {
        // Parse budget range (e.g., "$1,000-$2,500")
        const rangeMatch = inquiry.budget_range.match(/\$?([\d,]+)/g);
        if (rangeMatch && rangeMatch.length >= 1) {
          const minPrice = parseFloat(rangeMatch[0].replace(/[$,]/g, ''));
          if (minPrice) {
            prices.push(minPrice);
          }
        }
      }
    }
  }
  
  // 2. From contacts (quoted_price, final_price) - converted inquiries
  // Type assertion needed because contacts table may not be in generated types yet
  const { data: contacts } = await ((supabase
    .from('contacts' as any) as any)
    .select('quoted_price, final_price, event_type, city, state, created_at')
    .eq('event_type', eventType)
    .gte('created_at', periodStart.toISOString())
    .lte('created_at', periodEnd.toISOString())
    .or('quoted_price.not.is.null,final_price.not.is.null')
    .limit(1000) as any);
  
  if (contacts) {
    for (const contact of contacts as any[]) {
      // Filter by city if provided
      if (city && contact.city?.toLowerCase() !== city.toLowerCase()) {
        continue;
      }
      if (state && contact.state?.toLowerCase() !== state.toLowerCase()) {
        continue;
      }
      
      // Prefer final_price, fallback to quoted_price
      const price = contact.final_price || contact.quoted_price;
      if (price) {
        // Normalize to 4-hour (assuming flat rate)
        prices.push(price);
      }
    }
  }
  
  // 3. From dj_profiles (price_range_min, price_range_max)
  const { data: profiles } = await supabase
    .from('dj_profiles')
    .select('price_range_min, price_range_max, city, state, event_types')
    .contains('event_types', [eventType])
    .not('price_range_min', 'is', null);
  
  if (profiles) {
    for (const profile of profiles as any[]) {
      // Filter by city if provided
      if (city && profile.city?.toLowerCase() !== city.toLowerCase()) {
        continue;
      }
      if (state && profile.state?.toLowerCase() !== state.toLowerCase()) {
        continue;
      }
      
      if (profile.price_range_min) {
        prices.push(profile.price_range_min);
      }
      if (profile.price_range_max) {
        prices.push(profile.price_range_max);
      }
    }
  }
  
  // Remove outliers (values outside 1.5 * IQR)
  const sortedPrices = prices.sort((a, b) => a - b);
  if (sortedPrices.length < 10) {
    return null; // Insufficient data
  }
  
  const q1 = calculatePercentile(sortedPrices, 0.25);
  const q3 = calculatePercentile(sortedPrices, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const filteredPrices = sortedPrices.filter(
    price => price >= lowerBound && price <= upperBound
  );
  
  if (filteredPrices.length < 10) {
    return null; // Insufficient data after outlier removal
  }
  
  // Calculate statistics
  const priceLow = calculatePercentile(filteredPrices, 0.25);
  const priceMedian = calculatePercentile(filteredPrices, 0.50);
  const priceHigh = calculatePercentile(filteredPrices, 0.75);
  const priceAverage = filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length;
  
  const sampleSize = filteredPrices.length;
  const dataQuality = determineDataQuality(sampleSize);
  const outlierCount = sortedPrices.length - filteredPrices.length;
  
  // Calculate trend (compare to previous period)
  const previousPeriodStart = new Date(periodStart);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - daysBack);
  
  // Type assertion needed because city_pricing_stats table may not be in generated types yet
  const { data: previousStats } = await ((supabase
    .from('city_pricing_stats' as any) as any)
    .select('price_median')
    .eq('city', city)
    .eq('event_type', eventType)
    .eq('product_context', 'djdash')
    .gte('period_start', previousPeriodStart.toISOString())
    .lte('period_end', periodStart.toISOString())
    .order('computed_at', { ascending: false })
    .limit(1) as any);
  
  let trendDirection: 'rising' | 'stable' | 'declining' = 'stable';
  let trendPercentage: number | undefined;
  
  const typedPreviousStats = previousStats as any[];
  if (typedPreviousStats && typedPreviousStats.length > 0 && typedPreviousStats[0].price_median) {
    const previousMedian = typedPreviousStats[0].price_median;
    const change = ((priceMedian - previousMedian) / previousMedian) * 100;
    trendPercentage = parseFloat(change.toFixed(2));
    
    if (change > 5) {
      trendDirection = 'rising';
    } else if (change < -5) {
      trendDirection = 'declining';
    }
  }
  
  // Save to database
  const statsData = {
    city,
    state: state || null,
    event_type: eventType,
    price_low: priceLow,
    price_median: priceMedian,
    price_high: priceHigh,
    price_average: priceAverage,
    sample_size: sampleSize,
    data_quality: dataQuality,
    min_sample_size: 10,
    trend_direction: trendDirection,
    trend_percentage: trendPercentage,
    period_start: periodStart.toISOString().split('T')[0],
    period_end: periodEnd.toISOString().split('T')[0],
    data_sources: {
      inquiries: inquiries?.length || 0,
      contacts: contacts?.length || 0,
      profiles: profiles?.length || 0
    },
    outlier_count: outlierCount,
    product_context: 'djdash'
  };
  
  // Type assertion needed because city_pricing_stats table may not be in generated types yet
  const { data: savedStats, error } = await ((supabase
    .from('city_pricing_stats' as any) as any)
    .upsert(statsData, {
      onConflict: 'city,state,event_type,period_start,period_end,product_context'
    } as any)
    .select()
    .single() as any);
  
  if (error) {
    console.error('Error saving pricing stats:', error);
    return null;
  }
  
  // Save to history
  // Type assertion needed because pricing_history table may not be in generated types yet
  await ((supabase
    .from('pricing_history' as any) as any)
    .upsert({
      city,
      state: state || null,
      event_type: eventType,
      price_median: priceMedian,
      price_low: priceLow,
      price_high: priceHigh,
      sample_size: sampleSize,
      snapshot_date: periodEnd.toISOString().split('T')[0],
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      product_context: 'djdash'
    } as any, {
      onConflict: 'city,state,event_type,snapshot_date,product_context'
    } as any) as any);
  
  return savedStats as CityPricingStats;
}

/**
 * Get DJ pricing insights comparing their rates to market
 */
export async function getDJPricingInsight(
  djProfileId: string,
  city: string,
  eventType: string,
  state?: string
): Promise<DJPricingInsight | null> {
  const supabase = createClient();
  
  // Get DJ's current pricing
  // Type assertion needed because dj_profiles table may not be in generated types yet
  const { data: profile } = await ((supabase
    .from('dj_profiles' as any) as any)
    .select('price_range_min, price_range_max, event_types')
    .eq('id', djProfileId)
    .single() as any);
  
  const typedProfile = profile as any;
  if (!typedProfile || !typedProfile.price_range_min) {
    return null;
  }
  
  // Use median of DJ's range as current price
  const djCurrentPrice = typedProfile.price_range_min + 
    ((typedProfile.price_range_max || typedProfile.price_range_min) - typedProfile.price_range_min) / 2;
  
  // Get market stats
  const marketStats = await getCityPricing(city, eventType, state);
  if (!marketStats) {
    return null;
  }
  
  // Type assertion for marketStats to access id property
  const typedMarketStats = marketStats as any;
  
  // Calculate market position
  const positionPercentage = ((djCurrentPrice - typedMarketStats.price_median) / typedMarketStats.price_median) * 100;
  let marketPosition: 'below_market' | 'market_aligned' | 'premium';
  
  if (positionPercentage < -10) {
    marketPosition = 'below_market';
  } else if (positionPercentage > 10) {
    marketPosition = 'premium';
  } else {
    marketPosition = 'market_aligned';
  }
  
  // Generate insight text
  const marketRange = formatPriceRange(typedMarketStats.price_low, typedMarketStats.price_high);
  const insightText = `DJs in ${city}${state ? `, ${state}` : ''} typically charge ${marketRange} for ${eventType} events, based on recent DJ Dash bookings.`;
  
  const absPercentage = Math.abs(positionPercentage);
  const positioningText = positionPercentage < 0
    ? `You are currently priced ${absPercentage.toFixed(0)}% below the city median.`
    : positionPercentage > 0
    ? `You are currently priced ${absPercentage.toFixed(0)}% above the city median.`
    : `Your pricing aligns with the city median.`;
  
  // Save or update insight
  const insightData = {
    dj_profile_id: djProfileId,
    city,
    state: state || null,
    event_type: eventType,
    dj_current_price: djCurrentPrice,
    market_position: marketPosition,
    position_percentage: parseFloat(positionPercentage.toFixed(2)),
    market_median: typedMarketStats.price_median,
    market_low: typedMarketStats.price_low,
    market_high: typedMarketStats.price_high,
    market_range_text: marketRange,
    insight_text: insightText,
    positioning_text: positioningText,
    stats_snapshot_id: typedMarketStats.id || null
  };
  
  // Type assertion needed because dj_pricing_insights table may not be in generated types yet
  const { data: savedInsight, error } = await ((supabase
    .from('dj_pricing_insights' as any) as any)
    .upsert(insightData, {
      onConflict: 'dj_profile_id,city,state,event_type'
    } as any)
    .select()
    .single() as any);
  
  if (error) {
    console.error('Error saving pricing insight:', error);
    return null;
  }
  
  return savedInsight as DJPricingInsight;
}

/**
 * Get formatted pricing text for display
 */
export function getPricingDisplayText(
  city: string,
  eventType: string,
  stats: CityPricingStats
): string {
  const range = formatPriceRange(stats.price_low, stats.price_high);
  const eventTypeLabel = eventType.replace('_', ' ');
  
  return `${eventTypeLabel.charAt(0).toUpperCase() + eventTypeLabel.slice(1)} DJs in ${city} typically cost between ${range}, with a median price of $${Math.round(stats.price_median).toLocaleString()}, based on recent DJ Dash bookings.`;
}

/**
 * Pricing Guidance Response Interface
 * Legal-safe pricing suggestions with disclaimers
 */
export interface PricingGuidance {
  city: string;
  state?: string;
  event_type: string;
  
  // Market Data (Anonymized)
  market_range: {
    low: number;
    median: number;
    high: number;
    formatted: string; // "$900-$1,600"
  };
  
  // Suggested Range (median ± 20%, adjustable)
  suggested_range: {
    low: number;
    high: number;
    formatted: string;
  };
  
  // Data Quality Indicators
  sample_size: number;
  data_quality: 'high' | 'medium' | 'low';
  last_updated: string;
  
  // Legal Disclaimers (REQUIRED)
  disclaimer: string;
  data_source_note: string;
  
  // Educational Context
  educational_notes: {
    higher_pricing_impact: string;
    lower_pricing_impact: string;
  };
  
  // DJ's Current Position (if provided)
  dj_comparison?: {
    current_price: number;
    market_position: 'below_market' | 'market_aligned' | 'premium';
    position_percentage: number;
    positioning_text: string;
  };
}

/**
 * Calculate suggested pricing range based on market median
 * Returns median ± 20% (adjustable via variance parameter)
 */
export function calculateSuggestedRange(
  median: number,
  variance: number = 0.20
): { low: number; high: number; formatted: string } {
  const low = Math.max(0, Math.floor(median * (1 - variance)));
  const high = Math.ceil(median * (1 + variance));
  
  // Round to nearest 50 for cleaner display
  const roundedLow = Math.floor(low / 50) * 50;
  const roundedHigh = Math.ceil(high / 50) * 50;
  
  return {
    low: roundedLow,
    high: roundedHigh,
    formatted: formatPriceRange(roundedLow, roundedHigh)
  };
}

/**
 * Get pricing guidance for a DJ (legal-safe, with disclaimers)
 * This is the main function for the pricing guidance API
 */
export async function getPricingGuidance(
  city: string,
  eventType: string,
  state?: string,
  djProfileId?: string,
  djCurrentPrice?: number
): Promise<PricingGuidance | null> {
  const supabase = createClient();
  
  // Get market stats
  const marketStats = await getCityPricing(city, eventType, state);
  
  if (!marketStats || marketStats.sample_size < 10) {
    return null; // Insufficient data
  }
  
  // Calculate suggested range (median ± 20%)
  const suggestedRange = calculateSuggestedRange(marketStats.price_median, 0.20);
  
  // Format market range
  const marketRange = {
    low: marketStats.price_low,
    median: marketStats.price_median,
    high: marketStats.price_high,
    formatted: formatPriceRange(marketStats.price_low, marketStats.price_high)
  };
  
  // Legal disclaimers (REQUIRED)
  const disclaimer = "The following pricing is based on anonymized local market data from DJ Dash bookings. This information is provided for informational purposes only. You are not required to follow any suggested pricing. Pricing decisions are entirely at your discretion.";
  
  const dataSourceNote = `Based on ${marketStats.sample_size} anonymized bookings in ${city}${state ? `, ${state}` : ''} over the past 90 days. Individual competitor pricing is never disclosed.`;
  
  // Educational context
  const educationalNotes = {
    higher_pricing_impact: "Higher prices may reduce lead match volume but can increase per-booking margin and attract premium clients.",
    lower_pricing_impact: "Lower prices may increase lead match volume but could reduce per-booking margin. Consider your capacity and business goals."
  };
  
  // DJ comparison (if provided)
  let djComparison: PricingGuidance['dj_comparison'] | undefined;
  
  if (djProfileId && djCurrentPrice) {
    const positionPercentage = ((djCurrentPrice - marketStats.price_median) / marketStats.price_median) * 100;
    let marketPosition: 'below_market' | 'market_aligned' | 'premium';
    
    if (positionPercentage < -10) {
      marketPosition = 'below_market';
    } else if (positionPercentage > 10) {
      marketPosition = 'premium';
    } else {
      marketPosition = 'market_aligned';
    }
    
    const absPercentage = Math.abs(positionPercentage);
    const positioningText = positionPercentage < 0
      ? `You are currently priced ${absPercentage.toFixed(0)}% below the city median.`
      : positionPercentage > 0
      ? `You are currently priced ${absPercentage.toFixed(0)}% above the city median.`
      : `Your pricing aligns with the city median.`;
    
    djComparison = {
      current_price: djCurrentPrice,
      market_position: marketPosition,
      position_percentage: parseFloat(positionPercentage.toFixed(2)),
      positioning_text: positioningText
    };
  }
  
  return {
    city,
    state: state || undefined,
    event_type: eventType,
    market_range: marketRange,
    suggested_range: suggestedRange,
    sample_size: marketStats.sample_size,
    data_quality: marketStats.data_quality,
    last_updated: marketStats.computed_at,
    disclaimer,
    data_source_note: dataSourceNote,
    educational_notes: educationalNotes,
    dj_comparison: djComparison
  };
}

