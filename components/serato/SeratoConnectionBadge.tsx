'use client';

/**
 * Component: SeratoConnectionBadge
 * 
 * A compact badge showing Serato connection status.
 * Useful for headers/nav bars.
 */

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Wifi, WifiOff } from 'lucide-react';

interface SeratoConnectionBadgeProps {
  djId: string | null;
  showLabel?: boolean;
  className?: string;
}

export function SeratoConnectionBadge({ 
  djId, 
  showLabel = true,
  className = '' 
}: SeratoConnectionBadgeProps) {
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!djId) {
      setIsLoading(false);
      return;
    }

    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('serato_connections')
          .select('is_connected, last_heartbeat')
          .eq('dj_id', djId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking Serato connection:', error);
          return;
        }

        if (data) {
          // Check if stale (no heartbeat in 2 minutes)
          const isStale = data.last_heartbeat
            ? (Date.now() - new Date(data.last_heartbeat).getTime()) > 120000
            : true;

          setConnected(data.is_connected && !isStale);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();

    // Subscribe to changes
    const channel = supabase
      .channel(`serato-badge-${djId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'serato_connections',
          filter: `dj_id=eq.${djId}`
        },
        (payload) => {
          const conn = payload.new as any;
          if (conn) {
            const isStale = conn.last_heartbeat
              ? (Date.now() - new Date(conn.last_heartbeat).getTime()) > 120000
              : true;
            setConnected(conn.is_connected && !isStale);
          }
        }
      )
      .subscribe();

    // Periodic check for stale connections
    const interval = setInterval(checkConnection, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [djId, supabase]);

  if (!djId || isLoading) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          {showLabel && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Serato
            </span>
          )}
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-400" />
          </span>
          {showLabel && (
            <span className="text-xs text-muted-foreground">
              Serato
            </span>
          )}
        </>
      )}
    </div>
  );
}

