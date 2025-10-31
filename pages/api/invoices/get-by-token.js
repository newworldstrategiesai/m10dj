/**
 * Get Invoice by Payment Token
 * Public endpoint for payment page
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get invoice by payment token
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          email_address,
          phone
        )
      `)
      .eq('payment_token', token)
      .is('deleted_at', null)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice not found:', invoiceError);
      return res.status(404).json({ error: 'Invoice not found or link expired' });
    }

    // Check if token is expired (optional: add expiry logic)
    // For now, just check if invoice exists and isn't deleted

    // Don't send sensitive data
    const safeInvoice = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      total_amount: invoice.total_amount,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      status: invoice.status,
      due_date: invoice.due_date,
      issue_date: invoice.issue_date,
      line_items: invoice.line_items || [],
      notes: invoice.notes,
      contacts: invoice.contacts
    };

    res.status(200).json({
      success: true,
      invoice: safeInvoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({
      error: 'Failed to fetch invoice',
      message: error.message
    });
  }
}

