'use client';

import { useEffect, useState, useRef } from 'react';
import '@/components/tipjar/stream-alerts/animations.css';
import { createClient } from '@/utils/supabase/client';
import { AlertDisplay } from '@/components/tipjar/stream-alerts/AlertDisplay';
import { DonorTicker } from '@/components/tipjar/stream-alerts/DonorTicker';
import { GoalBar } from '@/components/tipjar/stream-alerts/GoalBar';
import { BrandingBadge } from '@/components/tipjar/stream-alerts/BrandingBadge';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface StreamAlertConfig {
  id: string;
  user_id: string;
  theme: 'dark' | 'neon' | 'retro' | 'minimal' | 'pride';
  background_image_url: string | null;
  font_color: string;
  layout_position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  alert_duration_ms: number;
  sound_enabled: boolean;
  sound_volume: number;
  sound_file_url: string | null;
  built_in_sound: 'default' | 'cash' | 'coin' | 'success' | 'celebration';
  tts_enabled: boolean;
  goal_enabled: boolean;
  goal_title: string | null;
  goal_amount: number | null;
  goal_current: number;
  ticker_enabled: boolean;
  ticker_count: number;
  show_branding: boolean;
  pointer_events_disabled: boolean;
}

interface AlertEvent {
  id: string;
  event_type: 'tip' | 'song_request' | 'merch_purchase' | 'follower' | 'subscriber';
  event_data: any;
  created_at: string;
}

interface RecentDonor {
  id: string;
  donor_name: string;
  amount: number | null;
  event_type: string;
  created_at: string;
}

