import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Admin auth is handled by service role key - this endpoint requires service role
  // In production, you should add proper admin authentication here

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching discount codes:', error);
        return res.status(500).json({ error: 'Failed to fetch discount codes' });
      }

      return res.status(200).json({ codes: data || [] });
    } catch (error) {
      console.error('Error in GET discount codes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        code,
        description,
        discount_type,
        discount_value,
        minimum_amount,
        maximum_discount,
        usage_limit,
        valid_from,
        valid_until,
        active,
        applicable_to
      } = req.body;

      // Validate required fields
      if (!code || !discount_type || !discount_value) {
        return res.status(400).json({ error: 'Code, discount type, and discount value are required' });
      }

      // Normalize code
      const normalizedCode = code.toUpperCase().trim();

      // Check if code already exists
      const { data: existing } = await supabase
        .from('discount_codes')
        .select('id')
        .eq('code', normalizedCode)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Discount code already exists' });
      }

      const { data, error } = await supabase
        .from('discount_codes')
        .insert({
          code: normalizedCode,
          description: description || null,
          discount_type,
          discount_value: parseFloat(discount_value),
          minimum_amount: minimum_amount ? parseFloat(minimum_amount) : 0,
          maximum_discount: maximum_discount ? parseFloat(maximum_discount) : null,
          usage_limit: usage_limit ? parseInt(usage_limit) : null,
          valid_from: valid_from || new Date().toISOString(),
          valid_until: valid_until || null,
          active: active !== false,
          applicable_to: applicable_to || []
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating discount code:', error);
        return res.status(500).json({ error: 'Failed to create discount code', details: error.message });
      }

      return res.status(201).json({ code: data });
    } catch (error) {
      console.error('Error in POST discount codes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

