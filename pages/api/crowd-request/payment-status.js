/**
 * GET /api/crowd-request/payment-status?requestId=UUID
 *
 * Public API for kiosk: check if a request has been paid so the iPad can
 * show the success screen when the user completes payment on their phone.
 * No auth required; requestId is sufficient (or use code for pay flow).
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = (req.query?.requestId || '').trim();
  if (!requestId) {
    return res.status(400).json({ error: 'Missing requestId' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: row, error } = await supabase
    .from('crowd_requests')
    .select('id, payment_status')
    .eq('id', requestId)
    .single();

  if (error || !row) {
    return res.status(404).json({ error: 'Request not found', paid: false });
  }

  const paid = row.payment_status === 'paid';
  return res.status(200).json({ paid });
}
