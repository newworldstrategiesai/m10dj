const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get bidding dummy data settings for an organization
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: org, error } = await supabase
        .from('organizations')
        .select(`
          id,
          bidding_dummy_data_enabled,
          bidding_dummy_data_aggressiveness,
          bidding_dummy_data_max_bid_multiplier,
          bidding_dummy_data_frequency_multiplier,
          bidding_dummy_data_scale_with_real_activity
        `)
        .eq('id', organizationId)
        .single();

      if (error) {
        console.error('Error fetching bidding settings:', error);
        return res.status(500).json({ error: 'Failed to fetch settings' });
      }

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      return res.status(200).json({
        bidding_dummy_data_enabled: org.bidding_dummy_data_enabled ?? true,
        bidding_dummy_data_aggressiveness: org.bidding_dummy_data_aggressiveness ?? 'medium',
        bidding_dummy_data_max_bid_multiplier: parseFloat(org.bidding_dummy_data_max_bid_multiplier ?? 1.5),
        bidding_dummy_data_frequency_multiplier: parseFloat(org.bidding_dummy_data_frequency_multiplier ?? 1.0),
        bidding_dummy_data_scale_with_real_activity: org.bidding_dummy_data_scale_with_real_activity ?? true
      });
    } catch (error) {
      console.error('Error in bidding-settings API:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PUT') {
    // Update bidding dummy data settings for an organization
    // Requires authentication - check if user is admin/owner of organization
    const { organizationId, ...settings } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    // Validate settings
    const validAggressiveness = ['none', 'low', 'medium', 'high'];
    if (settings.bidding_dummy_data_aggressiveness && 
        !validAggressiveness.includes(settings.bidding_dummy_data_aggressiveness)) {
      return res.status(400).json({ error: 'Invalid aggressiveness value' });
    }

    if (settings.bidding_dummy_data_max_bid_multiplier !== undefined) {
      const multiplier = parseFloat(settings.bidding_dummy_data_max_bid_multiplier);
      if (isNaN(multiplier) || multiplier < 1.0 || multiplier > 5.0) {
        return res.status(400).json({ error: 'max_bid_multiplier must be between 1.0 and 5.0' });
      }
    }

    if (settings.bidding_dummy_data_frequency_multiplier !== undefined) {
      const multiplier = parseFloat(settings.bidding_dummy_data_frequency_multiplier);
      if (isNaN(multiplier) || multiplier < 0.1 || multiplier > 3.0) {
        return res.status(400).json({ error: 'frequency_multiplier must be between 0.1 and 3.0' });
      }
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // TODO: Add authentication check - verify user is admin/owner
      // For now, allow updates (should be secured in production)

      const updateData = {};
      if (settings.bidding_dummy_data_enabled !== undefined) {
        updateData.bidding_dummy_data_enabled = settings.bidding_dummy_data_enabled;
      }
      if (settings.bidding_dummy_data_aggressiveness !== undefined) {
        updateData.bidding_dummy_data_aggressiveness = settings.bidding_dummy_data_aggressiveness;
      }
      if (settings.bidding_dummy_data_max_bid_multiplier !== undefined) {
        updateData.bidding_dummy_data_max_bid_multiplier = settings.bidding_dummy_data_max_bid_multiplier;
      }
      if (settings.bidding_dummy_data_frequency_multiplier !== undefined) {
        updateData.bidding_dummy_data_frequency_multiplier = settings.bidding_dummy_data_frequency_multiplier;
      }
      if (settings.bidding_dummy_data_scale_with_real_activity !== undefined) {
        updateData.bidding_dummy_data_scale_with_real_activity = settings.bidding_dummy_data_scale_with_real_activity;
      }

      const { data, error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organizationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating bidding settings:', error);
        return res.status(500).json({ error: 'Failed to update settings' });
      }

      return res.status(200).json({
        success: true,
        settings: {
          bidding_dummy_data_enabled: data.bidding_dummy_data_enabled,
          bidding_dummy_data_aggressiveness: data.bidding_dummy_data_aggressiveness,
          bidding_dummy_data_max_bid_multiplier: parseFloat(data.bidding_dummy_data_max_bid_multiplier),
          bidding_dummy_data_frequency_multiplier: parseFloat(data.bidding_dummy_data_frequency_multiplier),
          bidding_dummy_data_scale_with_real_activity: data.bidding_dummy_data_scale_with_real_activity
        }
      });
    } catch (error) {
      console.error('Error in bidding-settings API:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

