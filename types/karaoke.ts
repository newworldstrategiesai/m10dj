/**
 * TypeScript types for Karaoke Mode feature
 */

export type KaraokeSignupStatus = 
  | 'queued' 
  | 'next' 
  | 'singing' 
  | 'completed' 
  | 'skipped' 
  | 'cancelled';

export type KaraokePaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'cancelled' 
  | 'free';

export type RotationFairnessMode = 
  | 'strict' 
  | 'flexible' 
  | 'disabled';

export type DisplayTheme = 
  | 'default' 
  | 'dark' 
  | 'colorful' 
  | 'minimal';

export interface KaraokeSignup {
  id: string;
  organization_id: string;
  event_id: string | null;
  event_qr_code: string | null;
  
  // Group info
  group_size: number; // 1 = solo, 2 = duo, 3 = trio, etc.
  singer_name: string;
  group_members: string[] | null; // Array of member names
  singer_email: string | null;
  singer_phone: string | null;
  
  // Song info
  song_title: string;
  song_artist: string | null;
  song_key: string | null;
  
  // Queue management
  queue_position: number;
  priority_order: number;
  status: KaraokeSignupStatus;
  
  // Payment
  is_priority: boolean;
  priority_fee: number; // in cents
  payment_status: KaraokePaymentStatus;
  payment_intent_id: string | null;
  stripe_session_id: string | null;
  
  // Rotation tracking
  singer_rotation_id: string | null;
  group_rotation_ids: string[] | null;
  times_sung: number;
  last_sung_at: string | null;
  
  // SMS Notifications
  next_up_notification_sent: boolean;
  next_up_notification_sent_at: string | null;
  currently_singing_notification_sent: boolean;
  currently_singing_notification_sent_at: string | null;
  sms_notification_error: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;

  // Admin
  admin_notes: string | null;
  crowd_request_id: string | null;

  // Video linking (added via API joins)
  video_id?: string | null;
  video_url?: string | null;
  video_embed_allowed?: boolean;
  video_data?: {
    id: string;
    youtube_video_id: string;
    youtube_video_title: string;
    youtube_channel_name?: string;
    youtube_channel_id?: string;
    video_quality_score: number;
    confidence_score: number;
    link_status: 'active' | 'broken' | 'removed' | 'flagged';
  } | null;
}

export interface KaraokeSettings {
  id: string;
  organization_id: string;

  // Feature flags
  karaoke_enabled: boolean;
  priority_pricing_enabled: boolean;
  rotation_enabled: boolean;

  // Pricing
  priority_fee_cents: number;
  free_signups_allowed: boolean;

  // Rotation settings
  max_singers_before_repeat: number;
  rotation_fairness_mode: RotationFairnessMode;

  // Display settings
  display_show_queue_count: number;
  display_theme: DisplayTheme;

  // Queue settings
  auto_advance: boolean;
  allow_skips: boolean;

  // Additional settings
  max_concurrent_singers: number | null;
  phone_field_mode: 'required' | 'optional' | 'disabled';
  sms_notifications_enabled: boolean;
  auto_refresh_interval_seconds: number;

  created_at: string;
  updated_at: string;
}

export interface CreateKaraokeSignupRequest {
  event_qr_code: string;
  organization_id: string;
  group_size: number;
  singer_name: string;
  group_members: string[];
  song_title: string;
  song_artist?: string;
  singer_email?: string;
  singer_phone?: string;
  is_priority?: boolean;
}

export interface KaraokeQueueResponse {
  current: KaraokeSignup | null;
  next: KaraokeSignup | null;
  queue: Array<{
    id: string;
    group_size: number;
    singer_name: string;
    group_members: string[] | null;
    song_title: string;
    song_artist: string | null;
    queue_position: number;
    estimated_wait: string;
    is_priority: boolean;
  }>;
  total_in_queue: number;
}

export interface UpdateKaraokeStatusRequest {
  signup_id: string;
  status: KaraokeSignupStatus;
  admin_notes?: string;
}

export interface ReorderKaraokeQueueRequest {
  signup_id: string;
  new_priority_order: number;
}

/**
 * Helper function to generate rotation ID from name and phone
 */
export function generateRotationId(name: string, phone?: string | null): string {
  const normalizedName = name.toLowerCase().trim().replace(/\s+/g, '-');
  if (phone) {
    const normalizedPhone = phone.replace(/\D/g, ''); // Remove non-digits
    return `${normalizedName}-${normalizedPhone}`;
  }
  return normalizedName;
}

/**
 * Helper function to get group label
 */
export function getGroupLabel(groupSize: number): string {
  switch (groupSize) {
    case 1:
      return 'Solo';
    case 2:
      return 'Duo';
    case 3:
      return 'Trio';
    default:
      return `Group (${groupSize})`;
  }
}

/**
 * Helper function to format group display name
 */
export function formatGroupDisplayName(
  singerName: string,
  groupMembers: string[] | null,
  groupSize: number
): string {
  if (groupSize === 1) {
    return singerName;
  }
  
  if (groupMembers && groupMembers.length > 0) {
    // Join all member names
    if (groupMembers.length <= 3) {
      return groupMembers.join(' & ');
    }
    // For larger groups, show first 2 and count
    return `${groupMembers.slice(0, 2).join(', ')} & ${groupMembers.length - 2} more`;
  }
  
  // Fallback to primary name
  return singerName;
}
