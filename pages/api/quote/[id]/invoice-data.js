/**
 * GET /api/quote/[id]/invoice-data
 * Returns invoice for this quote/lead without requiring auth.
 * Used by the public quote invoice page (/quote/[id]/invoice).
 * Access is implied by knowing the lead_id (shareable link).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Quote/lead ID is required' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Try quote_selections.invoice_id for this lead_id
    const { data: qsList } = await supabaseAdmin
      .from('quote_selections')
      .select('invoice_id')
      .eq('lead_id', id)
      .not('invoice_id', 'is', null)
      .limit(1);

    let invoiceId = qsList?.[0]?.invoice_id;
    if (!invoiceId) {
      // 2) Fallback: invoice by contact_id (lead_id is often contact_id)
      const { data: invList } = await supabaseAdmin
        .from('invoices')
        .select('id')
        .eq('contact_id', id)
        .neq('invoice_status', 'Cancelled')
        .order('created_at', { ascending: false })
        .limit(1);
      invoiceId = invList?.[0]?.id;
    }
    if (!invoiceId) {
      // 3) Fallback: invoice from payment (payment.contact_id = id, payment.invoice_id set)
      const { data: paymentRows } = await supabaseAdmin
        .from('payments')
        .select('invoice_id')
        .eq('contact_id', id)
        .not('invoice_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      if (paymentRows?.[0]?.invoice_id) invoiceId = paymentRows[0].invoice_id;
    }

    if (!invoiceId) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.status(200).json(invoice);
  } catch (err) {
    console.error('Error in quote invoice-data:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
