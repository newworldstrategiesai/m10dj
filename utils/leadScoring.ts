/**
 * Lead Scoring Engine
 * Deterministic lead scoring (0-100) using weighted components
 * 
 * Philosophy: Scores must be clamped (no <30 budget bias)
 * All components logged for explainability
 */

import { createClient } from '@/utils/supabase/server';

export interface Lead {
  id?: string;
  budget_min?: number;
  budget_max?: number;
  budget_midpoint?: number;
  event_type: string;
  event_date: string;
  days_until_event?: number;
  is_last_minute?: boolean;
  form_completeness?: number;
  city: string;
  state?: string;
  guest_count?: number;
  venue_name?: string;
  special_requests?: string;
}

export interface ScoringComponents {
  budget_score: number;
  urgency_score: number;
  completeness_score: number;
  demand_score: number;
  event_type_priority: number;
  total: number;
}

export interface ScoringResult {
  lead_score: number;
  components: ScoringComponents;
  explanation: string;
}

/**
 * Get city event stats for demand/supply ratio
 */
async function getCityEventStats(
  city: string,
  eventType: string,
  state?: string
): Promise<{
  price_median_30d?: number;
  demand_supply_ratio?: number;
  market_tension?: 'high' | 'medium' | 'low';
} | null> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('city_event_stats')
    .select('price_median_30d, demand_supply_ratio, market_tension')
    .eq('city', city)
    .eq('event_type', eventType)
    .eq('product_context', 'djdash')
    .order('computed_at', { ascending: false })
    .limit(1)
    .single();
  
  if (state && data) {
    // If state provided, filter by state
    const { data: stateData } = await supabase
      .from('city_event_stats')
      .select('price_median_30d, demand_supply_ratio, market_tension')
      .eq('city', city)
      .eq('state', state)
      .eq('event_type', eventType)
      .eq('product_context', 'djdash')
      .order('computed_at', { ascending: false })
      .limit(1)
      .single();
    
    return stateData || data;
  }
  
  return data || null;
}

/**
 * Calculate budget score (0-30 points)
 * Compares lead budget midpoint to city median
 * Clamped: minimum 10 points even if budget is low
 */
function calculateBudgetScore(
  budgetMidpoint: number | undefined,
  cityMedian: number | undefined
): number {
  if (!budgetMidpoint || !cityMedian) {
    return 15; // Default score if no data
  }
  
  // Calculate percentage difference
  const diff = ((budgetMidpoint - cityMedian) / cityMedian) * 100;
  
  let score = 20; // Base score
  
  // Premium budget (+20% or more) = max score
  if (diff >= 20) {
    score = 30;
  }
  // Above median (0-20%) = 25 points
  else if (diff >= 0) {
    score = 25;
  }
  // At median (-5% to +5%) = 20 points
  else if (diff >= -5) {
    score = 20;
  }
  // Below median (-5% to -20%) = 15 points
  else if (diff >= -20) {
    score = 15;
  }
  // Well below median (-20% to -40%) = 12 points
  else if (diff >= -40) {
    score = 12;
  }
  // Very low budget = minimum 10 points (clamped)
  else {
    score = 10;
  }
  
  return score;
}

/**
 * Calculate urgency score (0-25 points)
 * Based on days until event
 */
function calculateUrgencyScore(
  daysUntilEvent: number | undefined,
  isLastMinute: boolean | undefined
): number {
  if (!daysUntilEvent) {
    return 10; // Default
  }
  
  // Last minute (< 30 days) = max score
  if (isLastMinute || daysUntilEvent < 30) {
    return 25;
  }
  // Urgent (30-60 days) = 20 points
  else if (daysUntilEvent < 60) {
    return 20;
  }
  // Medium (60-90 days) = 15 points
  else if (daysUntilEvent < 90) {
    return 15;
  }
  // Planned (90-180 days) = 12 points
  else if (daysUntilEvent < 180) {
    return 12;
  }
  // Far out (> 180 days) = 8 points
  else {
    return 8;
  }
}

/**
 * Calculate form completeness score (0-15 points)
 */
function calculateCompletenessScore(
  completeness: number | undefined
): number {
  if (!completeness) {
    return 5; // Default
  }
  
  // Map 0-1 completeness to 0-15 points
  return Math.round(completeness * 15);
}

/**
 * Calculate demand score (0-20 points)
 * Based on demand/supply ratio and market tension
 */
