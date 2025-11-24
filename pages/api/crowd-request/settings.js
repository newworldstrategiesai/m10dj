// Public API endpoint to get crowd request payment settings
// Now organization-scoped for multi-tenant support
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get organization from query param (for public requests) or from authenticated user
    const { organizationId, organizationSlug } = req.query;
    let organization = null;

    if (organizationId) {
      // Direct organization ID provided
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('id', organizationId)
        .single();
      organization = org;
    } else if (organizationSlug) {
      // Organization slug provided (from URL)
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', organizationSlug)
        .single();
      organization = org;
    }

    // If no organization found, fall back to default behavior for backward compatibility
    // This allows existing public requests to still work during migration
    if (!organization) {
      // Try to get default organization (first one) for backward compatibility
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      organization = defaultOrg;
    }

    let settings = [];

    if (organization) {
      // Get settings for this organization
      // Note: admin_settings table will need organization_id column added
      // For now, we'll use the existing user-based approach but filter by organization owner
      const { data: orgData } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', organization.id)
        .single();

      if (orgData) {
        const { data: allSettings, error: settingsError } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value, updated_at, user_id')
          .eq('user_id', orgData.owner_id) // Get settings for organization owner
          .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_fast_track_fee', 'crowd_request_minimum_amount', 'crowd_request_preset_amounts', 'crowd_request_bundle_discount_enabled', 'crowd_request_bundle_discount_percent'])
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
    } else {
      // Fallback: Get all admin user IDs (backward compatibility)
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (!adminError && adminUsers && adminUsers.length > 0) {
        const adminUserIds = adminUsers.map(au => au.user_id);
        
        const { data: allSettings, error: settingsError } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value, updated_at, user_id')
          .in('user_id', adminUserIds)
          .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_fast_track_fee', 'crowd_request_minimum_amount', 'crowd_request_preset_amounts', 'crowd_request_bundle_discount_enabled', 'crowd_request_bundle_discount_percent'])
          .order('updated_at', { ascending: false });

        if (!settingsError && allSettings && allSettings.length > 0) {
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
    const bundleDiscountEnabled = settings.find(s => s.setting_key === 'crowd_request_bundle_discount_enabled')?.setting_value || 'true';
    const bundleDiscountPercent = settings.find(s => s.setting_key === 'crowd_request_bundle_discount_percent')?.setting_value || '10';

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
      presetAmounts,
      bundleDiscountEnabled: bundleDiscountEnabled === 'true',
      bundleDiscountPercent: parseInt(bundleDiscountPercent) || 10
    });
  } catch (error) {
    console.error('❌ Error fetching payment settings:', error);
    return res.status(200).json({
      cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray',
      venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray',
      fastTrackFee: 1000,
      minimumAmount: 100,
      presetAmounts: [500, 1000, 2000, 5000],
      bundleDiscountEnabled: true,
      bundleDiscountPercent: 10
    });
  }
}

