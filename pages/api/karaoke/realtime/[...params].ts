/**
 * Server-Sent Events (SSE) endpoint for real-time karaoke updates
 * Provides live queue updates to clients
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Store active connections by event/organization
const activeConnections = new Map<string, Set<NextApiResponse>>();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

interface SSEConnection {
  res: NextApiResponse;
  eventCode: string;
  organizationId: string;
  lastHeartbeat: number;
}

/**
 * Clean up dead connections
 */
function cleanupConnections() {
  const now = Date.now();

  for (const [key, connections] of Array.from(activeConnections.entries())) {
    const activeConnectionsSet = new Set<NextApiResponse>();

    for (const res of Array.from(connections)) {
      // Check if connection is still alive by checking last heartbeat
      const connection = (res as any).__karaokeConnection as SSEConnection;
      if (connection && (now - connection.lastHeartbeat) < HEARTBEAT_INTERVAL * 2) {
        activeConnectionsSet.add(res);
      } else {
        // Connection is dead, close it
        try {
          res.end();
        } catch (error: any) {
          // Connection already closed
        }
      }
    }

    if (activeConnectionsSet.size === 0) {
      activeConnections.delete(key);
    } else {
      activeConnections.set(key, activeConnectionsSet);
    }
  }
}

/**
 * Send update to all clients for an event
 */
export function broadcastQueueUpdate(eventCode: string, organizationId: string, data: any) {
  const key = `${organizationId}:${eventCode}`;
  const connections = activeConnections.get(key);

  if (!connections) return;

  const message = {
    type: 'queue_update',
    timestamp: new Date().toISOString(),
    data
  };

  for (const res of Array.from(connections)) {
    try {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error: any) {
      // Connection might be closed, will be cleaned up later
      console.log('Failed to send update to client:', error.message);
    }
  }
}

/**
 * Send heartbeat to keep connections alive
 */
function sendHeartbeat(res: NextApiResponse) {
  try {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    const connection = (res as any).__karaokeConnection as SSEConnection;
    if (connection) {
      connection.lastHeartbeat = Date.now();
    }
  } catch (error) {
    // Connection might be closed
  }
}

/**
 * Set up SSE headers
 */
function setupSSEHeaders(res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
}

/**
 * GET /api/karaoke/realtime/[organizationId]/[eventCode]
 * Server-Sent Events endpoint for real-time queue updates
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { params } = req.query;
  const [organizationId, eventCode] = params as string[];

  if (!organizationId || !eventCode) {
    return res.status(400).json({
      error: 'Missing parameters',
      required: ['organizationId', 'eventCode']
    });
  }

  // Validate organization access (basic check)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single();

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Set up SSE connection
  setupSSEHeaders(res);

  // Create connection tracking
  const connection: SSEConnection = {
    res,
    eventCode,
    organizationId,
    lastHeartbeat: Date.now()
  };

  (res as any).__karaokeConnection = connection;

  // Add to active connections
  const key = `${organizationId}:${eventCode}`;
  if (!activeConnections.has(key)) {
    activeConnections.set(key, new Set());
  }
  activeConnections.get(key)!.add(res);

  console.log(`SSE connection established: ${organizationId}:${eventCode} (${activeConnections.get(key)!.size} connections)`);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    message: 'Real-time updates active',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Set up heartbeat
  const heartbeatInterval = setInterval(() => {
    sendHeartbeat(res);
  }, HEARTBEAT_INTERVAL);

  // Clean up on connection close
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    const connections = activeConnections.get(key);
    if (connections) {
      connections.delete(res);
      if (connections.size === 0) {
        activeConnections.delete(key);
      }
    }
    console.log(`SSE connection closed: ${organizationId}:${eventCode}`);
  });

  // Periodic cleanup of dead connections
  const cleanupInterval = setInterval(cleanupConnections, HEARTBEAT_INTERVAL * 2);

  // Clean up cleanup interval when connection ends
  res.on('close', () => {
    clearInterval(cleanupInterval);
  });
}

/**
 * POST /api/karaoke/realtime/broadcast
 * Internal endpoint to broadcast queue updates (called by status update APIs)
 */
export async function broadcastUpdate(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventCode, organizationId, updateType, data } = req.body;

  if (!eventCode || !organizationId || !updateType) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['eventCode', 'organizationId', 'updateType']
    });
  }

  try {
    broadcastQueueUpdate(eventCode, organizationId, {
      updateType,
      ...data,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ success: true, connections: activeConnections.get(`${organizationId}:${eventCode}`)?.size || 0 });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Broadcast failed', message: error.message });
  }
}