function calculateDemandScore(
  demandSupplyRatio: number | undefined,
  marketTension: 'high' | 'medium' | 'low' | undefined
): number {
  if (!demandSupplyRatio && !marketTension) {
    return 10; // Default
  }
  
  // Use market tension if available (more reliable)
  if (marketTension) {
    switch (marketTension) {
      case 'high':
        return 20; // High demand, low supply
      case 'medium':
        return 15;
      case 'low':
        return 10; // Low demand, high supply
      default:
        return 10;
    }
  }
  
  // Fallback to ratio
  if (demandSupplyRatio) {
    // High ratio (> 2.0) = high demand
    if (demandSupplyRatio >= 2.0) {
      return 20;
    }
    // Medium ratio (1.0-2.0) = medium demand
    else if (demandSupplyRatio >= 1.0) {
      return 15;
    }
    // Low ratio (< 1.0) = low demand
    else {
      return 10;
    }
  }
  
  return 10;
}

/**
 * Calculate event type priority (0-10 points)
 * Some event types are more valuable
 */
function calculateEventTypePriority(eventType: string): number {
  const priorities: Record<string, number> = {
    'wedding': 10, // Highest priority
    'corporate': 8,
    'private_party': 7,
    'school_dance': 6,
    'holiday_party': 7,
    'other': 5
  };
  
  return priorities[eventType] || 5;
}

/**
 * Calculate form completeness percentage
 */
export function calculateFormCompleteness(lead: Lead): number {
  const requiredFields = [
    'planner_name',
    'planner_email',
    'event_type',
    'event_date',
    'city',
    'budget_min',
    'budget_max'
  ];
  
  const optionalFields = [
    'planner_phone',
    'venue_name',
    'venue_address',
    'guest_count',
    'special_requests'
  ];
  
  let completed = 0;
  let total = requiredFields.length + (optionalFields.length * 0.5); // Optional fields worth half
  
  // Check required fields
  for (const field of requiredFields) {
    if (lead[field as keyof Lead]) {
      completed += 1;
    }
  }
  
  // Check optional fields (worth 0.5 each)
  for (const field of optionalFields) {
    if (lead[field as keyof Lead]) {
      completed += 0.5;
    }
  }
  
  return Math.min(1.0, completed / total);
}

/**
 * Calculate lead score (0-100)
 * Main scoring function
 */
export async function calculateLeadScore(lead: Lead): Promise<ScoringResult> {
  // Get city event stats for demand/supply
  const cityStats = await getCityEventStats(
    lead.city,
    lead.event_type,
    lead.state
  );
  
  // Calculate components
  const budgetScore = calculateBudgetScore(
    lead.budget_midpoint,
    cityStats?.price_median_30d
  );
  
  const urgencyScore = calculateUrgencyScore(
    lead.days_until_event,
    lead.is_last_minute
  );
  
  const completenessScore = calculateCompletenessScore(
    lead.form_completeness
  );
  
  const demandScore = calculateDemandScore(
    cityStats?.demand_supply_ratio,
    cityStats?.market_tension
  );
  
  const eventTypePriority = calculateEventTypePriority(lead.event_type);
  
  // Calculate total (clamped to 0-100)
  const total = Math.min(100, Math.max(0,
    budgetScore +
    urgencyScore +
    completenessScore +
    demandScore +
    eventTypePriority
  ));
  
  const components: ScoringComponents = {
    budget_score: budgetScore,
    urgency_score: urgencyScore,
    completeness_score: completenessScore,
    demand_score: demandScore,
    event_type_priority: eventTypePriority,
    total
  };
  
  // Generate explanation
  const explanation = `Lead scored ${total}/100: ` +
    `Budget ${budgetScore}/30, ` +
    `Urgency ${urgencyScore}/25, ` +
    `Completeness ${completenessScore}/15, ` +
    `Demand ${demandScore}/20, ` +
    `Event Type ${eventTypePriority}/10`;
  
  return {
    lead_score: total,
    components,
    explanation
  };
}

/**
 * Save scoring components to lead record
 */
export async function saveLeadScore(
  leadId: string,
  scoringResult: ScoringResult
): Promise<void> {
  const supabase = createClient();
  
  // Type assertion needed because leads table may not be in generated types yet
  await ((supabase
    .from('leads' as any) as any)
    .update({
      lead_score: scoringResult.lead_score,
      scoring_components: scoringResult.components,
      routing_state: 'routing' // Move to routing state
    } as any)
    .eq('id', leadId) as any);
}

