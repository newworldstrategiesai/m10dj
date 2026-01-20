/**
 * Queue calculation logic for karaoke signups
 */

import { KaraokeSignup, KaraokeSettings } from '@/types/karaoke';

/**
 * Calculate queue position for a signup based on priority and creation time
 */
export function calculateQueuePosition(
  signup: KaraokeSignup,
  allSignups: KaraokeSignup[]
): number {
  // Filter active signups (queued or next)
  const active = allSignups.filter(s => 
    s.status === 'queued' || s.status === 'next'
  );
  
  // Sort by priority_order (lower = higher priority), then created_at
  const sorted = active.sort((a, b) => {
    if (a.priority_order !== b.priority_order) {
      return a.priority_order - b.priority_order;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  const position = sorted.findIndex(s => s.id === signup.id);
  return position >= 0 ? position + 1 : 0;
}

/**
 * Calculate estimated wait time in minutes
 */
export function calculateEstimatedWait(
  signup: KaraokeSignup,
  allSignups: KaraokeSignup[],
  averageSongDurationMinutes: number = 3.5
): number {
  const position = calculateQueuePosition(signup, allSignups);
  
  // Count how many are ahead (including currently singing)
  const ahead = allSignups.filter(s => {
    if (s.id === signup.id) return false;
    if (s.status === 'singing') return true;
    if (s.status === 'queued' || s.status === 'next') {
      const sPos = calculateQueuePosition(s, allSignups);
      const signupPos = calculateQueuePosition(signup, allSignups);
      return sPos < signupPos;
    }
    return false;
  }).length;
  
  return Math.ceil(ahead * averageSongDurationMinutes);
}

/**
 * Get queue health status
 */
export function getQueueHealth(queueLength: number): {
  status: 'low' | 'good' | 'long';
  label: string;
  color: string;
} {
  if (queueLength < 3) {
    return { status: 'low', label: 'Low', color: 'yellow' };
  }
  if (queueLength > 15) {
    return { status: 'long', label: 'Long Wait', color: 'red' };
  }
  return { status: 'good', label: 'Good', color: 'green' };
}

/**
 * Format estimated wait time as string
 */
export function formatEstimatedWait(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 min';
  }
  if (minutes === 1) {
    return '1 min';
  }
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins} ${mins === 1 ? 'min' : 'mins'}`;
}

/**
 * Get sorted queue (for display)
 */
export function getSortedQueue(
  allSignups: KaraokeSignup[],
  includeCompleted: boolean = false
): KaraokeSignup[] {
  const statuses: KaraokeSignup['status'][] = includeCompleted
    ? ['queued', 'next', 'singing', 'completed']
    : ['queued', 'next', 'singing'];
  
  const filtered = allSignups.filter(s => statuses.includes(s.status));
  
  return filtered.sort((a, b) => {
    // First, sort by status priority
    const statusOrder: Record<KaraokeSignup['status'], number> = {
      'singing': 0,
      'next': 1,
      'queued': 2,
      'completed': 3,
      'skipped': 4,
      'cancelled': 5
    };
    
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    
    // Then by priority_order
    if (a.priority_order !== b.priority_order) {
      return a.priority_order - b.priority_order;
    }
    
    // Finally by creation time
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Get current singer (status = 'singing')
 */
export function getCurrentSinger(signups: KaraokeSignup[]): KaraokeSignup | null {
  return signups.find(s => s.status === 'singing') || null;
}

/**
 * Get next singer (status = 'next')
 */
export function getNextSinger(signups: KaraokeSignup[]): KaraokeSignup | null {
  return signups.find(s => s.status === 'next') || null;
}

/**
 * Get queue (status = 'queued')
 */
export function getQueue(signups: KaraokeSignup[]): KaraokeSignup[] {
  return signups
    .filter(s => s.status === 'queued')
    .sort((a, b) => {
      if (a.priority_order !== b.priority_order) {
        return a.priority_order - b.priority_order;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}
