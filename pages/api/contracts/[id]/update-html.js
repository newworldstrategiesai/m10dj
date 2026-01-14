import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require admin authentication
    await requireAdmin(req, res);
    
    const { id } = req.query;
    const { contract_html } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Contract ID is required' });
    }

    if (!contract_html || typeof contract_html !== 'string') {
      return res.status(400).json({ error: 'contract_html is required and must be a string' });
    }

    // Use service role for admin updates
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Update contract HTML
    // IMPORTANT: We preserve signatures by not overwriting signature_data fields
    const { data, error } = await supabase
      .from('contracts')
      .update({
        contract_html: contract_html,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contract HTML:', error);
      return res.status(500).json({ error: 'Failed to update contract HTML', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.status(200).json({ contract: data });
  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    console.error('Error in update-html handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
