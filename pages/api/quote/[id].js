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
    
    const { data: quoteRow, error } = await supabaseAdmin
      .from('quote_selections')
      .select('*')
      .eq('lead_id', id)
      .limit(1)
      .maybeSingle();

    if (!error && quoteRow) {
      const data = quoteRow;
      console.log('✅ Quote found:', { id: data?.id, lead_id: data?.lead_id, total_price: data?.total_price, package_name: data?.package_name });
      if (data.speaker_rental && typeof data.speaker_rental === 'string') {
        try {
          data.speaker_rental = JSON.parse(data.speaker_rental);
        } catch (e) {
          console.error('Error parsing speaker_rental:', e);
        }
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.status(200).json(data);
    }

    // No quote_selections row: fallback to invoice by contact_id or payment so /quote/[id]/invoice can load
    console.log('⚠️ No quote for lead_id:', id, '- checking invoice by contact_id or payment');
    let invoiceByContact = null;
    const { data: invList, error: invError } = await supabaseAdmin
      .from('invoices')
      .select('id, invoice_number, total_amount, invoice_title, contact_id')
      .eq('contact_id', id)
      .neq('invoice_status', 'Cancelled')
      .order('created_at', { ascending: false })
      .limit(1);
    if (!invError && invList && invList.length > 0) invoiceByContact = invList[0];
    if (!invoiceByContact) {
      const { data: paymentRows } = await supabaseAdmin
        .from('payments')
        .select('invoice_id')
        .eq('contact_id', id)
        .not('invoice_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      const paymentRow = paymentRows?.[0];
      if (paymentRow?.invoice_id) {
        const { data: invByPaymentList } = await supabaseAdmin
          .from('invoices')
          .select('id, invoice_number, total_amount, invoice_title, contact_id')
          .eq('id', paymentRow.invoice_id)
          .neq('invoice_status', 'Cancelled')
          .limit(1);
        if (invByPaymentList?.[0]) invoiceByContact = invByPaymentList[0];
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

    // Fallback: id may be contact_submissions id - resolve to contact by email, then look up quote
    // This handles links that use submission id instead of contact id
    console.log('⚠️ Trying to resolve id as contact_submissions...');
    const { data: submissionRow } = await supabaseAdmin
      .from('contact_submissions')
      .select('id, email')
      .eq('id', id)
      .maybeSingle();

    if (submissionRow?.email) {
      const { data: contactRow } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .ilike('email_address', submissionRow.email)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contactRow?.id) {
        console.log('✅ Resolved submission to contact:', contactRow.id, '- fetching quote');
        const { data: quoteByContact, error: qErr } = await supabaseAdmin
          .from('quote_selections')
          .select('*')
          .eq('lead_id', contactRow.id)
          .limit(1)
          .maybeSingle();

        if (!qErr && quoteByContact) {
          const data = quoteByContact;
          if (data.speaker_rental && typeof data.speaker_rental === 'string') {
            try {
              data.speaker_rental = JSON.parse(data.speaker_rental);
            } catch (e) {
              console.error('Error parsing speaker_rental:', e);
            }
          }
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.status(200).json(data);
        }

        // Try invoice fallback with contact id
        const { data: invByContactList } = await supabaseAdmin
          .from('invoices')
          .select('id, invoice_number, total_amount, invoice_title, contact_id')
          .eq('contact_id', contactRow.id)
          .neq('invoice_status', 'Cancelled')
          .order('created_at', { ascending: false })
          .limit(1);
        const invByContact = invByContactList?.[0];
        if (invByContact) {
          const syntheticQuote = {
            id: null,
            lead_id: contactRow.id,
            invoice_id: invByContact.id,
            package_id: 'package_2',
            package_name: invByContact.invoice_title || 'Package',
            package_price: parseFloat(invByContact.total_amount) || 0,
            total_price: parseFloat(invByContact.total_amount) || 0,
            addons: [],
            status: 'invoiced',
            payment_status: 'partial',
            payment_intent_id: null,
            deposit_amount: null,
            paid_at: null,
            contract_id: null,
            invoice_number: invByContact.invoice_number,
          };
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          return res.status(200).json(syntheticQuote);
        }
      }
    }

    if (error) {
      console.error('❌ Error fetching quote:', error);
      return res.status(500).json({ error: 'Quote lookup failed', details: error.message });
    }
    return res.status(404).json({ error: 'Quote not found' });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

