/**
 * Lead Routing Phases Orchestrator
 * Controls exclusive & shared lead delivery
 * 
 * Phases:
 * 1. Exclusive (Top DJ, 15 min)
 * 2. Tier expansion (Top 3, 30 min)
 * 3. Market broadcast
 * 4. Concierge escalation
 */

import { createClient } from '@/utils/supabase/server';
import { getEligibleDJs, lockDJAvailability, releaseDJAvailability } from './djEligibility';
import { EligibilityFilters } from './djEligibility';

export interface LeadRoutingConfig {
  exclusiveWindowMinutes: number; // Default: 15
  tierExpansionWindowMinutes: number; // Default: 30
  maxExclusiveDJs: number; // Default: 1
  maxTierExpansionDJs: number; // Default: 3
  maxBroadcastDJs: number; // Default: 10
}

const DEFAULT_CONFIG: LeadRoutingConfig = {
  exclusiveWindowMinutes: 15,
  tierExpansionWindowMinutes: 30,
  maxExclusiveDJs: 1,
  maxTierExpansionDJs: 3,
  maxBroadcastDJs: 10
};

export interface RoutingResult {
  lead_id: string;
  phase: string;
  assigned_djs: string[];
  exclusive_until?: string;
  next_phase_at?: string;
}

/**
 * Create lead assignment
 */
async function createLeadAssignment(
  leadId: string,
  djProfileId: string,
  phase: string,
  isExclusive: boolean,
  exclusiveUntil?: string,
  phaseExpiresAt?: string
): Promise<void> {
  const supabase = createClient();
  
  // Get DJ routing score for snapshot
  // Type assertion needed because dj_routing_metrics table may not be in generated types yet
  const { data: dj } = await ((supabase
    .from('dj_routing_metrics' as any) as any)
    .select('routing_score')
    .eq('dj_profile_id', djProfileId)
    .single() as any);
  
  // Type assertion needed because lead_assignments table may not be in generated types yet
  await ((supabase
    .from('lead_assignments' as any) as any)
    .insert({
      lead_id: leadId,
      dj_profile_id: djProfileId,
      phase,
      is_exclusive: isExclusive,
      exclusive_until: exclusiveUntil,
      phase_expires_at: phaseExpiresAt,
      phase_started_at: new Date().toISOString(),
      response_status: 'pending',
      routing_score_at_assignment: (dj as any)?.routing_score || 0
    } as any) as any);
}

/**
 * Notify DJ of new lead assignment
 */
async function notifyDJ(
  djProfileId: string,
  leadId: string,
  method: 'email' | 'sms' | 'push' | 'in_app' = 'in_app'
): Promise<void> {
  // TODO: Implement notification service
  // For now, just log
  console.log(`Notifying DJ ${djProfileId} of lead ${leadId} via ${method}`);
  
  // Update notification timestamp
  const supabase = createClient();
  // Type assertion needed because lead_assignments table may not be in generated types yet
  await ((supabase
    .from('lead_assignments' as any) as any)
    .update({
      notified_at: new Date().toISOString(),
      notification_method: method
    } as any)
    .eq('dj_profile_id', djProfileId)
    .eq('lead_id', leadId) as any);
}

/**
 * Phase 1: Exclusive Window
 * Assign to top DJ only, 15-minute exclusive window
 */
async function routeExclusivePhase(
  leadId: string,
  eligibleDJs: any[],
  config: LeadRoutingConfig
): Promise<RoutingResult> {
  if (eligibleDJs.length === 0) {
    throw new Error('No eligible DJs for exclusive phase');
  }
  
  // Get top DJ
  const topDJ = eligibleDJs[0];
  
  // Get lead details for availability lock
  const supabase = createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('event_date')
    .eq('id', leadId)
    .single();
  
  if (!lead) {
    throw new Error('Lead not found');
  }
  
  // Type assertion needed because leads table may not be in generated types yet
  const typedLead = lead as any;
  
  // Lock availability
  const locked = await lockDJAvailability(
    topDJ.dj_profile_id,
    typedLead.event_date,
    leadId,
    config.exclusiveWindowMinutes
  );
  
  if (!locked) {
    throw new Error('Failed to lock DJ availability');
  }
  
  // Calculate exclusive window end
  const exclusiveUntil = new Date();
  exclusiveUntil.setMinutes(exclusiveUntil.getMinutes() + config.exclusiveWindowMinutes);
  
  // Create assignment
  await createLeadAssignment(
    leadId,
    topDJ.dj_profile_id,
    'exclusive',
    true,
    exclusiveUntil.toISOString(),
    exclusiveUntil.toISOString()
  );
  
  // Notify DJ
  await notifyDJ(topDJ.dj_profile_id, leadId);
  
  // Update lead routing state
  // Type assertion needed because leads table may not be in generated types yet
  await ((supabase
    .from('leads' as any) as any)
    .update({
      routing_state: 'exclusive',
      routed_at: new Date().toISOString()
    } as any)
    .eq('id', leadId) as any);
  
  return {
    lead_id: leadId,
    phase: 'exclusive',
    assigned_djs: [topDJ.dj_profile_id],
    exclusive_until: exclusiveUntil.toISOString(),
    next_phase_at: exclusiveUntil.toISOString()
  };
}

