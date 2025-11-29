/**
 * Ensure Invoice Exists for Quote
 * 
 * Lazy creation endpoint: Creates a draft invoice if one doesn't exist
 * for the quote. Called when the invoice page is first accessed.
 */

import { createClient } from '@supabase/supabase-js';
import { ensureInvoiceExists } from '../../../../utils/ensure-invoice-exists';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Quote ID is required' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ensure invoice exists (will create if needed)
    const result = await ensureInvoiceExists(id, supabase);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to ensure invoice exists',
        success: false
      });
    }

    // Return the invoice (whether newly created or existing)
    return res.status(200).json({
      success: true,
      invoice: result.invoice,
      created: result.created || false,
      invoice_id: result.invoice_id
    });

  } catch (error) {
    console.error('Error in ensure-invoice endpoint:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false
    });
  }
}

