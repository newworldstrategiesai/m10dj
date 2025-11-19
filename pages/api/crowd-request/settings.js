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

    // Get admin user ID (first admin user)
    // You can customize this to get settings from a specific admin or use a global setting
    const { data: adminUsers, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(1);

    if (adminError || !adminUsers || adminUsers.length === 0) {
      // Return defaults if no admin found
      return res.status(200).json({
        cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$M10DJ',
        venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@M10DJ'
      });
    }

    const adminUserId = adminUsers[0].user_id;

    // Get payment settings from admin_settings
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .eq('user_id', adminUserId)
      .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_fast_track_fee', 'crowd_request_minimum_amount', 'crowd_request_preset_amounts']);

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      // Return defaults on error
      return res.status(200).json({
        cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$M10DJ',
        venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@M10DJ'
      });
    }

    // Parse settings
    const cashAppTag = settings.find(s => s.setting_key === 'crowd_request_cashapp_tag')?.setting_value || process.env.NEXT_PUBLIC_CASHAPP_TAG || '$M10DJ';
    const venmoUsername = settings.find(s => s.setting_key === 'crowd_request_venmo_username')?.setting_value || process.env.NEXT_PUBLIC_VENMO_USERNAME || '@M10DJ';
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
      cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$M10DJ',
      venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@M10DJ',
      fastTrackFee: 1000,
      minimumAmount: 100,
      presetAmounts: [500, 1000, 2000, 5000]
    });
  }
}

