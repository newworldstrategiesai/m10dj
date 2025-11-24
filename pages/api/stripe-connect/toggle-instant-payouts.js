// API endpoint to enable/disable instant payouts for an organization

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizationId, enabled, feePercentage } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    // Validate fee percentage if provided
    if (feePercentage !== undefined && (feePercentage < 0 || feePercentage > 10)) {
      return res.status(400).json({ error: 'Fee percentage must be between 0 and 10' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Build update object
    const updateData = {};
    if (enabled !== undefined) {
      updateData.instant_payout_enabled = enabled;
    }
    if (feePercentage !== undefined) {
      updateData.instant_payout_fee_percentage = feePercentage;
    }

    // Update organization
    const { data: organization, error: updateError } = await supabaseAdmin
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single();

    if (updateError || !organization) {
      console.error('Error updating organization:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update instant payout settings',
        details: updateError?.message 
      });
    }

    return res.status(200).json({
      success: true,
      organization: {
        id: organization.id,
        instant_payout_enabled: organization.instant_payout_enabled,
        instant_payout_fee_percentage: organization.instant_payout_fee_percentage,
      },
    });
  } catch (error) {
    console.error('Error in toggle-instant-payouts API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

