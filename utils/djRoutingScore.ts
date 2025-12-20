/**
 * DJ Routing Score Calculator
 * Ranks DJs fairly without price fixing
 * 
 * Components:
 * - Tier weight
 * - Response speed
 * - Conversion rate
 * - Price alignment vs city median
 * - Trust score
 * - Recent lead penalty (decays over time)
 */

import { createClient } from '@/utils/supabase/server';

export interface DJRoutingMetrics {
  dj_profile_id: string;
  pricing_tier: 'premium' | 'standard' | 'budget';
  response_speed_avg_seconds?: number;
  conversion_rate?: number;
  reliability_score: number;
  recent_lead_penalty: number;
  price_range_midpoint?: number;
}

export interface RoutingScoreComponents {
  tier_weight: number;
  response_speed_score: number;
  conversion_rate_score: number;
  price_alignment_score: number;
  trust_score: number;
  penalty_adjustment: number;
  total: number;
}

export interface RoutingScoreResult {
  routing_score: number;
  components: RoutingScoreComponents;
  explanation: string;
}

/**
 * Calculate tier weight (0-25 points)
 */
function calculateTierWeight(tier: string): number {
  const weights: Record<string, number> = {
    'premium': 25,
    'standard': 20,
    'budget': 15
  };
  
  return weights[tier] || 15;
}

/**
 * Calculate response speed score (0-20 points)
 * Faster responses = higher score
 */
function calculateResponseSpeedScore(
  avgSeconds?: number
): number {
  if (!avgSeconds) {
    return 10; // Default if no data
  }
  
  // Convert to hours for easier calculation
  const hours = avgSeconds / 3600;
  
  // < 1 hour = max score
  if (hours < 1) {
    return 20;
  }
  // 1-4 hours = 18 points
  else if (hours < 4) {
    return 18;
  }
  // 4-12 hours = 15 points
  else if (hours < 12) {
    return 15;
  }
  // 12-24 hours = 12 points
  else if (hours < 24) {
    return 12;
  }
  // 24-48 hours = 8 points
  else if (hours < 48) {
    return 8;
  }
  // > 48 hours = 5 points
  else {
    return 5;
  }
}

/**
 * Calculate conversion rate score (0-20 points)
 * Higher conversion = higher score
 */
function calculateConversionRateScore(
  conversionRate?: number
): number {
  if (!conversionRate) {
    return 10; // Default
  }
  
  // > 50% conversion = max score
  if (conversionRate >= 50) {
    return 20;
  }
  // 40-50% = 18 points
  else if (conversionRate >= 40) {
    return 18;
  }
  // 30-40% = 15 points
  else if (conversionRate >= 30) {
    return 15;
  }
  // 20-30% = 12 points
  else if (conversionRate >= 20) {
    return 12;
  }
  // 10-20% = 8 points
  else if (conversionRate >= 10) {
    return 8;
  }
  // < 10% = 5 points
  else {
    return 5;
  }
}

/**
 * Calculate price alignment score (0-15 points)
 * DJs priced near city median get higher scores
 * Avoids price fixing by rewarding market alignment, not specific prices
 */
function calculatePriceAlignmentScore(
  djPriceMidpoint: number | undefined,
  cityMedian: number | undefined
): number {
  if (!djPriceMidpoint || !cityMedian) {
    return 10; // Default
  }
  
  // Calculate percentage difference
  const diff = Math.abs((djPriceMidpoint - cityMedian) / cityMedian) * 100;
  
  // Within 10% of median = max score (market aligned)
  if (diff <= 10) {
    return 15;
  }
  // Within 20% = 12 points
  else if (diff <= 20) {
    return 12;
  }
  // Within 30% = 10 points
  else if (diff <= 30) {
    return 10;
  }
  // Within 50% = 7 points
  else if (diff <= 50) {
    return 7;
  }
  // > 50% difference = 5 points (outlier)
  else {
    return 5;
  }
}

/**
 * Calculate trust score (0-15 points)
 * Based on reliability score
 */
function calculateTrustScore(reliabilityScore: number): number {
  // Map 0-100 reliability to 0-15 points
  return Math.round((reliabilityScore / 100) * 15);
}

/**
 * Calculate penalty adjustment (negative points)
 * Penalties decay over time
 */
function calculatePenaltyAdjustment(
  penalty: number,
  lastPenaltyAppliedAt?: string
): number {
  if (!penalty || penalty <= 0) {
    return 0;
  }
  
  if (!lastPenaltyAppliedAt) {
    return -penalty; // Full penalty if no decay applied
  }
  
  // Calculate days since penalty
  const daysSince = (Date.now() - new Date(lastPenaltyAppliedAt).getTime()) / (1000 * 60 * 60 * 24);
  
  // Decay rate: reduce penalty by 10% per day (default)
  const decayRate = 0.1;
  const decayedPenalty = penalty * Math.max(0, 1 - (daysSince * decayRate));
  
  return -decayedPenalty;
}

