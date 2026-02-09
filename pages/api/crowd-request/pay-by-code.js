/**
 * GET /api/crowd-request/pay-by-code?code=PAYMENT_CODE
 *
 * Public API for the "pay on phone" flow (kiosk mode). Returns the main
 * request for a given payment_code so the pay page can show amount and
 * complete payment. No auth required; payment_code is the secret.
 *
 * Used by: /[slug]/requests/pay?code=XXX
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = (req.query?.code || '').trim();
  if (!code) {
    return res.status(400).json({ error: 'Missing payment code' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Main request = first by created_at for this payment_code (pending/new)
  const { data: requests, error } = await supabase
    .from('crowd_requests')
    .select(`
      id,
      amount_requested,
      payment_code,
      request_type,
      song_title,
      song_artist,
      recipient_name,
      recipient_message,
      requester_name,
      organization_id,
      organizations!inner(slug)
    `)
    .eq('payment_code', code)
    .eq('payment_status', 'pending')
    .eq('status', 'new')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('[pay-by-code] Lookup error:', error);
    return res.status(500).json({ error: 'Failed to look up request' });
  }

  const main = requests?.[0];
  if (!main) {
    return res.status(404).json({ error: 'Request not found or already paid' });
  }

  const org = main.organizations;
  const slug = org?.slug || null;

  return res.status(200).json({
    requestId: main.id,
    amount: main.amount_requested ?? 0,
    paymentCode: main.payment_code,
    requestType: main.request_type,
    songTitle: main.song_title ?? null,
    songArtist: main.song_artist ?? null,
    recipientName: main.recipient_name ?? null,
    recipientMessage: main.recipient_message ?? null,
    requesterName: main.requester_name ?? null,
    organizationId: main.organization_id ?? null,
    organizationSlug: slug,
  });
}
