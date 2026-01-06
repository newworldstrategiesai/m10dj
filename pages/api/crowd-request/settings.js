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
        .select('id, slug, owner_id, requests_minimum_amount, requests_preset_amounts, requests_amounts_sort_order, requests_cashapp_tag, requests_venmo_username, requests_fast_track_fee, requests_next_fee')
        .eq('id', organizationId)
        .single();
      organization = org;
    } else if (organizationSlug) {
      // Organization slug provided (from URL)
      const { data: org } = await supabase
        .from('organizations')
        .select('id, slug, owner_id, requests_minimum_amount, requests_preset_amounts, requests_amounts_sort_order, requests_cashapp_tag, requests_venmo_username, requests_fast_track_fee, requests_next_fee')
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
        .select('id, slug, owner_id, requests_minimum_amount, requests_preset_amounts, requests_amounts_sort_order, requests_cashapp_tag, requests_venmo_username, requests_fast_track_fee, requests_next_fee')
        .limit(1)
        .single();
      organization = defaultOrg;
    }
    
    // Determine if this is M10 DJ Company (the only org that should use Ben's personal payment info as default)
    const isM10Organization = organization?.slug === 'm10djcompany';
    
    // Check if organization has its own payment settings
    if (organization && (organization.requests_minimum_amount || organization.requests_preset_amounts)) {
      const orgMinimum = organization.requests_minimum_amount || 1000;
      let orgPresets = organization.requests_preset_amounts || [1000, 1500, 2000, 2500];
      const sortOrder = organization.requests_amounts_sort_order || 'desc';
      
      // Sort presets according to preference
      if (Array.isArray(orgPresets)) {
        orgPresets = [...orgPresets].sort((a, b) => sortOrder === 'desc' ? b - a : a - b);
      }
      
      // Still need to get payment method settings (CashApp, Venmo) from admin_settings
      let paymentMethodSettings = {};
      if (organization.owner_id) {
        const { data: methodSettings } = await supabase
          .from('admin_settings')
          .select('setting_key, setting_value')
          .eq('user_id', organization.owner_id)
          .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_venmo_phone_number', 'crowd_request_fast_track_fee', 'crowd_request_next_fee', 'crowd_request_bundle_discount_enabled', 'crowd_request_bundle_discount_percent']);
        
        if (methodSettings) {
          methodSettings.forEach(s => {
            paymentMethodSettings[s.setting_key] = s.setting_value;
          });
        }
      }
      
      // For payment usernames: use organization-specific values first, then admin_settings, then only M10 gets personal defaults
      const cashAppTag = organization.requests_cashapp_tag 
        || paymentMethodSettings['crowd_request_cashapp_tag'] 
        || (isM10Organization ? (process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray') : null);
      const venmoUsername = organization.requests_venmo_username 
        || paymentMethodSettings['crowd_request_venmo_username'] 
        || (isM10Organization ? (process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray') : null);
      
      // For fees: use organization-specific values first, then admin_settings, then defaults
      const fastTrackFee = organization.requests_fast_track_fee 
        || parseInt(paymentMethodSettings['crowd_request_fast_track_fee']) 
        || 1000;
      const nextFee = organization.requests_next_fee 
        || parseInt(paymentMethodSettings['crowd_request_next_fee']) 
        || 2000;
      
      return res.status(200).json({
        cashAppTag,
        venmoUsername,
        venmoPhoneNumber: paymentMethodSettings['crowd_request_venmo_phone_number'] || process.env.VENMO_PHONE_NUMBER || null,
        fastTrackFee,
        nextFee,
        minimumAmount: orgMinimum,
        presetAmounts: orgPresets,
        bundleDiscountEnabled: paymentMethodSettings['crowd_request_bundle_discount_enabled'] === 'true' || paymentMethodSettings['crowd_request_bundle_discount_enabled'] === undefined,
        bundleDiscountPercent: parseInt(paymentMethodSettings['crowd_request_bundle_discount_percent']) || 10
      });
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
          .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_venmo_phone_number', 'crowd_request_fast_track_fee', 'crowd_request_next_fee', 'crowd_request_minimum_amount', 'minimum_tip_amount', 'crowd_request_preset_amounts', 'crowd_request_bundle_discount_enabled', 'crowd_request_bundle_discount_percent'])
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
          .in('setting_key', ['crowd_request_cashapp_tag', 'crowd_request_venmo_username', 'crowd_request_venmo_phone_number', 'crowd_request_fast_track_fee', 'crowd_request_next_fee', 'crowd_request_minimum_amount', 'minimum_tip_amount', 'crowd_request_preset_amounts', 'crowd_request_bundle_discount_enabled', 'crowd_request_bundle_discount_percent'])
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
      // Only M10 DJ Company gets personal payment defaults; other orgs get null (must configure their own)
      const fastTrackFee = organization?.requests_fast_track_fee || 1000;
      const nextFee = organization?.requests_next_fee || 2000;
      return res.status(200).json({
        cashAppTag: organization?.requests_cashapp_tag || (isM10Organization ? (process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray') : null),
        venmoUsername: organization?.requests_venmo_username || (isM10Organization ? (process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray') : null),
        venmoPhoneNumber: process.env.VENMO_PHONE_NUMBER || null, // Include phone number for Venmo deep links
        fastTrackFee,
        nextFee,
        minimumAmount: defaultMinimum,
        presetAmounts: generateDefaultPresets(defaultMinimum)
      });
    }

    // Parse settings - use organization-specific values first, then admin_settings, then only M10 gets personal defaults
    const cashAppTag = organization?.requests_cashapp_tag 
      || settings.find(s => s.setting_key === 'crowd_request_cashapp_tag')?.setting_value 
      || (isM10Organization ? (process.env.NEXT_PUBLIC_CASHAPP_TAG || '$DJbenmurray') : null);
    const venmoUsername = organization?.requests_venmo_username 
      || settings.find(s => s.setting_key === 'crowd_request_venmo_username')?.setting_value 
      || (isM10Organization ? (process.env.NEXT_PUBLIC_VENMO_USERNAME || '@djbenmurray') : null);
    const venmoPhoneNumber = settings.find(s => s.setting_key === 'crowd_request_venmo_phone_number')?.setting_value || process.env.VENMO_PHONE_NUMBER || null;
    
    // For fees: use organization-specific values first, then admin_settings, then defaults
    const fastTrackFee = organization?.requests_fast_track_fee 
      || parseInt(settings.find(s => s.setting_key === 'crowd_request_fast_track_fee')?.setting_value || '1000');
    const nextFee = organization?.requests_next_fee 
      || parseInt(settings.find(s => s.setting_key === 'crowd_request_next_fee')?.setting_value || '2000');
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
      venmoPhoneNumber, // Include phone number for Venmo deep links
      fastTrackFee,
      nextFee,
      minimumAmount: minimumAmount,
      presetAmounts,
      bundleDiscountEnabled: bundleDiscountEnabled === 'true',
      bundleDiscountPercent: parseInt(bundleDiscountPercent) || 10
    });
  } catch (error) {
    console.error('❌ Error fetching payment settings:', error);
    const defaultMinimum = 1000; // Default $10.00 (1000 cents)
    // On error, return null for payment usernames - don't expose personal defaults
    return res.status(200).json({
      cashAppTag: null,
      venmoUsername: null,
      venmoPhoneNumber: null,
      fastTrackFee: 1000,
      nextFee: 2000,
      minimumAmount: defaultMinimum,
      presetAmounts: [1000, 1500, 2000, 2500], // $10, $15, $20, $25
      bundleDiscountEnabled: true,
      bundleDiscountPercent: 10
    });
  }
}

