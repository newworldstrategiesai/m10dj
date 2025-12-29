import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // SECURITY: Require admin authentication for pricing management
  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Fetch wedding pricing config (default)
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('config_type', 'wedding')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching pricing config:', error);
        return res.status(500).json({ error: 'Failed to fetch pricing configuration', details: error.message });
      }

      // If no config exists, return default structure
      if (!data) {
        return res.status(200).json({
          config_type: 'wedding',
          package1_price: 2000,
          package1_a_la_carte_price: 2600,
          package2_price: 2500,
          package2_a_la_carte_price: 3400,
          package3_price: 3000,
          package3_a_la_carte_price: 3900,
          package1_breakdown: [],
          package2_breakdown: [],
          package3_breakdown: [],
          addons: []
        });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error in pricing GET API:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const pricingData = req.body;

      // Validate required fields
      if (!pricingData.config_type) {
        return res.status(400).json({ error: 'config_type is required' });
      }

      // Upsert the pricing configuration
      const { data, error } = await supabase
        .from('pricing_config')
        .upsert({
          config_type: pricingData.config_type || 'wedding',
          package1_price: parseFloat(pricingData.package1_price) || 2000,
          package1_a_la_carte_price: parseFloat(pricingData.package1_a_la_carte_price) || 2600,
          package2_price: parseFloat(pricingData.package2_price) || 2500,
          package2_a_la_carte_price: parseFloat(pricingData.package2_a_la_carte_price) || 3400,
          package3_price: parseFloat(pricingData.package3_price) || 3000,
          package3_a_la_carte_price: parseFloat(pricingData.package3_a_la_carte_price) || 3900,
          package1_breakdown: pricingData.package1_breakdown || [],
          package2_breakdown: pricingData.package2_breakdown || [],
          package3_breakdown: pricingData.package3_breakdown || [],
          addons: pricingData.addons || [],
        }, {
          onConflict: 'config_type'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving pricing config:', error);
        return res.status(500).json({ error: 'Failed to save pricing configuration', details: error.message });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error in pricing POST API:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