/**
 * Phase 2: Tier Expansion
 * Assign to top 3 DJs, 30-minute window
 */
async function routeTierExpansionPhase(
  leadId: string,
  eligibleDJs: any[],
  config: LeadRoutingConfig
): Promise<RoutingResult> {
  if (eligibleDJs.length === 0) {
    throw new Error('No eligible DJs for tier expansion');
  }
  
  // Get top N DJs (excluding already assigned)
  const supabase = createClient();
  // Type assertion needed because lead_assignments table may not be in generated types yet
  const { data: existingAssignments } = await ((supabase
    .from('lead_assignments' as any) as any)
    .select('dj_id')
    .eq('lead_id', leadId) as any);
  
  const assignedDJIds = new Set((existingAssignments as any[])?.map((a: any) => a.dj_id) || []);
  const availableDJs = eligibleDJs.filter(dj => !assignedDJIds.has(dj.dj_id));
  
  const topDJs = availableDJs.slice(0, config.maxTierExpansionDJs);
  
  if (topDJs.length === 0) {
    throw new Error('No new eligible DJs for tier expansion');
  }
  
  // Get lead details
  const { data: lead } = await supabase
    .from('leads')
    .select('event_date')
    .eq('id', leadId)
    .single();
  
  if (!lead) {
    throw new Error('Lead not found');
  }
  
  // Type assertion needed because leads table may not be in generated types yet
  const typedLead = lead as any;
  
  // Lock availability for all assigned DJs
  const lockPromises = topDJs.map(dj =>
    lockDJAvailability(dj.dj_profile_id, typedLead.event_date, leadId, config.tierExpansionWindowMinutes)
  );
  
  const lockResults = await Promise.all(lockPromises);
  const successfullyLocked = topDJs.filter((_, i) => lockResults[i]);
  
  if (successfullyLocked.length === 0) {
    throw new Error('Failed to lock any DJ availability');
  }
  
  // Calculate phase expiration
  const phaseExpiresAt = new Date();
  phaseExpiresAt.setMinutes(phaseExpiresAt.getMinutes() + config.tierExpansionWindowMinutes);
  
  // Create assignments
  const assignmentPromises = successfullyLocked.map(dj =>
    createLeadAssignment(
      leadId,
      dj.dj_profile_id,
      'tier_expansion',
      false,
      undefined,
      phaseExpiresAt.toISOString()
    )
  );
  
  await Promise.all(assignmentPromises);
  
  // Notify all DJs
  const notifyPromises = successfullyLocked.map(dj =>
    notifyDJ(dj.dj_profile_id, leadId)
  );
  
  await Promise.all(notifyPromises);
  
  // Update lead routing state
  // Type assertion needed because leads table may not be in generated types yet
  await ((supabase
    .from('leads' as any) as any)
    .update({
      routing_state: 'tier_expansion',
      routed_at: new Date().toISOString()
    } as any)
    .eq('id', leadId) as any);
  
  return {
    lead_id: leadId,
    phase: 'tier_expansion',
    assigned_djs: successfullyLocked.map(dj => dj.dj_profile_id),
    next_phase_at: phaseExpiresAt.toISOString()
  };
}

/**
 * Phase 3: Market Broadcast
 * Assign to up to 10 DJs, no exclusive window
 */
async function routeBroadcastPhase(
  leadId: string,
  eligibleDJs: any[],
  config: LeadRoutingConfig
): Promise<RoutingResult> {
  // Get DJs not already assigned
  const supabase = createClient();
  const { data: existingAssignments } = await supabase
    .from('lead_assignments')
    .select('dj_profile_id')
    .eq('lead_id', leadId);
  
  const assignedDJIds = new Set((existingAssignments as any[])?.map((a: any) => a.dj_profile_id) || []);
  const availableDJs = eligibleDJs.filter(dj => !assignedDJIds.has(dj.dj_profile_id));
  
  const broadcastDJs = availableDJs.slice(0, config.maxBroadcastDJs);
  
  if (broadcastDJs.length === 0) {
    throw new Error('No eligible DJs for broadcast');
  }
  
  // Create assignments (no exclusive window)
  const assignmentPromises = broadcastDJs.map(dj =>
    createLeadAssignment(
      leadId,
      dj.dj_id,
      'broadcast',
      false
    )
  );
  
  await Promise.all(assignmentPromises);
  
  // Notify all DJs
  const notifyPromises = broadcastDJs.map(dj =>
    notifyDJ(dj.dj_id, leadId)
  );
  
  await Promise.all(notifyPromises);
  
  // Update lead routing state
  // Type assertion needed because leads table may not be in generated types yet
  await ((supabase
    .from('leads' as any) as any)
    .update({
      routing_state: 'broadcast',
      routed_at: new Date().toISOString()
    } as any)
    .eq('id', leadId) as any);
  
  return {
    lead_id: leadId,
    phase: 'broadcast',
    assigned_djs: broadcastDJs.map(dj => dj.dj_id)
  };
}

