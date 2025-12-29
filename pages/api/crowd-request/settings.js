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
          .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_fast_track_fee', 'crowd_request_minimum_amount', 'minimum_tip_amount', 'crowd_request_preset_amounts', 'crowd_request_bundle_discount_enabled', 'crowd_request_bundle_discount_percent'])
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
          .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_fast_track_fee', 'crowd_request_minimum_amount', 'minimum_tip_amount', 'crowd_request_preset_amounts', 'crowd_request_bundle_discount_enabled', 'crowd_request_bundle_discount_percent'])
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

    // Helper function to generate default preset amounts based on minimum
    const generateDefaultPresets = (minAmount) => {
      const min = parseInt(minAmount);
      // If minimum is $10 or more, use $10, $15, $20, $25
      if (min >= 1000) {
        return [min, min + 500, min + 1000, min + 1500]; // $10, $15, $20, $25
      }
      // Otherwise, use traditional presets: $5, $10, $20, $50
      return [500, 1000, 2000, 5000];
    };

    // If no settings found, return defaults
    if (settings.length === 0) {
      const defaultMinimum = 1000; // Default $10.00 (1000 cents)
      return res.status(200).json({
        cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray',
        venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray',
        fastTrackFee: 1000,
        minimumAmount: defaultMinimum,
        presetAmounts: generateDefaultPresets(defaultMinimum)
      });
    }

    // Parse settings
    const cashAppTag = settings.find(s => s.setting_key === 'crowd_request_cashapp_tag')?.setting_value || process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray';
    const venmoUsername = settings.find(s => s.setting_key === 'crowd_request_venmo_username')?.setting_value || process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray';
    const fastTrackFee = settings.find(s => s.setting_key === 'crowd_request_fast_track_fee')?.setting_value || '1000';
    // Check for minimum_tip_amount first (newer key), then fall back to crowd_request_minimum_amount (legacy), then default to $10.00
    const minimumAmountSetting = settings.find(s => s.setting_key === 'minimum_tip_amount')?.setting_value 
      || settings.find(s => s.setting_key === 'crowd_request_minimum_amount')?.setting_value 
      || '10.00';
    // Convert to cents (multiply by 100 if it's a decimal string like "10.00", otherwise assume it's already in cents)
    const minimumAmountStr = minimumAmountSetting.includes('.') 
      ? Math.round(parseFloat(minimumAmountSetting) * 100).toString()
      : minimumAmountSetting;
    const minimumAmount = parseInt(minimumAmountStr);
    
    const presetAmountsStr = settings.find(s => s.setting_key === 'crowd_request_preset_amounts')?.setting_value || null;
    const bundleDiscountEnabled = settings.find(s => s.setting_key === 'crowd_request_bundle_discount_enabled')?.setting_value || 'true';
    const bundleDiscountPercent = settings.find(s => s.setting_key === 'crowd_request_bundle_discount_percent')?.setting_value || '10';

    // If preset amounts are explicitly set, use them; otherwise generate defaults based on minimum
    let presetAmounts;
    if (presetAmountsStr) {
      try {
        presetAmounts = JSON.parse(presetAmountsStr);
        if (!Array.isArray(presetAmounts)) {
          presetAmounts = generateDefaultPresets(minimumAmountStr);
        }
      } catch (e) {
        console.error('Error parsing preset amounts:', e);
        presetAmounts = generateDefaultPresets(minimumAmountStr);
      }
    } else {
      // No preset amounts set, generate defaults based on minimum amount
      presetAmounts = generateDefaultPresets(minimumAmountStr);
    }

    return res.status(200).json({
      cashAppTag,
      venmoUsername,
      fastTrackFee: parseInt(fastTrackFee),
      minimumAmount: minimumAmount,
      presetAmounts,
      bundleDiscountEnabled: bundleDiscountEnabled === 'true',
      bundleDiscountPercent: parseInt(bundleDiscountPercent) || 10
    });
  } catch (error) {
    console.error('❌ Error fetching payment settings:', error);
    const defaultMinimum = 1000; // Default $10.00 (1000 cents)
    return res.status(200).json({
      cashAppTag: process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray',
      venmoUsername: process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray',
      fastTrackFee: 1000,
      minimumAmount: defaultMinimum,
      presetAmounts: generateDefaultPresets(defaultMinimum), // $10, $15, $20, $25
      bundleDiscountEnabled: true,
      bundleDiscountPercent: 10
    });
  }
}

