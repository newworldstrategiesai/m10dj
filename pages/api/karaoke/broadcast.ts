/**
 * POST /api/karaoke/broadcast
 * Manually broadcast queue updates (for testing/admin use)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { broadcastQueueUpdate } from './realtime/[...params].js';
import { withSecurity } from '@/utils/rate-limiting';

async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    res.status(200).json({
      success: true,
      message: 'Update broadcasted'
    });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    res.status(500).json({
      error: 'Broadcast failed',
      message: error.message
    });
  }
}

export default withSecurity(handler, 'adminUpdate', { requireOrgId: true });