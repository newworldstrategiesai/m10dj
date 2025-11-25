// API endpoint to get payment settings (Cash App, Venmo) for event payments
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch payment settings from the settings table
    const { data: settings, error } = await supabase
      .from('settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'crowd_request_cashapp_tag',
        'crowd_request_venmo_username'
      ]);

    if (error) {
      console.error('Error fetching payment settings:', error);
      // Return defaults if there's an error
      return res.status(200).json({
        cashAppTag: '$M10DJ',
        venmoUsername: '@djbenmurray'
      });
    }

    // Parse settings
    const cashAppTag = settings?.find(s => s.setting_key === 'crowd_request_cashapp_tag')?.setting_value || '$M10DJ';
    const venmoUsername = settings?.find(s => s.setting_key === 'crowd_request_venmo_username')?.setting_value || '@djbenmurray';

    res.status(200).json({
      cashAppTag,
      venmoUsername
    });
  } catch (error) {
    console.error('Error in payment settings API:', error);
    // Return defaults on error
    res.status(200).json({
      cashAppTag: '$M10DJ',
      venmoUsername: '@djbenmurray'
    });
  }
}