/**
 * Calculate DJ routing score
 * Main function
 */
export async function calculateDJRoutingScore(
  djProfileId: string,
  city?: string,
  eventType?: string
): Promise<RoutingScoreResult> {
  const supabase = createClient();
  
  // Get DJ metrics
  const { data: dj, error } = await supabase
    .from('dj_routing_metrics')
    .select('*')
    .eq('dj_profile_id', djProfileId)
    .single();
  
  if (error || !dj) {
    throw new Error('DJ not found');
  }
  
  // Type assertion needed because dj_routing_metrics table may not be in generated types yet
  const typedDJ = dj as any;
  
  // Get city median if city/event type provided
  let cityMedian: number | undefined;
  if (city && eventType) {
    // Type assertion needed because city_event_stats table may not be in generated types yet
    const { data: stats } = await ((supabase
      .from('city_event_stats' as any) as any)
      .select('price_median_30d')
      .eq('city', city)
      .eq('event_type', eventType)
      .eq('product_context', 'djdash')
      .order('computed_at', { ascending: false })
      .limit(1)
      .single() as any);
    
    cityMedian = (stats as any)?.price_median_30d;
  }
  
  // Calculate components
  const tierWeight = calculateTierWeight(typedDJ.pricing_tier);
  const responseSpeedScore = calculateResponseSpeedScore(typedDJ.response_speed_avg_seconds);
  const conversionRateScore = calculateConversionRateScore(typedDJ.conversion_rate);
  const priceAlignmentScore = calculatePriceAlignmentScore(
    typedDJ.price_range_midpoint,
    cityMedian
  );
  const trustScore = calculateTrustScore(typedDJ.reliability_score);
  const penaltyAdjustment = calculatePenaltyAdjustment(
    typedDJ.recent_lead_penalty,
    typedDJ.last_penalty_applied_at
  );
  
  // Calculate total
  const total = Math.max(0,
    tierWeight +
    responseSpeedScore +
    conversionRateScore +
    priceAlignmentScore +
    trustScore +
    penaltyAdjustment
  );
  
  const components: RoutingScoreComponents = {
    tier_weight: tierWeight,
    response_speed_score: responseSpeedScore,
    conversion_rate_score: conversionRateScore,
    price_alignment_score: priceAlignmentScore,
    trust_score: trustScore,
    penalty_adjustment: penaltyAdjustment,
    total
  };
  
  // Generate explanation
  const explanation = `Routing score ${total.toFixed(2)}: ` +
    `Tier ${tierWeight}/25, ` +
    `Response ${responseSpeedScore}/20, ` +
    `Conversion ${conversionRateScore}/20, ` +
    `Price Alignment ${priceAlignmentScore}/15, ` +
    `Trust ${trustScore}/15, ` +
    `Penalty ${penaltyAdjustment.toFixed(2)}`;
  
  return {
    routing_score: total,
    components,
    explanation
  };
}

/**
 * Update DJ routing score in database
 */
export async function updateDJRoutingScore(
  djProfileId: string,
  scoreResult: RoutingScoreResult
): Promise<void> {
  const supabase = createClient();
  
  // Type assertion needed because dj_routing_metrics table may not be in generated types yet
  await ((supabase
    .from('dj_routing_metrics' as any) as any)
    .update({
      routing_score: scoreResult.routing_score,
      routing_score_components: scoreResult.components,
      updated_at: new Date().toISOString()
    } as any)
    .eq('dj_profile_id', djProfileId) as any);
}

/**
 * Recalculate routing scores for all active DJs
 * Should be run periodically (e.g., daily)
 */
export async function recalculateAllRoutingScores(): Promise<void> {
  const supabase = createClient();
  
  // Get all active DJs
  const { data: djs } = await supabase
    .from('dj_routing_metrics')
    .select('dj_profile_id, dj_profiles!inner(city, state, event_types)')
    .eq('is_active', true)
    .eq('is_suspended', false);
  
  if (!djs) return;
  
  // Recalculate for each DJ
  for (const dj of djs as any[]) {
    try {
      // Get primary city and event type (simplified - in production, calculate per city/event)
      const profile = dj.dj_profiles as any;
      const city = profile?.city;
      const eventType = profile?.event_types?.[0] || 'wedding';
      
      const scoreResult = await calculateDJRoutingScore(dj.dj_profile_id, city, eventType);
      await updateDJRoutingScore(dj.dj_profile_id, scoreResult);
    } catch (error) {
      console.error(`Error recalculating score for DJ ${dj.dj_profile_id}:`, error);
    }
  }
}

