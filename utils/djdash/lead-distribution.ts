/**
 * DJ Dash Lead Distribution System
 * Matches leads to DJs based on location, event type, and availability
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LeadData {
  contact_id: string;
  city: string | null;
  state: string | null;
  event_type: string;
  event_date: string | null;
}

interface DJProfile {
  id: string;
  user_id: string;
  organization_id: string;
  business_name: string;
  service_cities: string[];
  service_states: string[];
  event_types: string[];
  lead_types_accepted: string[];
  max_leads_per_month: number | null;
  current_month_leads: number;
  accepts_leads: boolean;
  is_active: boolean;
  subscription_tier: string;
  subscription_expires_at: string | null;
  average_rating: number;
  total_reviews: number;
  booking_rate: number;
  leads_received_total?: number;
  last_lead_received_at?: string | null;
  is_featured?: boolean;
  is_verified?: boolean;
}

/**
 * Find matching DJs for a lead
 */
export async function findMatchingDJs(leadData: LeadData): Promise<DJProfile[]> {
  const { city, state, event_type } = leadData;

  // Build query for matching DJs
  let query = supabase
    .from('dj_network_profiles')
    .select('*')
    .eq('is_active', true)
    .eq('accepts_leads', true);

  // Filter by subscription (must have active subscription)
  query = query.or(
    `subscription_expires_at.is.null,subscription_expires_at.gt.${new Date().toISOString()}`
  );

  // Filter by service area (city or state)
  if (city || state) {
    const locationFilters: string[] = [];
    
    if (city) {
      locationFilters.push(`service_cities.cs.{${city}}`);
    }
    
    if (state) {
      locationFilters.push(`service_states.cs.{${state}}`);
    }
    
    if (locationFilters.length > 0) {
      query = query.or(locationFilters.join(','));
    }
  }

  // Filter by event type
  if (event_type && event_type !== 'other') {
    const standardizedEventType = event_type.toLowerCase().replace(' ', '_');
    query = query.or(
      `event_types.cs.{${standardizedEventType}},lead_types_accepted.cs.{all},lead_types_accepted.cs.{${standardizedEventType}}`
    );
  }

  const { data: matchingDJs, error } = await query;

  if (error) {
    console.error('Error finding matching DJs:', error);
    return [];
  }

  if (!matchingDJs) {
    return [];
  }

  // Filter out DJs who have reached their monthly lead limit
  const availableDJs = matchingDJs.filter((dj) => {
    if (dj.max_leads_per_month && dj.current_month_leads >= dj.max_leads_per_month) {
      return false;
    }
    return true;
  });

  // Sort by priority (featured, verified, rating, booking rate)
  const sortedDJs = availableDJs.sort((a, b) => {
    // Featured DJs first
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;

    // Verified DJs next
    if (a.is_verified && !b.is_verified) return -1;
    if (!a.is_verified && b.is_verified) return 1;

    // Higher rating
    if (a.average_rating > b.average_rating) return -1;
    if (a.average_rating < b.average_rating) return 1;

    // Higher booking rate
    if (a.booking_rate > b.booking_rate) return -1;
    if (a.booking_rate < b.booking_rate) return 1;

    // More reviews
    if (a.total_reviews > b.total_reviews) return -1;
    if (a.total_reviews < b.total_reviews) return 1;

    return 0;
  });

  return sortedDJs as DJProfile[];
}

/**
 * Distribute a lead to matching DJs
 * @param leadData Lead information
 * @param maxDJs Maximum number of DJs to send the lead to (default: 5)
 * @returns Array of distribution records
 */
export async function distributeLeadToDJs(
  leadData: LeadData,
  maxDJs: number = 5
): Promise<Array<{ dj_profile_id: string; distribution_id: string }>> {
  // Find matching DJs
  const matchingDJs = await findMatchingDJs(leadData);

  if (matchingDJs.length === 0) {
    console.log('No matching DJs found for lead:', leadData);
    return [];
  }

  // Limit to maxDJs
  const djsToNotify = matchingDJs.slice(0, maxDJs);

  // Create distribution records
  const distributions = await Promise.all(
    djsToNotify.map(async (dj) => {
      // Create distribution record
      const { data: distribution, error } = await supabase
        .from('lead_distributions')
        .insert({
          contact_id: leadData.contact_id,
          dj_profile_id: dj.id,
          distribution_method: 'auto',
          distribution_priority: calculatePriority(dj),
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating distribution for DJ ${dj.id}:`, error);
        return null;
      }

      // Update DJ's current month leads count
      await supabase
        .from('dj_network_profiles')
        .update({
          current_month_leads: (dj.current_month_leads || 0) + 1,
          last_lead_received_at: new Date().toISOString(),
          leads_received_total: (dj.leads_received_total || 0) + 1,
        })
        .eq('id', dj.id);

      return {
        dj_profile_id: dj.id,
        distribution_id: distribution.id,
      };
    })
  );

  // Filter out null results
  const successfulDistributions = distributions.filter(
    (d) => d !== null
  ) as Array<{ dj_profile_id: string; distribution_id: string }>;

  return successfulDistributions;
}

/**
 * Calculate distribution priority for a DJ
 * Higher number = higher priority
 */
function calculatePriority(dj: DJProfile): number {
  let priority = 0;

  // Featured DJs get +100
  if (dj.is_featured) priority += 100;

  // Verified DJs get +50
  if (dj.is_verified) priority += 50;

  // Rating-based priority (0-5 stars = 0-25 points)
  priority += (dj.average_rating || 0) * 5;

  // Booking rate priority (0-100% = 0-20 points)
  priority += (dj.booking_rate || 0) * 0.2;

  // Review count priority (capped at 25 points)
  priority += Math.min(dj.total_reviews || 0, 25);

  // Subscription tier priority
  const tierPriority: Record<string, number> = {
    premium: 30,
    pro: 20,
    basic: 10,
    free: 0,
  };
  priority += tierPriority[dj.subscription_tier] || 0;

  return Math.round(priority);
}

/**
 * Get DJ profile by user ID
 */
export async function getDJProfileByUserId(userId: string): Promise<DJProfile | null> {
  const { data, error } = await supabase
    .from('dj_network_profiles')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as DJProfile;
}

/**
 * Get distribution statistics for a DJ
 */
export async function getDJDistributionStats(djProfileId: string) {
  const { data, error } = await supabase
    .from('lead_distributions')
    .select('*')
    .eq('dj_profile_id', djProfileId);

  if (error) {
    console.error('Error getting distribution stats:', error);
    return null;
  }

  const distributions = data || [];

  return {
    total_distributed: distributions.length,
    contacted: distributions.filter((d) => d.dj_contacted_at).length,
    declined: distributions.filter((d) => d.dj_declined_at).length,
    booked: distributions.filter((d) => d.outcome === 'booked').length,
    no_response: distributions.filter((d) => !d.dj_viewed_at).length,
  };
}