export default function StreamAlertsPage({ params }: { params: { username: string[] } }) {
  const [config, setConfig] = useState<StreamAlertConfig | null>(null);
  const [currentAlert, setCurrentAlert] = useState<AlertEvent | null>(null);
  const [recentDonors, setRecentDonors] = useState<RecentDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  // Extract username from params (could be @username or just username)
  const username = params.username?.[0]?.replace('@', '') || '';
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const userParam = searchParams?.get('user');

  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      try {
        // Try to find user by username or user param
        let userId: string | null = null;

        if (username) {
          const { data: configData } = await supabase
            .from('stream_alert_configs')
            .select('user_id, username')
            .eq('username', username.toLowerCase())
            .single();

          if (configData && (configData as { user_id?: string }).user_id) {
            userId = (configData as { user_id: string }).user_id;
          }
        }

        // Fallback to user param (could be user_id or alert_token)
        if (!userId && userParam) {
          const { data: configData } = await supabase
            .from('stream_alert_configs')
            .select('user_id')
            .or(`alert_token.eq.${userParam},user_id.eq.${userParam}`)
            .single();

          if (configData && (configData as { user_id?: string }).user_id) {
            userId = (configData as { user_id: string }).user_id;
          }
        }

        if (!userId) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Load config
        const { data: configData, error: configError } = await supabase
          .from('stream_alert_configs')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (configError || !configData) {
          setError('Configuration not found');
          setLoading(false);
          return;
        }

        const typedConfigData = configData as StreamAlertConfig;

        if (mounted) {
          setConfig(typedConfigData);
        }

        // Load recent donors
        const { data: donorsData } = await supabase
          .from('stream_recent_donors')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(typedConfigData.ticker_count || 5);

        if (mounted && donorsData) {
          setRecentDonors(donorsData as RecentDonor[]);
        }

        // Fetch affiliate code for this user's organization
        if (mounted && userId) {
          try {
            const { data: orgData, error: orgError } = await supabase
              .from('organizations')
              .select('id')
              .eq('owner_id', userId)
              .eq('product_context', 'tipjar')
              .maybeSingle();

            if (!orgError && orgData) {
              const orgId = (orgData as { id: string }).id;
              const { data: affiliateData, error: affiliateError } = await supabase
                .from('affiliates')
                .select('affiliate_code')
                .eq('organization_id', orgId)
                .eq('status', 'active')
                .maybeSingle();

              if (mounted && !affiliateError && affiliateData) {
                const code = (affiliateData as { affiliate_code: string }).affiliate_code;
                if (code) {
                  setAffiliateCode(code);
                }
              }
            }
          } catch (error) {
            // Silently fail - affiliate code is optional
            console.error('Error fetching affiliate code:', error);
          }
        }

        // Subscribe to real-time events
        const channel = supabase
          .channel(`stream-alerts-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'stream_alert_events',
              filter: `user_id=eq.${userId}`,
            },
            async (payload: any) => {
              const newEvent = payload.new as AlertEvent;
              
              if (mounted) {
                setCurrentAlert(newEvent);
                
                // Update recent donors if it's a tip
                if (newEvent.event_type === 'tip' && newEvent.event_data?.name) {
                  const donorData = {
                    user_id: userId!,
                    donor_name: newEvent.event_data.name,
                    amount: newEvent.event_data.amount || null,
                    event_type: 'tip',
                  };

                  await supabase.from('stream_recent_donors').insert(donorData as any);

                  // Refresh recent donors
                  const { data: updatedDonors } = await supabase
                    .from('stream_recent_donors')
                    .select('*')
                    .eq('user_id', userId!)
                    .order('created_at', { ascending: false })
                    .limit(typedConfigData.ticker_count || 5);

                  if (mounted && updatedDonors) {
                    setRecentDonors(updatedDonors as RecentDonor[]);
                  }
                }

                // Update goal if enabled
                if (typedConfigData.goal_enabled && newEvent.event_type === 'tip' && newEvent.event_data?.amount) {
                  const newGoalCurrent = (typedConfigData.goal_current || 0) + parseFloat(newEvent.event_data.amount);
                  await (supabase
                    .from('stream_alert_configs') as any)
                    .update({ goal_current: newGoalCurrent })
                    .eq('user_id', userId!);
                  
                  if (mounted) {
                    setConfig(prev => prev ? { ...prev, goal_current: newGoalCurrent } : null);
                  }
                }
              }
            }
          )
          .subscribe();

        channelRef.current = channel;

        setLoading(false);
      } catch (err) {
        console.error('Error loading stream alerts:', err);
        if (mounted) {
          setError('Failed to load alerts');
          setLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [username, userParam, supabase]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Loading alerts...</div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">{error || 'Configuration not found'}</div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: config.pointer_events_disabled ? 'none' : 'auto',
    backgroundImage: config.background_image_url ? `url(${config.background_image_url})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'hidden',
  };

  const getLayoutClasses = () => {
    const base = 'fixed';
    switch (config.layout_position) {
      case 'left':
        return `${base} left-0 top-1/2 -translate-y-1/2`;
      case 'right':
        return `${base} right-0 top-1/2 -translate-y-1/2`;
      case 'top':
        return `${base} top-0 left-1/2 -translate-x-1/2`;
      case 'bottom':
        return `${base} bottom-0 left-1/2 -translate-x-1/2`;
      default:
        return `${base} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`;
    }
  };

  return (
    <div style={containerStyle} className="bg-black">
      {/* Main Alert Display */}
      {currentAlert && (
        <div className={getLayoutClasses()}>
          <AlertDisplay
            event={currentAlert}
            config={config}
            onComplete={() => setCurrentAlert(null)}
          />
        </div>
      )}

      {/* Donor Ticker */}
      {config.ticker_enabled && recentDonors.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 z-10">
          <DonorTicker donors={recentDonors} theme={config.theme} />
        </div>
      )}

      {/* Goal Bar */}
      {config.goal_enabled && config.goal_amount && (
        <div className="fixed top-4 left-4 right-4 z-10">
          <GoalBar
            title={config.goal_title || 'Goal'}
            current={config.goal_current}
            target={config.goal_amount}
            theme={config.theme}
          />
        </div>
      )}

      {/* Branding Badge */}
      {config.show_branding && (
        <div className="fixed bottom-4 right-4 z-10">
          <BrandingBadge affiliateCode={affiliateCode} />
        </div>
      )}
    </div>
  );
}

