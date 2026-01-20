/**
 * Rotation fairness algorithm for karaoke signups
 * Ensures fair rotation by tracking individual group members
 */

import { KaraokeSignup, KaraokeSettings, generateRotationId } from '@/types/karaoke';

/**
 * Calculate rotation priority for a signup
 * Lower number = higher priority (can sing sooner)
 */
export function calculateRotationPriority(
  signup: KaraokeSignup,
  allSignups: KaraokeSignup[],
  settings: KaraokeSettings
): number {
  if (!settings.rotation_enabled) {
    return 1000; // Default priority when rotation is disabled
  }
  
  // Get all rotation IDs to check (for groups, check all members)
  const rotationIdsToCheck = signup.group_rotation_ids || 
    (signup.singer_rotation_id ? [signup.singer_rotation_id] : []);
  
  if (rotationIdsToCheck.length === 0) {
    return 1000; // No rotation ID, default priority
  }
  
  // Find the most recent performance by any group member
  let mostRecentPerformance: KaraokeSignup | null = null;
  
  for (const rotationId of rotationIdsToCheck) {
    // Find all completed signups by this rotation ID (or containing it in group_rotation_ids)
    const sameSinger = allSignups.filter(s => {
      if (s.id === signup.id) return false; // Exclude current signup
      if (s.status !== 'completed' || !s.completed_at) return false;
      
      // Check if this signup is by the same person (by rotation ID)
      return s.singer_rotation_id === rotationId ||
        (s.group_rotation_ids && s.group_rotation_ids.includes(rotationId));
    });
    
    if (sameSinger.length > 0) {
      // Get the most recent one
      const lastSung = sameSinger.sort((a, b) => 
        new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
      )[0];
      
      if (!mostRecentPerformance || 
          new Date(lastSung.completed_at!) > new Date(mostRecentPerformance.completed_at!)) {
        mostRecentPerformance = lastSung;
      }
    }
  }
  
  // If no previous performance found, this is first time - higher priority
  if (!mostRecentPerformance) {
    return 100; // First time for all group members, higher priority
  }
  
  // Count how many others have sung since any group member last sang
  const othersSince = allSignups.filter(s => {
    if (s.id === signup.id) return false;
    if (s.status !== 'completed' || !s.completed_at) return false;
    
    // Count signups completed after the most recent performance
    return new Date(s.completed_at) > new Date(mostRecentPerformance!.completed_at!);
  }).length;
  
  // If enough others have sung, allow this singer/group again
  if (othersSince >= settings.max_singers_before_repeat) {
    return 100; // Can sing again
  }
  
  // Otherwise, lower priority (higher number = lower priority)
  // Calculate based on how many more need to sing
  const remaining = settings.max_singers_before_repeat - othersSince;
  return 500 + (remaining * 100);
}

/**
 * Generate rotation IDs for a signup based on group members
 */
export function generateRotationIdsForSignup(
  singerName: string,
  groupMembers: string[] | null,
  groupSize: number,
  phone?: string | null
): { singer_rotation_id: string; group_rotation_ids: string[] } {
  // Primary rotation ID (based on primary singer)
  const singerRotationId = generateRotationId(singerName, phone);
  
  // For groups, generate rotation IDs for all members
  let groupRotationIds: string[] = [singerRotationId];
  
  if (groupSize > 1 && groupMembers && groupMembers.length > 0) {
    // Generate rotation IDs for all group members
    groupRotationIds = groupMembers.map(name => generateRotationId(name));
    
    // Ensure primary is included
    if (!groupRotationIds.includes(singerRotationId)) {
      groupRotationIds.push(singerRotationId);
    }
  }
  
  return {
    singer_rotation_id: singerRotationId,
    group_rotation_ids: groupRotationIds
  };
}

/**
 * Check if a signup can proceed based on rotation rules
 */
export function canSignupProceed(
  signup: KaraokeSignup,
  allSignups: KaraokeSignup[],
  settings: KaraokeSettings
): { canProceed: boolean; reason?: string } {
  if (!settings.rotation_enabled) {
    return { canProceed: true };
  }
  
  if (settings.rotation_fairness_mode === 'disabled') {
    return { canProceed: true };
  }
  
  // Calculate rotation priority
  const rotationPriority = calculateRotationPriority(signup, allSignups, settings);
  
  // If priority is 100 or less, they can proceed
  if (rotationPriority <= 100) {
    return { canProceed: true };
  }
  
  // Check if they have priority payment (can bypass rotation)
  if (signup.is_priority && signup.payment_status === 'paid') {
    if (settings.rotation_fairness_mode === 'flexible') {
      return { canProceed: true };
    }
  }
  
  // Calculate how many more need to sing
  const rotationIdsToCheck = signup.group_rotation_ids || 
    (signup.singer_rotation_id ? [signup.singer_rotation_id] : []);
  
  let mostRecentPerformance: KaraokeSignup | null = null;
  
  for (const rotationId of rotationIdsToCheck) {
    const sameSinger = allSignups.filter(s => {
      if (s.id === signup.id) return false;
      if (s.status !== 'completed' || !s.completed_at) return false;
      return s.singer_rotation_id === rotationId ||
        (s.group_rotation_ids && s.group_rotation_ids.includes(rotationId));
    });
    
    if (sameSinger.length > 0) {
      const lastSung = sameSinger.sort((a, b) => 
        new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
      )[0];
      
      if (!mostRecentPerformance || 
          new Date(lastSung.completed_at!) > new Date(mostRecentPerformance.completed_at!)) {
        mostRecentPerformance = lastSung;
      }
    }
  }
  
  if (!mostRecentPerformance) {
    return { canProceed: true };
  }
  
  const othersSince = allSignups.filter(s => {
    if (s.id === signup.id) return false;
    if (s.status !== 'completed' || !s.completed_at) return false;
    return new Date(s.completed_at) > new Date(mostRecentPerformance!.completed_at!);
  }).length;
  
  const remaining = settings.max_singers_before_repeat - othersSince;
  
  if (remaining > 0) {
    return {
      canProceed: false,
      reason: `Please wait for ${remaining} more ${remaining === 1 ? 'singer' : 'singers'} to perform before signing up again.`
    };
  }
  
  return { canProceed: true };
}