/**
 * Main routing function
 * Routes lead through phases
 */
export async function routeLead(
  leadId: string,
  config: LeadRoutingConfig = DEFAULT_CONFIG
): Promise<RoutingResult> {
  const supabase = createClient();
  
  // Get lead details
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  
  if (error || !lead) {
    throw new Error('Lead not found');
  }
  
  // Type assertion needed because leads table may not be in generated types yet
  const typedLead = lead as any;
  
  // Check if already routed
  if (typedLead.routing_state !== 'pending' && typedLead.routing_state !== 'routing') {
    throw new Error(`Lead already in state: ${typedLead.routing_state}`);
  }
  
  // Build eligibility filters
  const filters: EligibilityFilters = {
    city: typedLead.city,
    state: typedLead.state || undefined,
    eventDate: typedLead.event_date,
    eventType: typedLead.event_type,
    budgetMin: typedLead.budget_min || 0,
    budgetMax: typedLead.budget_max || 999999,
    budgetMidpoint: typedLead.budget_midpoint || 0
  };
  
  // Get eligible DJs
  const eligibleDJs = await getEligibleDJs(filters);
  
  if (eligibleDJs.length === 0) {
    // No eligible DJs - escalate to concierge
    // Type assertion needed because leads table may not be in generated types yet
    await ((supabase
      .from('leads' as any) as any)
      .update({
        routing_state: 'concierge'
      } as any)
      .eq('id', leadId) as any);
    
    return {
      lead_id: leadId,
      phase: 'concierge',
      assigned_djs: []
    };
  }
  
  // Route through phases
  // Start with exclusive phase
  try {
    return await routeExclusivePhase(leadId, eligibleDJs, config);
  } catch (error) {
    console.error('Exclusive phase failed:', error);
    // Fall through to tier expansion
  }
  
  // Tier expansion phase
  try {
    return await routeTierExpansionPhase(leadId, eligibleDJs, config);
  } catch (error) {
    console.error('Tier expansion failed:', error);
    // Fall through to broadcast
  }
  
  // Broadcast phase (always succeeds if eligible DJs exist)
  return await routeBroadcastPhase(leadId, eligibleDJs, config);
}

/**
 * Transition lead to next phase
 * Called by background worker when exclusive window expires
 */
export async function transitionToNextPhase(leadId: string): Promise<void> {
  const supabase = createClient();
  
  // Get current phase assignments
  // Type assertion needed because lead_assignments table may not be in generated types yet
  const { data: assignments } = await ((supabase
    .from('lead_assignments' as any) as any)
    .select('phase, response_status')
    .eq('lead_id', leadId) as any);
  
  if (!assignments || assignments.length === 0) {
    return;
  }
  
  // Check if any DJ responded in exclusive phase
  const hasResponse = (assignments as any[]).some((a: any) => 
    a.phase === 'exclusive' && 
    a.response_status !== 'pending' && 
    a.response_status !== 'ignored'
  );
  
  if (hasResponse) {
    // DJ responded - don't transition
    return;
  }
  
  // Get lead and eligible DJs for next phase
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();
  
  if (!lead) return;
  
  // Type assertion needed because leads table may not be in generated types yet
  const typedLead = lead as any;
  
  const filters: EligibilityFilters = {
    city: typedLead.city,
    state: typedLead.state || undefined,
    eventDate: typedLead.event_date,
    eventType: typedLead.event_type,
    budgetMin: typedLead.budget_min || 0,
    budgetMax: typedLead.budget_max || 999999,
    budgetMidpoint: typedLead.budget_midpoint || 0
  };
  
  const eligibleDJs = await getEligibleDJs(filters);
  
  // Release locks from previous phase
  // Type assertion needed because lead_assignments table may not be in generated types yet
  const { data: previousAssignments } = await ((supabase
    .from('lead_assignments' as any) as any)
    .select('dj_profile_id')
    .eq('lead_id', leadId)
    .eq('phase', 'exclusive') as any);
  
  if (previousAssignments) {
    for (const assignment of previousAssignments as any[]) {
      await releaseDJAvailability(assignment.dj_profile_id, typedLead.event_date);
    }
  }
  
  // Route to next phase
  if (typedLead.routing_state === 'exclusive') {
    await routeTierExpansionPhase(leadId, eligibleDJs, DEFAULT_CONFIG);
  } else if (typedLead.routing_state === 'tier_expansion') {
    await routeBroadcastPhase(leadId, eligibleDJs, DEFAULT_CONFIG);
  }
}

