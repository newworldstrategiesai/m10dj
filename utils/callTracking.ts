/**
 * Call Tracking & Attribution Service
 * Handles Dynamic Number Insertion (DNI) and call attribution
 */

import { createClient } from '@/utils/supabase/server';

export interface CallEvent {
  virtual_number: string;
  caller_number: string;
  call_duration_seconds: number;
  call_status: 'completed' | 'no_answer' | 'busy' | 'failed' | 'voicemail';
  recording_url?: string;
  transcription_text?: string;
}

export interface CallAttribution {
  dj_profile_id?: string;
  lead_id?: string;
  city?: string;
  state?: string;
  source_page?: string;
}

/**
 * Hash phone number for privacy
 */
function hashPhoneNumber(phone: string): string {
  // Simple hash - in production, use proper hashing (bcrypt, etc.)
  // This is just for demonstration
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(phone).digest('hex').substring(0, 16);
}

/**
 * Get virtual number for DJ profile
 */
export async function getVirtualNumberForDJ(
  djProfileId: string
): Promise<string | null> {
  const supabase = createClient();
  
  // Get virtual number (with rotation)
  // Query directly since RPC function may not be available yet
  const { data: virtualNumber } = await supabase
    .from('dj_virtual_numbers')
    .select('virtual_number')
    .eq('dj_profile_id', djProfileId)
    .eq('is_active', true)
    .eq('product_context', 'djdash')
    .order('rotation_weight', { ascending: false, nullsFirst: false })
    .limit(1)
    .single();
  
  return (virtualNumber as any)?.virtual_number || null;
}

/**
 * Log call event
 */
export async function logCallEvent(
  event: CallEvent,
  attribution: CallAttribution
): Promise<string> {
  const supabase = createClient();
  
  const callerHash = hashPhoneNumber(event.caller_number);
  
  // Type assertion needed because call_leads table may not be in generated types yet
  const { data, error } = await ((supabase
    .from('call_leads' as any) as any)
    .insert({
      virtual_number: event.virtual_number,
      caller_number_hash: callerHash,
      call_duration_seconds: event.call_duration_seconds,
      call_started_at: new Date().toISOString(),
      call_ended_at: new Date().toISOString(),
      call_status: event.call_status,
      recording_url: event.recording_url || null,
      transcription_text: event.transcription_text || null,
      dj_profile_id: attribution.dj_profile_id || null,
      lead_id: attribution.lead_id || null,
      city: attribution.city || null,
      state: attribution.state || null,
      source_page: attribution.source_page || null,
      product_context: 'djdash'
    } as any)
    .select()
    .single() as any);
  
  if (error) {
    throw new Error(`Failed to log call: ${error.message}`);
  }
  
  // Determine if billable (>= 60 seconds)
  const isBillable = event.call_duration_seconds >= 60;
  
  // Check for repeat caller (within 7 days)
  if (isBillable && attribution.dj_profile_id) {
    const { data: recentCalls } = await ((supabase
      .from('call_leads' as any) as any)
      .select('id')
      .eq('caller_number_hash', callerHash)
      .eq('dj_profile_id', attribution.dj_profile_id)
      .gte('call_started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1) as any);
    
    // If repeat caller, could link to same lead
    // This is simplified - in production, implement proper lead matching
  }
  
  return (data as any)?.id || null;
}

/**
 * Attribute call to lead
 */
export async function attributeCallToLead(
  callId: string,
  leadId: string
): Promise<void> {
  const supabase = createClient();
  
  // Type assertion needed because call_leads table may not be in generated types yet
  await ((supabase
    .from('call_leads' as any) as any)
    .update({
      lead_id: leadId,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', callId) as any);
}

/**
 * Mark call as converted to booking
 */
export async function markCallConverted(
  callId: string,
  bookingId: string,
  conversionValue: number
): Promise<void> {
  const supabase = createClient();
  
  // Type assertion needed because call_leads table may not be in generated types yet
  await ((supabase
    .from('call_leads' as any) as any)
    .update({
      converted_to_booking: true,
      booking_id: bookingId,
      conversion_value: conversionValue,
      updated_at: new Date().toISOString()
    } as any)
    .eq('id', callId) as any);
}

/**
 * Get call stats for DJ
 */
export async function getDJCallStats(
  djProfileId: string,
  daysBack: number = 30
): Promise<{
  total_calls: number;
  total_duration_minutes: number;
  conversion_rate: number;
  avg_call_duration_seconds: number;
}> {
  const supabase = createClient();
  
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  
  // Type assertion needed because call_leads table may not be in generated types yet
  const { data: calls } = await ((supabase
    .from('call_leads' as any) as any)
    .select('call_duration_seconds, converted_to_booking')
    .eq('dj_profile_id', djProfileId)
    .gte('call_started_at', since.toISOString())
    .eq('call_status', 'completed') as any);
  
  const typedCalls = (calls || []) as any[];
  
  if (typedCalls.length === 0) {
    return {
      total_calls: 0,
      total_duration_minutes: 0,
      conversion_rate: 0,
      avg_call_duration_seconds: 0
    };
  }
  
  const totalCalls = typedCalls.length;
  const totalDuration = typedCalls.reduce((sum: number, c: any) => sum + (c.call_duration_seconds || 0), 0);
  const conversions = typedCalls.filter((c: any) => c.converted_to_booking).length;
  
  return {
    total_calls: totalCalls,
    total_duration_minutes: Math.round(totalDuration / 60),
    conversion_rate: (conversions / totalCalls) * 100,
    avg_call_duration_seconds: Math.round(totalDuration / totalCalls)
  };
}

