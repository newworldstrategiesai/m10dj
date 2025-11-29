/**
 * Ensure Contract Exists for Quote
 * 
 * Lazy creation endpoint: Creates a draft contract if one doesn't exist
 * for the quote. Called when the contract page is first accessed.
 */

import { createClient } from '@supabase/supabase-js';
import { ensureContractExists } from '../../../../utils/ensure-contract-exists';

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

    // Ensure contract exists (will create if needed)
    const result = await ensureContractExists(id, supabase);

    if (!result.success) {
      return res.status(500).json({ 
        error: result.error || 'Failed to ensure contract exists',
        success: false
      });
    }

    // Return the contract (whether newly created or existing)
    return res.status(200).json({
      success: true,
      contract: result.contract,
      created: result.created || false,
      contract_id: result.contract_id
    });

  } catch (error) {
    console.error('Error in ensure-contract endpoint:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      success: false
    });
  }
}

