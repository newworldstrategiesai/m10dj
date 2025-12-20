/**
 * DJ Eligibility Filter
 * Eliminates invalid DJs before routing
 * 
 * Hard Filters:
 * - Availability on event date
 * - Pricing range overlaps lead budget
 * - Reliability score >= 50
 * - Not suspended
 * 
 * Returns DJs sorted by raw routing score (pre-penalty)
 */

import { createClient } from '@/utils/supabase/server';

export interface EligibilityFilters {
  city: string;
  state?: string;
  eventDate: string; // ISO date string
  eventType: string;
  budgetMin: number;
  budgetMax: number;
  budgetMidpoint: number;
}

export interface EligibleDJ {
  dj_profile_id: string;
  routing_score: number;
  reliability_score: number;
  pricing_tier: string;
  price_range_min: number;
  price_range_max: number;
}

/**
 * Check if DJ is available on event date (atomic check)
 */
async function checkDJAvailability(
  djProfileId: string,
  eventDate: string
): Promise<boolean> {
  const supabase = createClient();
  
  // Atomic check: availability exists and is available/tentative
  // Type assertion needed because dj_availability table may have extended fields not in generated types yet
  const { data, error } = await ((supabase
    .from('dj_availability' as any) as any)
    .select('status, locked_until')
    .eq('dj_profile_id', djProfileId)
    .eq('date', eventDate)
    .single() as any);
  
  if (error || !data) {
    // No availability record = assume unavailable (conservative)
    return false;
  }
  
  // Check if locked (being routed to another lead)
  const typedData = data as any;
  if (typedData.locked_until && new Date(typedData.locked_until) > new Date()) {
    return false; // Currently locked
  }
  
  // Must be available or tentative
  return typedData.status === 'available' || typedData.status === 'tentative';
}

/**
 * Check if DJ pricing overlaps with lead budget
 */
function checkPricingOverlap(
  djPriceMin: number,
  djPriceMax: number,
  leadBudgetMin: number,
  leadBudgetMax: number
): boolean {
  // Overlap exists if ranges intersect
  return djPriceMin <= leadBudgetMax && djPriceMax >= leadBudgetMin;
}

/**
 * Lock DJ availability atomically (prevents double-booking)
 */
export async function lockDJAvailability(
  djProfileId: string,
  eventDate: string,
  leadId: string,
  lockDurationMinutes: number = 15
): Promise<boolean> {
  const supabase = createClient();
  
  const lockUntil = new Date();
  lockUntil.setMinutes(lockUntil.getMinutes() + lockDurationMinutes);
  
  // Atomic update: only lock if currently available and not locked
  // Type assertion needed because dj_availability table may have extended fields not in generated types yet
  const { data, error } = await ((supabase
    .from('dj_availability' as any) as any)
    .update({
      locked_until: lockUntil.toISOString(),
      locked_by_lead_id: leadId
    } as any)
    .eq('dj_profile_id', djProfileId)
    .eq('date', eventDate)
    .in('status', ['available', 'tentative'])
    .or('locked_until.is.null,locked_until.lt.' + new Date().toISOString())
    .select()
    .single() as any);
  
  return !error && !!data;
}

/**
 * Release DJ availability lock
 */
export async function releaseDJAvailability(
  djProfileId: string,
  eventDate: string
): Promise<void> {
  const supabase = createClient();
  
  // Type assertion needed because dj_availability table may have extended fields not in generated types yet
  await ((supabase
    .from('dj_availability' as any) as any)
    .update({
      locked_until: null,
      locked_by_lead_id: null
    } as any)
    .eq('dj_profile_id', djProfileId)
    .eq('date', eventDate) as any);
}

/**
 * Get all eligible DJs for a lead
 * Hard filters applied, sorted by routing score
 */
export async function getEligibleDJs(
  filters: EligibilityFilters
): Promise<EligibleDJ[]> {
  const supabase = createClient();
  
  // Step 1: Get all active, non-suspended DJs with reliability >= 50
  // Join dj_routing_metrics with dj_profiles for service area
  let query = supabase
    .from('dj_routing_metrics')
    .select(`
      dj_profile_id,
      routing_score,
      reliability_score,
      pricing_tier,
      price_range_min,
      price_range_max,
      cooldown_until,
      dj_profiles!inner(
        service_areas,
        city,
        state
      )
    `)
    .eq('is_active', true)
    .eq('is_suspended', false)
    .gte('reliability_score', 50)
    .order('routing_score', { ascending: false });
  
  // Filter out DJs on cooldown
  query = query.or(`cooldown_until.is.null,cooldown_until.lt.${new Date().toISOString()}`);
  
  const { data: djs, error } = await query;
  
  if (error || !djs || djs.length === 0) {
    return [];
  }
  
  // Step 2: Filter by service area and pricing overlap
  const pricingFiltered = djs.filter((dj: any) => {
    // Check service area (city in service_areas array or matches city)
    const profile = dj.dj_profiles as any;
    const serviceAreas = profile?.service_areas || [];
    const matchesCity = profile?.city?.toLowerCase() === filters.city.toLowerCase() ||
                       serviceAreas.some((area: string) => 
                         area.toLowerCase().includes(filters.city.toLowerCase())
                       );
    
    if (!matchesCity && serviceAreas.length > 0) {
      return false; // Not in service area
    }
    
    // Check pricing overlap
    if (!dj.price_range_min || !dj.price_range_max) {
      return false; // No pricing = not eligible
    }
    
    return checkPricingOverlap(
      dj.price_range_min,
      dj.price_range_max,
      filters.budgetMin,
      filters.budgetMax
    );
  });
  
  // Step 3: Check availability for each DJ (atomic checks)
  const availabilityChecks = await Promise.all(
    pricingFiltered.map(async (dj: any) => {
      const isAvailable = await checkDJAvailability(dj.dj_profile_id, filters.eventDate);
      return { dj, isAvailable };
    })
  );
  
  // Step 4: Filter to only available DJs and map to result format
  const eligibleDJs: EligibleDJ[] = availabilityChecks
    .filter(({ isAvailable }: any) => isAvailable)
    .map(({ dj }: any) => ({
      dj_profile_id: dj.dj_profile_id,
      routing_score: dj.routing_score || 0,
      reliability_score: dj.reliability_score || 50,
      pricing_tier: dj.pricing_tier || 'standard',
      price_range_min: dj.price_range_min || 0,
      price_range_max: dj.price_range_max || 0
    }))
    .sort((a, b) => b.routing_score - a.routing_score); // Sort by routing score descending
  
  return eligibleDJs;
}

/**
 * Batch check availability for multiple DJs (optimized)
 */
export async function batchCheckAvailability(
  djProfileIds: string[],
  eventDate: string
): Promise<Record<string, boolean>> {
  const supabase = createClient();
  
  // Type assertion needed because dj_availability table may have extended fields not in generated types yet
  const { data } = await ((supabase
    .from('dj_availability' as any) as any)
    .select('dj_profile_id, status, locked_until')
    .in('dj_profile_id', djProfileIds)
    .eq('date', eventDate) as any);
  
  const availabilityMap: Record<string, boolean> = {};
  
  // Initialize all to false
  djProfileIds.forEach(id => {
    availabilityMap[id] = false;
  });
  
  // Set to true if available and not locked
  if (data) {
    (data as any[]).forEach((avail: any) => {
      const isLocked = avail.locked_until && new Date(avail.locked_until) > new Date();
      const isAvailable = (avail.status === 'available' || avail.status === 'tentative') && !isLocked;
      availabilityMap[avail.dj_profile_id] = isAvailable;
    });
  }
  
  return availabilityMap;
}

