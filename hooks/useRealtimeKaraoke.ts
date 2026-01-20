/**
 * React hook for real-time karaoke queue updates using Server-Sent Events
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface QueueData {
  current: any;
  next: any;
  queue: any[];
  total_in_queue: number;
}

export interface RealtimeUpdate {
  type: 'queue_update' | 'heartbeat' | 'connected';
  timestamp: string;
  data?: any;
  updateType?: string;
}

/**
 * Hook for subscribing to real-time karaoke queue updates
 */
export function useRealtimeKaraoke(
  organizationId: string | null,
  eventCode: string | null,
  enabled: boolean = true
) {
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!organizationId || !eventCode || !enabled) {
      return;
    }

    // Clean up existing connection
    disconnect();

    try {
      const url = `/api/karaoke/realtime/${organizationId}/${eventCode}`;
      console.log('Connecting to SSE:', url);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data);

          switch (update.type) {
            case 'connected':
              console.log('SSE connection confirmed');
              setIsConnected(true);
              break;

            case 'heartbeat':
              // Keep connection alive, no action needed
              break;

            case 'queue_update':
              console.log('Queue update received:', update);
              setLastUpdate(new Date(update.timestamp));

              // Update queue data if provided
              if (update.data) {
                setQueueData(update.data);
              }
              break;

            default:
              console.log('Unknown update type:', update.type);
          }
        } catch (parseError) {
          console.error('Failed to parse SSE message:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setIsConnected(false);
        setError('Connection lost');

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`Attempting reconnection in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError('Failed to reconnect after multiple attempts');
        }
      };

    } catch (connectionError) {
      console.error('Failed to create SSE connection:', connectionError);
      setError('Failed to connect');
    }
  }, [organizationId, eventCode, enabled]);

  /**
   * Disconnect from SSE
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Disconnecting SSE');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Manually refresh queue data
   */
  const refreshQueue = useCallback(async () => {
    if (!organizationId || !eventCode) return;

    try {
      const queryParams = eventCode === 'all'
        ? `organization_id=${organizationId}`
        : `event_code=${eventCode}&organization_id=${organizationId}`;

      const response = await fetch(`/api/karaoke/queue?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setQueueData(data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (fetchError: any) {
      console.error('Failed to refresh queue:', fetchError);
      setError(`Failed to refresh: ${fetchError.message}`);
    }
  }, [organizationId, eventCode]);

  // Connect on mount/change
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    queueData,
    isConnected,
    lastUpdate,
    error,
    refreshQueue,
    reconnect: connect,
    disconnect
  };
}

/**
 * Hook for admin real-time queue monitoring
 */
export function useAdminRealtimeQueue(
  organizationId: string | null,
  enabled: boolean = true
) {
  const [allQueues, setAllQueues] = useState<Record<string, QueueData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Get all active events for this organization
  const [activeEvents, setActiveEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!organizationId || !enabled) return;

    // Fetch active events
    const fetchActiveEvents = async () => {
      try {
        const response = await fetch(`/api/karaoke/admin/events?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setActiveEvents(data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch active events:', error);
      }
    };

    fetchActiveEvents();
  }, [organizationId, enabled]);

  // Set up connections for all active events
  useEffect(() => {
    if (!organizationId || !enabled || activeEvents.length === 0) return;

    const connections: Record<string, ReturnType<typeof useRealtimeKaraoke>> = {};

    // This would need to be implemented differently - we can't call hooks in loops
    // For now, this is a placeholder for the admin monitoring concept

    return () => {
      // Cleanup connections
      Object.values(connections).forEach(conn => conn.disconnect());
    };
  }, [organizationId, enabled, activeEvents]);

  return {
    allQueues,
    isConnected,
    lastUpdate,
    activeEvents
  };
}