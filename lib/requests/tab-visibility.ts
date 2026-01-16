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

// Singleton client instances to prevent multiple GoTrueClient instances
let clientSideSupabaseInstance: ReturnType<typeof createClient> | null = null;
let serverSideSupabaseInstance: ReturnType<typeof createClient> | null = null;

/**
 * Get Supabase client (server-side with service role, client-side with anon key)
 * Uses singleton pattern to prevent multiple GoTrueClient instances
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }

  // Check if we're on the client side
  const isClient = typeof window !== 'undefined';

  if (isClient) {
    // Client-side: use anon key and singleton pattern
    if (!anonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured');
    }
    if (!clientSideSupabaseInstance) {
      clientSideSupabaseInstance = createClient(supabaseUrl, anonKey);
    }
    return clientSideSupabaseInstance;
  } else {
    // Server-side: use service role key and singleton pattern
    const key = serviceRoleKey || anonKey;
    if (!key) {
      throw new Error('Supabase key is not configured');
    }
    if (!serverSideSupabaseInstance) {
      serverSideSupabaseInstance = createClient(supabaseUrl, key);
    }
    return serverSideSupabaseInstance;
  }
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
        const defaults = orgDefaults as any;
        return {
          song_request_enabled: defaults.song_request_enabled ?? true,
          shoutout_enabled: defaults.shoutout_enabled ?? true,
          tip_enabled: defaults.tip_enabled ?? true,
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
      const defaults = platformDefaults as any;
      return {
        song_request_enabled: defaults.song_request_enabled ?? true,
        shoutout_enabled: defaults.shoutout_enabled ?? true,
        tip_enabled: defaults.tip_enabled ?? true,
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
 * Also respects the master toggle for song requests (requests_song_requests_enabled)
 */
export async function getAllowedRequestTypes(
  organizationId?: string | null
): Promise<string[]> {
  const settings = await getRequestTabSettings(organizationId);
  const allowed: string[] = [];

  // Check master toggle for song requests (only for TipJar organizations)
  let songRequestsMasterEnabled = true;
  if (organizationId) {
    try {
      const supabase = getSupabaseClient();
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('product_context, requests_song_requests_enabled')
        .eq('id', organizationId)
        .maybeSingle();

      if (!orgError && org) {
        const orgData = org as any;
        // Only check master toggle for TipJar organizations
        if (orgData.product_context === 'tipjar') {
          songRequestsMasterEnabled = orgData.requests_song_requests_enabled !== false;
        }
      }
    } catch (error) {
      console.warn('[Request Tabs] Error checking master toggle:', error);
      // Default to enabled on error
    }
  }

  // Only include song_request if both tab visibility AND master toggle allow it
  if (settings.song_request_enabled && songRequestsMasterEnabled) {
    allowed.push('song_request');
  }
  if (settings.shoutout_enabled) {
    allowed.push('shoutout');
  }
  if (settings.tip_enabled) {
    allowed.push('tip');
  }

  // Always return at least one type (default to shoutout or tip if song_request disabled)
  return allowed.length > 0 ? allowed : (settings.shoutout_enabled ? ['shoutout'] : ['tip']);
}

/**
 * Check if a specific request type is allowed
 * Also respects the master toggle for song requests (requests_song_requests_enabled)
 */
export async function isRequestTypeAllowed(
  requestType: 'song_request' | 'shoutout' | 'tip',
  organizationId?: string | null
): Promise<boolean> {
  const settings = await getRequestTabSettings(organizationId);
  
  switch (requestType) {
    case 'song_request':
      // Check master toggle for song requests (only for TipJar organizations)
      if (organizationId) {
        try {
          const supabase = getSupabaseClient();
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('product_context, requests_song_requests_enabled')
            .eq('id', organizationId)
            .maybeSingle();

          if (!orgError && org) {
            const orgData = org as any;
            // Only check master toggle for TipJar organizations
            if (orgData.product_context === 'tipjar') {
              const masterEnabled = orgData.requests_song_requests_enabled !== false;
              return settings.song_request_enabled && masterEnabled;
            }
          }
        } catch (error) {
          console.warn('[Request Tabs] Error checking master toggle:', error);
          // Default to tab visibility setting on error
        }
      }
      return settings.song_request_enabled;
    case 'shoutout':
      return settings.shoutout_enabled;
    case 'tip':
      return settings.tip_enabled;
    default:
      return false;
  }
}
