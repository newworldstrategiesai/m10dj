/**
 * Multi-DJ Blast Engine
 * Converts one inquiry into structured multi-DJ routing
 * 
 * Flow:
 * 1. User submits event details
 * 2. Lead is scored
 * 3. Eligible DJs identified
 * 4. Routing phases triggered (exclusive → shared)
 * 5. DJs respond inside DJ Dash
 * 6. Customer sees comparison UI
 */

import { createClient } from '@/utils/supabase/server';
import { calculateLeadScore, saveLeadScore, calculateFormCompleteness } from './leadScoring';
import { routeLead } from './leadRouting';
import { Lead } from './leadScoring';

export interface MultiDJInquiry {
  planner_name: string;
  planner_email: string;
  planner_phone?: string;
  event_type: string;
  event_date: string;
  event_time?: string;
  venue_name?: string;
  venue_address?: string;
  city: string;
  state?: string;
  zip_code?: string;
  guest_count?: number;
  budget_min?: number;
  budget_max?: number;
  special_requests?: string;
  source?: string;
  referrer?: string;
  utm_campaign?: string;
  utm_source?: string;
  utm_medium?: string;
}

export interface BlastResult {
  lead_id: string;
  lead_score: number;
  assigned_djs: string[];
  routing_phase: string;
  exclusive_until?: string;
}

/**
 * Create lead from inquiry
 */
async function createLead(inquiry: MultiDJInquiry): Promise<string> {
  const supabase = createClient();
  
  // Calculate form completeness
  const completeness = calculateFormCompleteness(inquiry as Lead);
  
  // Create lead record
  // Type assertion needed because leads table may not be in generated types yet
  const { data: lead, error } = await ((supabase
    .from('leads' as any) as any)
    .insert({
      planner_name: inquiry.planner_name,
      planner_email: inquiry.planner_email,
      planner_phone: inquiry.planner_phone || null,
      planner_phone_hash: inquiry.planner_phone ? 
        require('crypto').createHash('sha256').update(inquiry.planner_phone).digest('hex').substring(0, 16) : null,
      event_type: inquiry.event_type,
      event_date: inquiry.event_date,
      event_time: inquiry.event_time || null,
      venue_name: inquiry.venue_name || null,
      venue_address: inquiry.venue_address || null,
      city: inquiry.city,
      state: inquiry.state || null,
      zip_code: inquiry.zip_code || null,
      guest_count: inquiry.guest_count || null,
      budget_min: inquiry.budget_min || null,
      budget_max: inquiry.budget_max || null,
      form_completeness: completeness,
      special_requests: inquiry.special_requests || null,
      source: inquiry.source || 'website',
      referrer: inquiry.referrer || null,
      utm_campaign: inquiry.utm_campaign || null,
      utm_source: inquiry.utm_source || null,
      utm_medium: inquiry.utm_medium || null,
      routing_state: 'scoring',
      product_context: 'djdash'
    } as any)
    .select()
    .single() as any);
  
  if (error || !lead) {
    throw new Error(`Failed to create lead: ${error?.message}`);
  }
  
  return lead.id;
}

/**
 * Process multi-DJ inquiry
 * Main function
 */
export async function processMultiDJInquiry(
  inquiry: MultiDJInquiry
): Promise<BlastResult> {
  // Step 1: Create lead
  const leadId = await createLead(inquiry);
  
  // Step 2: Score lead
  const scoringResult = await calculateLeadScore(inquiry as Lead);
  await saveLeadScore(leadId, scoringResult);
  
  // Step 3: Route lead (automatically finds eligible DJs and routes)
  const routingResult = await routeLead(leadId);
  
  return {
    lead_id: leadId,
    lead_score: scoringResult.lead_score,
    assigned_djs: routingResult.assigned_djs,
    routing_phase: routingResult.phase,
    exclusive_until: routingResult.exclusive_until
  };
}

/**
 * Get DJ responses for lead (for comparison UI)
 */
export async function getDJResponsesForLead(
  leadId: string
): Promise<Array<{
  dj_profile_id: string;
  dj_name: string;
  dj_slug: string;
  response_status: string;
  response_time_seconds?: number;
  quoted_price?: number;
  message?: string;
}>> {
  const supabase = createClient();
  
  // Type assertion needed because lead_assignments table may not be in generated types yet
  const { data: assignments } = await ((supabase
    .from('lead_assignments' as any) as any)
    .select(`
      dj_profile_id,
      response_status,
      response_time_seconds,
      dj_profiles!inner(
        dj_name,
        dj_slug
      )
    `)
    .eq('lead_id', leadId) as any);
  
  if (!assignments) return [];
  
  // Map to response format
  return (assignments as any[]).map((a: any) => ({
    dj_profile_id: a.dj_profile_id,
    dj_name: (a.dj_profiles as any).dj_name,
    dj_slug: (a.dj_profiles as any).dj_slug,
    response_status: a.response_status,
    response_time_seconds: a.response_time_seconds || undefined
  }));
}

/**
 * Unlock customer contact for DJ (after acceptance)
 * DJs pay to unlock customer contact info
 */
export async function unlockCustomerContact(
  leadId: string,
  djProfileId: string
): Promise<{
  planner_email: string;
  planner_phone?: string;
}> {
  const supabase = createClient();
  
  // Verify DJ has accepted the lead
  // Type assertion needed because lead_assignments table may not be in generated types yet
  const { data: assignment } = await ((supabase
    .from('lead_assignments' as any) as any)
    .select('response_status')
    .eq('lead_id', leadId)
    .eq('dj_profile_id', djProfileId)
    .single() as any);
  
  const typedAssignment = assignment as any;
  if (!typedAssignment || typedAssignment.response_status !== 'accepted') {
    throw new Error('DJ must accept lead before unlocking contact');
  }
  
  // Get lead contact info
  // Type assertion needed because leads table may not be in generated types yet
  const { data: lead } = await ((supabase
    .from('leads' as any) as any)
    .select('planner_email, planner_phone')
    .eq('id', leadId)
    .single() as any);
  
  // Type assertion needed because leads table may not be in generated types yet
  const typedLead = lead as any;
  if (!typedLead) {
    throw new Error('Lead not found');
  }
  
  // TODO: Process payment/unlock fee here
  // For now, just return contact info
  
  return {
    planner_email: typedLead.planner_email,
    planner_phone: typedLead.planner_phone || undefined
  };
}

