/**
 * Response Handling & Reputation Updates
 * Behavior-driven incentives
 * 
 * Updates DJ metrics when a lead is:
 * - Accepted
 * - Declined
 * - Ignored
 */

import { createClient } from '@/utils/supabase/server';

export type ResponseAction = 'accepted' | 'declined' | 'ignored';

export interface ResponseUpdate {
  assignment_id: string;
  action: ResponseAction;
  response_time_seconds?: number;
}

/**
 * Calculate response time in seconds
 */
function calculateResponseTime(
  assignedAt: string,
  respondedAt: string
): number {
  const assigned = new Date(assignedAt).getTime();
  const responded = new Date(respondedAt).getTime();
  return Math.round((responded - assigned) / 1000);
}

/**
 * Update DJ metrics based on response
 */
async function updateDJMetrics(
  djProfileId: string,
  action: ResponseAction,
  responseTimeSeconds?: number
): Promise<void> {
  const supabase = createClient();
  
  // Get current DJ metrics
  // Type assertion needed because dj_routing_metrics table may not be in generated types yet
  const { data: dj } = await ((supabase
    .from('dj_routing_metrics' as any) as any)
    .select('*')
    .eq('dj_profile_id', djProfileId)
    .single() as any);
  
  if (!dj) return;
  
  // Type assertion for dj object
  const typedDJ = dj as any;
  
  // Calculate new metrics
  const totalLeads = (typedDJ.total_leads_received || 0) + 1;
  let totalAccepted = typedDJ.total_leads_accepted || 0;
  let totalDeclined = typedDJ.total_leads_declined || 0;
  let totalIgnored = typedDJ.total_leads_ignored || 0;
  
  switch (action) {
    case 'accepted':
      totalAccepted += 1;
      break;
    case 'declined':
      totalDeclined += 1;
      break;
    case 'ignored':
      totalIgnored += 1;
      break;
  }
  
  // Calculate rates
  const acceptanceRate = (totalAccepted / totalLeads) * 100;
  const declineRate = (totalDeclined / totalLeads) * 100;
  const ignoreRate = (totalIgnored / totalLeads) * 100;
  const conversionRate = typedDJ.conversion_rate || 0; // This would be updated separately when booking converts
  
  // Update response speed (rolling average)
  let newResponseSpeed = typedDJ.response_speed_avg_seconds || 0;
  if (responseTimeSeconds) {
    if (newResponseSpeed === 0) {
      newResponseSpeed = responseTimeSeconds;
    } else {
      // Weighted average (70% old, 30% new)
      newResponseSpeed = (newResponseSpeed * 0.7) + (responseTimeSeconds * 0.3);
    }
  }
  
  // Update reliability score based on behavior
  let newReliability = typedDJ.reliability_score || 50;
  
  if (action === 'accepted') {
    // Fast acceptance increases reliability
    if (responseTimeSeconds && responseTimeSeconds < 3600) { // < 1 hour
      newReliability = Math.min(100, newReliability + 2);
    } else {
      newReliability = Math.min(100, newReliability + 1);
    }
  } else if (action === 'declined') {
    // Decline reduces reliability slightly
    newReliability = Math.max(0, newReliability - 1);
    
    // High decline rate reduces reliability more
    if (declineRate > 50) {
      newReliability = Math.max(0, newReliability - 2);
    }
  } else if (action === 'ignored') {
    // Ignoring significantly reduces reliability
    newReliability = Math.max(0, newReliability - 3);
    
    // High ignore rate reduces reliability more
    if (ignoreRate > 30) {
      newReliability = Math.max(0, newReliability - 5);
    }
  }
  
  // Apply penalty for ignored leads
  let newPenalty = typedDJ.recent_lead_penalty || 0;
  if (action === 'ignored') {
    newPenalty = Math.min(20, newPenalty + 5); // Max penalty of 20 points
  } else if (action === 'accepted' && responseTimeSeconds && responseTimeSeconds < 3600) {
    // Fast acceptance reduces penalty
    newPenalty = Math.max(0, newPenalty - 2);
  }
  
  // Update DJ record
  // Type assertion needed because dj_routing_metrics table may not be in generated types yet
  await ((supabase
    .from('dj_routing_metrics' as any) as any)
    .update({
      total_leads_received: totalLeads,
      total_leads_accepted: totalAccepted,
      total_leads_declined: totalDeclined,
      total_leads_ignored: totalIgnored,
      acceptance_rate: acceptanceRate,
      decline_rate: declineRate,
      ignore_rate: ignoreRate,
      response_speed_avg_seconds: Math.round(newResponseSpeed),
      reliability_score: Math.round(newReliability),
      recent_lead_penalty: newPenalty,
      last_penalty_applied_at: action === 'ignored' ? new Date().toISOString() : typedDJ.last_penalty_applied_at,
      last_response_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any)
    .eq('dj_profile_id', djProfileId) as any);
}

/**
 * Handle lead response
 * Main function
 */
export async function handleLeadResponse(
  assignmentId: string,
  action: ResponseAction
): Promise<void> {
  const supabase = createClient();
  
  // Get assignment details
  // Type assertion needed because lead_assignments table may not be in generated types yet
  const { data: assignment, error } = await ((supabase
    .from('lead_assignments' as any) as any)
    .select('*, leads(id, routing_state)')
    .eq('id', assignmentId)
    .single() as any);
  
  if (error || !assignment) {
    throw new Error('Assignment not found');
  }
  
  // Type assertion needed because lead_assignments table may not be in generated types yet
  const typedAssignment = assignment as any;
  
  // Check if already responded
  if (typedAssignment.response_status !== 'pending') {
    throw new Error('Assignment already responded');
  }
  
  // Calculate response time
  const responseTime = calculateResponseTime(
    typedAssignment.phase_started_at,
    new Date().toISOString()
  );
  
  // Update assignment
  // Type assertion needed because lead_assignments table may not be in generated types yet
  await ((supabase
    .from('lead_assignments' as any) as any)
    .update({
      response_status: action,
      responded_at: new Date().toISOString(),
      response_time_seconds: responseTime,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', assignmentId) as any);
  
  // Update DJ metrics
  await updateDJMetrics(typedAssignment.dj_profile_id, action, responseTime);
  
  // Update lead state if first response
  const lead = typedAssignment.leads as any;
  if (lead && lead.routing_state !== 'responded') {
    // Type assertion needed because leads table may not be in generated types yet
    await ((supabase
      .from('leads' as any) as any)
      .update({
        routing_state: 'responded',
        first_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', lead.id) as any);
  }
  
  // If accepted, release other DJ locks (optional - could keep for backup)
  if (action === 'accepted') {
    // Release locks for other DJs on this lead
    // Type assertion needed because lead_assignments table may not be in generated types yet
    const { data: otherAssignments } = await ((supabase
      .from('lead_assignments' as any) as any)
      .select('dj_profile_id, leads(event_date)')
      .eq('lead_id', lead.id)
      .neq('dj_profile_id', typedAssignment.dj_profile_id)
      .eq('response_status', 'pending') as any);
    
    if (otherAssignments && lead) {
      const eventDate = (lead as any).event_date;
      for (const otherAssignment of otherAssignments as any[]) {
        // Type assertion needed because dj_availability table may not be in generated types yet
        await ((supabase
          .from('dj_availability' as any) as any)
          .update({
            locked_until: null,
            locked_by_lead_id: null
          } as any)
          .eq('dj_profile_id', otherAssignment.dj_profile_id)
          .eq('date', eventDate) as any);
      }
    }
  }
}

/**
 * Mark lead as converted (booking confirmed)
 */
export async function markLeadConverted(
  leadId: string,
  djProfileId: string
): Promise<void> {
  const supabase = createClient();
  
  // Update lead
  // Type assertion needed because leads table may not be in generated types yet
  await ((supabase
    .from('leads' as any) as any)
    .update({
      routing_state: 'converted',
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', leadId) as any);
  
  // Update DJ conversion rate
  // Type assertion needed because dj_routing_metrics table may not be in generated types yet
  const { data: dj } = await ((supabase
    .from('dj_routing_metrics' as any) as any)
    .select('total_leads_accepted, conversion_rate')
    .eq('dj_profile_id', djProfileId)
    .single() as any);
  
  const typedDJ = dj as any;
  if (typedDJ && typedDJ.total_leads_accepted) {
    // This is simplified - in production, track conversions separately
    const newConversionRate = Math.min(100, (typedDJ.conversion_rate || 0) + 1);
    
    // Type assertion needed because dj_routing_metrics table may not be in generated types yet
    await ((supabase
      .from('dj_routing_metrics' as any) as any)
      .update({
        conversion_rate: newConversionRate,
        updated_at: new Date().toISOString()
      } as any)
      .eq('dj_profile_id', djProfileId) as any);
  }
}

