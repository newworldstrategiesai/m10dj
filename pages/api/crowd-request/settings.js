// Public API endpoint to get crowd request payment settings
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all admin user IDs
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('role', 'admin')
      .eq('is_active', true);

    let settings = [];

    if (!adminError && adminUsers && adminUsers.length > 0) {
      // Get settings from all admin users - we'll use the most recently updated one
      const adminUserIds = adminUsers.map(au => au.user_id);
      
      const { data: allSettings, error: settingsError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value, updated_at, user_id')
        .in('user_id', adminUserIds)
        .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_fast_track_fee', 'crowd_request_minimum_amount', 'crowd_request_preset_amounts'])
        .order('updated_at', { ascending: false });

      if (!settingsError && allSettings && allSettings.length > 0) {
        // Group by setting_key and take the most recently updated value for each
        const settingsMap = new Map();
        allSettings.forEach(setting => {
          const existing = settingsMap.get(setting.setting_key);
          if (!existing || new Date(setting.updated_at) > new Date(existing.updated_at)) {
            settingsMap.set(setting.setting_key, setting);
          }
        });
        settings = Array.from(settingsMap.values());
      }
    }

    // If no settings found, return defaults
    if (settings.length === 0) {
      return res.status(200).json({
        cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray',
        venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray',
        fastTrackFee: 1000,
        minimumAmount: 100,
        presetAmounts: [500, 1000, 2000, 5000]
      });
    }

    // Parse settings
    const cashAppTag = settings.find(s => s.setting_key === 'crowd_request_cashapp_tag')?.setting_value || process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray';
    const venmoUsername = settings.find(s => s.setting_key === 'crowd_request_venmo_username')?.setting_value || process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray';
    const fastTrackFee = settings.find(s => s.setting_key === 'crowd_request_fast_track_fee')?.setting_value || '1000';
    const minimumAmount = settings.find(s => s.setting_key === 'crowd_request_minimum_amount')?.setting_value || '100';
    const presetAmountsStr = settings.find(s => s.setting_key === 'crowd_request_preset_amounts')?.setting_value || '[500,1000,2000,5000]';

    let presetAmounts = [500, 1000, 2000, 5000];
    try {
      presetAmounts = JSON.parse(presetAmountsStr);
      if (!Array.isArray(presetAmounts)) {
        presetAmounts = [500, 1000, 2000, 5000];
      }
    } catch (e) {
      console.error('Error parsing preset amounts:', e);
    }

    return res.status(200).json({
      cashAppTag,
      venmoUsername,
      fastTrackFee: parseInt(fastTrackFee),
      minimumAmount: parseInt(minimumAmount),
      presetAmounts
    });
  } catch (error) {
    console.error('❌ Error fetching payment settings:', error);
    return res.status(200).json({
      cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray',
      venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray',
      fastTrackFee: 1000,
      minimumAmount: 100,
      presetAmounts: [500, 1000, 2000, 5000]
    });
  }
}

