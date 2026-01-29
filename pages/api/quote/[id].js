import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Quote ID is required' });
  }

  try {
    // Use service role for queries - allow public access since quote links are shared with clients
    // The quote ID itself acts as the authentication token
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Build query for quote selections
    console.log('🔍 Fetching quote for lead_id:', id);
    
    const { data, error } = await supabaseAdmin
      .from('quote_selections')
      .select('*')
      .eq('lead_id', id)
      .single();

    if (error) {
      // When no quote_selection exists, fallback: find invoice by contact_id so /quote/[id]/invoice can still load
      if (error.code === 'PGRST116') {
        console.log('⚠️ No quote found for lead_id:', id, '- checking for invoice by contact_id or payment');
        let invoiceByContact = null;
        const { data: invByContact, error: invError } = await supabaseAdmin
          .from('invoices')
          .select('id, invoice_number, total_amount, invoice_title, contact_id')
          .eq('contact_id', id)
          .neq('invoice_status', 'Cancelled')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!invError && invByContact) invoiceByContact = invByContact;
        if (!invoiceByContact) {
          const { data: paymentRow } = await supabaseAdmin
            .from('payments')
            .select('invoice_id')
            .eq('contact_id', id)
            .not('invoice_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (paymentRow?.invoice_id) {
            const { data: invByPayment } = await supabaseAdmin
              .from('invoices')
              .select('id, invoice_number, total_amount, invoice_title, contact_id')
              .eq('id', paymentRow.invoice_id)
              .neq('invoice_status', 'Cancelled')
              .maybeSingle();
            if (invByPayment) invoiceByContact = invByPayment;
          }
        }
        if (invoiceByContact) {
          const syntheticQuote = {
            id: null,
            lead_id: id,
            invoice_id: invoiceByContact.id,
            package_id: 'package_2',
            package_name: invoiceByContact.invoice_title || 'Package',
            package_price: parseFloat(invoiceByContact.total_amount) || 0,
            total_price: parseFloat(invoiceByContact.total_amount) || 0,
            addons: [],
            status: 'invoiced',
            payment_status: 'partial',
            payment_intent_id: null,
            deposit_amount: null,
            paid_at: null,
            contract_id: null,
            invoice_number: invoiceByContact.invoice_number,
          };
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.status(200).json(syntheticQuote);
        }
      }
      console.error('❌ Error fetching quote:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      return res.status(404).json({ error: 'Quote not found', details: error.message });
    }
    
    console.log('✅ Quote found:', {
      id: data?.id,
      lead_id: data?.lead_id,
      total_price: data?.total_price,
      package_name: data?.package_name
    });

    // Parse speaker_rental if it's a JSON string
    if (data.speaker_rental && typeof data.speaker_rental === 'string') {
      try {
        data.speaker_rental = JSON.parse(data.speaker_rental);
      } catch (e) {
        console.error('Error parsing speaker_rental:', e);
      }
    }

    // Set cache-control headers to prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    // Return quote data
    return res.status(200).json(data);
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

