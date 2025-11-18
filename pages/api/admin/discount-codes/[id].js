import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Admin auth is handled by service role key - this endpoint requires service role
  // In production, you should add proper admin authentication here

  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const updateData = {};

      // If only updating active status
      if (req.body.active !== undefined && Object.keys(req.body).length === 1) {
        updateData.active = req.body.active;
        updateData.updated_at = new Date().toISOString();
      } else {
        // Full update
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

        if (code) updateData.code = code.toUpperCase().trim();
        if (description !== undefined) updateData.description = description || null;
        if (discount_type) updateData.discount_type = discount_type;
        if (discount_value !== undefined) updateData.discount_value = parseFloat(discount_value);
        if (minimum_amount !== undefined) updateData.minimum_amount = minimum_amount ? parseFloat(minimum_amount) : 0;
        if (maximum_discount !== undefined) updateData.maximum_discount = maximum_discount ? parseFloat(maximum_discount) : null;
        if (usage_limit !== undefined) updateData.usage_limit = usage_limit ? parseInt(usage_limit) : null;
        if (valid_from !== undefined) updateData.valid_from = valid_from || new Date().toISOString();
        if (valid_until !== undefined) updateData.valid_until = valid_until || null;
        if (active !== undefined) updateData.active = active;
        if (applicable_to !== undefined) updateData.applicable_to = applicable_to || [];
        
        updateData.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('discount_codes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating discount code:', error);
        return res.status(500).json({ error: 'Failed to update discount code', details: error.message });
      }

      return res.status(200).json({ code: data });
    } catch (error) {
      console.error('Error in PUT discount codes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting discount code:', error);
        return res.status(500).json({ error: 'Failed to delete discount code' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error in DELETE discount codes:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

