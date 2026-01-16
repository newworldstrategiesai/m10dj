/**
 * Request Tab Visibility Controls
 * 
 * Provides utilities to check which tabs should be visible on the requests page
 * based on platform and organization-level settings.
 */

import { createClient } from '@supabase/supabase-js';

export interface RequestTabSettings {
  song_request_enabled: boolean;
  shoutout_enabled: boolean;
  tip_enabled: boolean;
}

export interface RequestTabDefaults {
  id: string;
  organization_id: string | null;
  song_request_enabled: boolean;
  shoutout_enabled: boolean;
  tip_enabled: boolean;
  updated_by: string | null;
  updated_at: string;
  notes: string | null;
}

/**
 * Get Supabase client (server-side with service role, client-side with anon key)
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  // Prefer service role key for server-side operations
  const key = serviceRoleKey || anonKey;
  if (!key) {
    throw new Error('Supabase key is not configured');
  }

  return createClient(supabaseUrl, key);
}

/**
 * Get request tab visibility settings for an organization
 * Returns organization-level settings if exists, otherwise platform-level settings
 */
export async function getRequestTabSettings(
  organizationId?: string | null
): Promise<RequestTabSettings> {
  try {
    const supabase = getSupabaseClient();

    // First, try to get organization-level settings
    if (organizationId) {
      const { data: orgDefaults, error: orgError } = await supabase
        .from('request_tab_defaults')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (orgError) {
        console.warn('[Request Tabs] Error fetching org defaults:', orgError);
      } else if (orgDefaults) {
        return {
          song_request_enabled: orgDefaults.song_request_enabled ?? true,
          shoutout_enabled: orgDefaults.shoutout_enabled ?? true,
          tip_enabled: orgDefaults.tip_enabled ?? true,
        };
      }
    }

    // Fall back to platform-level settings
    const { data: platformDefaults, error: platformError } = await supabase
      .from('request_tab_defaults')
      .select('*')
      .is('organization_id', null)
      .maybeSingle();

    if (platformError) {
      console.warn('[Request Tabs] Error fetching platform defaults:', platformError);
    } else if (platformDefaults) {
      return {
        song_request_enabled: platformDefaults.song_request_enabled ?? true,
        shoutout_enabled: platformDefaults.shoutout_enabled ?? true,
        tip_enabled: platformDefaults.tip_enabled ?? true,
      };
    }

    // Default: all enabled
    return {
      song_request_enabled: true,
      shoutout_enabled: true,
      tip_enabled: true,
    };
  } catch (error) {
    console.error('[Request Tabs] Error getting tab settings:', error);
    // Default: all enabled on error
    return {
      song_request_enabled: true,
      shoutout_enabled: true,
      tip_enabled: true,
    };
  }
}

/**
 * Get allowed request types array based on tab visibility settings
 * Returns array like ['song_request', 'shoutout', 'tip'] or subset
 */
export async function getAllowedRequestTypes(
  organizationId?: string | null
): Promise<string[]> {
  const settings = await getRequestTabSettings(organizationId);
  const allowed: string[] = [];

  if (settings.song_request_enabled) {
    allowed.push('song_request');
  }
  if (settings.shoutout_enabled) {
    allowed.push('shoutout');
  }
  if (settings.tip_enabled) {
    allowed.push('tip');
  }

  // Always return at least one type (default to song_request if all disabled)
  return allowed.length > 0 ? allowed : ['song_request'];
}

/**
 * Check if a specific request type is allowed
 */
export async function isRequestTypeAllowed(
  requestType: 'song_request' | 'shoutout' | 'tip',
  organizationId?: string | null
): Promise<boolean> {
  const settings = await getRequestTabSettings(organizationId);
  
  switch (requestType) {
    case 'song_request':
      return settings.song_request_enabled;
    case 'shoutout':
      return settings.shoutout_enabled;
    case 'tip':
      return settings.tip_enabled;
    default:
      return false;
  }
}
