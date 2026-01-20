/**
 * Caching utilities for karaoke performance optimization
 * Reduces database load and improves response times
 */

import { KaraokeSignup, KaraokeSettings } from '@/types/karaoke';

// Simple in-memory cache with TTL
class MemoryCache<T> {
  private cache = new Map<string, { data: T; expires: number }>();

  constructor(private defaultTTL: number = 300000) {} // 5 minutes default

  set(key: string, data: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expires });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, item] of entries) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // Periodic cleanup
  startCleanup(interval: number = 60000): void { // Every minute
    setInterval(() => this.cleanup(), interval);
  }
}

// Global cache instances
const settingsCache = new MemoryCache<KaraokeSettings>(600000); // 10 minutes
const queueCache = new MemoryCache<any>(30000); // 30 seconds
const analyticsCache = new MemoryCache<any>(300000); // 5 minutes

// Start cleanup for all caches
settingsCache.startCleanup();
queueCache.startCleanup();
analyticsCache.startCleanup();

/**
 * Cached karaoke settings lookup
 */
export async function getCachedKaraokeSettings(organizationId: string): Promise<KaraokeSettings | null> {
  const cacheKey = `settings:${organizationId}`;

  // Check cache first
  const cached = settingsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from database
  try {
    const supabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('karaoke_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching karaoke settings:', error);
      return null;
    }

    // Use default settings if none exist
    const settings = data || {
      id: 'default',
      organization_id: organizationId,
      karaoke_enabled: true,
      priority_pricing_enabled: true,
      rotation_enabled: true,
      priority_fee_cents: 1000,
      free_signups_allowed: true,
      max_singers_before_repeat: 3,
      rotation_fairness_mode: 'strict',
      display_show_queue_count: 5,
      display_theme: 'default',
      auto_advance: false,
      allow_skips: true,
      max_concurrent_singers: null,
      phone_field_mode: 'required',
      sms_notifications_enabled: true,
      auto_refresh_interval_seconds: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Cache the result
    settingsCache.set(cacheKey, settings);

    return settings;
  } catch (error) {
    console.error('Failed to fetch karaoke settings:', error);
    return null;
  }
}

/**
 * Cached queue data with automatic invalidation
 */
export async function getCachedQueueData(organizationId: string, eventCode?: string): Promise<any | null> {
  const cacheKey = `queue:${organizationId}:${eventCode || 'all'}`;

  // Check cache first
  const cached = queueCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch fresh data
  try {
    const supabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const query = supabase
      .from('karaoke_signups')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['queued', 'next', 'singing'])
      .order('priority_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (eventCode && eventCode !== 'all') {
      query.eq('event_qr_code', eventCode);
    }

    const { data: signups, error } = await query;

    if (error) {
      console.error('Error fetching queue data:', error);
      return null;
    }

    // Process queue data (reuse existing logic)
    const { getCurrentSinger, getNextSinger, getQueue, calculateEstimatedWait, formatEstimatedWait } =
      await import('@/utils/karaoke-queue');

    const current = getCurrentSinger(signups || []);
    const next = getNextSinger(signups || []);
    const queue = getQueue(signups || []);

    const formattedQueue = queue.map((signup: KaraokeSignup, index: number) => ({
      id: signup.id,
      group_size: signup.group_size,
      singer_name: signup.singer_name,
      group_members: signup.group_members,
      song_title: signup.song_title,
      song_artist: signup.song_artist,
      queue_position: index + 1,
      estimated_wait: formatEstimatedWait(calculateEstimatedWait(signup, signups || [])),
      is_priority: signup.is_priority
    }));

    const queueData = {
      current: current ? {
        id: current.id,
        group_size: current.group_size,
        singer_name: current.singer_name,
        group_members: current.group_members,
        song_title: current.song_title,
        song_artist: current.song_artist,
        started_at: current.started_at
      } : null,
      next: next ? {
        id: next.id,
        group_size: next.group_size,
        singer_name: next.singer_name,
        group_members: next.group_members,
        song_title: next.song_title,
        song_artist: next.song_artist
      } : null,
      queue: formattedQueue,
      total_in_queue: formattedQueue.length + (current ? 1 : 0) + (next ? 1 : 0),
      last_updated: new Date().toISOString()
    };

    // Cache for 30 seconds
    queueCache.set(cacheKey, queueData, 30000);

    return queueData;
  } catch (error) {
    console.error('Failed to fetch queue data:', error);
    return null;
  }
}

/**
 * Cached analytics data
 */
export async function getCachedAnalytics(organizationId: string): Promise<any | null> {
  const cacheKey = `analytics:${organizationId}`;

  // Check cache first
  const cached = analyticsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const supabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get analytics data
    const { data, error } = await supabase
      .from('karaoke_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }

    // Cache for 5 minutes
    analyticsCache.set(cacheKey, data, 300000);

    return data;
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return null;
  }
}

/**
 * Invalidate cache entries when data changes
 */
export function invalidateCache(type: 'settings' | 'queue' | 'analytics', organizationId: string, eventCode?: string): void {
  switch (type) {
    case 'settings':
      settingsCache.delete(`settings:${organizationId}`);
      break;

    case 'queue':
      // Invalidate all queue caches for this organization
      // Since we can't easily iterate, we'll clear all queue caches (simple approach)
      queueCache.clear();
      break;

    case 'analytics':
      analyticsCache.delete(`analytics:${organizationId}`);
      break;
  }
}

/**
 * Cache warming for frequently accessed data
 */
export async function warmCache(organizationId: string): Promise<void> {
  try {
    // Pre-load frequently accessed data
    await Promise.allSettled([
      getCachedKaraokeSettings(organizationId),
      getCachedAnalytics(organizationId),
      getCachedQueueData(organizationId)
    ]);

    console.log(`Cache warmed for organization ${organizationId}`);
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  settings: { size: number };
  queue: { size: number };
  analytics: { size: number };
} {
  return {
    settings: { size: (settingsCache as any).cache.size },
    queue: { size: (queueCache as any).cache.size },
    analytics: { size: (analyticsCache as any).cache.size }
  };
}