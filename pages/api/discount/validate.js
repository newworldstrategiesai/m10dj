import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, amount, packageId } = req.body;

    if (!code || !amount) {
      return res.status(400).json({ error: 'Code and amount are required' });
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Fetch discount code
    const { data: discountCode, error: fetchError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .single();

    if (fetchError || !discountCode) {
      return res.status(404).json({ 
        valid: false,
        error: 'Invalid discount code' 
      });
    }

    // Check if code is active
    if (!discountCode.active) {
      return res.status(400).json({ 
        valid: false,
        error: 'This discount code is no longer active' 
      });
    }

    // Check validity dates
    const now = new Date();
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return res.status(400).json({ 
        valid: false,
        error: 'This discount code is not yet valid' 
      });
    }

    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return res.status(400).json({ 
        valid: false,
        error: 'This discount code has expired' 
      });
    }

    // Check usage limit
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
      return res.status(400).json({ 
        valid: false,
        error: 'This discount code has reached its usage limit' 
      });
    }

    // Check minimum amount
    if (discountCode.minimum_amount && amount < discountCode.minimum_amount) {
      return res.status(400).json({ 
        valid: false,
        error: `This discount code requires a minimum purchase of $${discountCode.minimum_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
      });
    }

    // Check if code applies to this package
    if (discountCode.applicable_to && discountCode.applicable_to.length > 0) {
      const applicableToAll = discountCode.applicable_to.includes('all');
      const applicableToPackage = packageId && discountCode.applicable_to.includes(packageId);
      
      if (!applicableToAll && !applicableToPackage) {
        return res.status(400).json({ 
          valid: false,
          error: 'This discount code does not apply to the selected package' 
        });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (amount * discountCode.discount_value) / 100;
      
      // Apply maximum discount cap if set
      if (discountCode.maximum_discount && discountAmount > discountCode.maximum_discount) {
        discountAmount = discountCode.maximum_discount;
      }
    } else if (discountCode.discount_type === 'fixed') {
      discountAmount = discountCode.discount_value;
      
      // Don't allow discount to exceed the total amount
      if (discountAmount > amount) {
        discountAmount = amount;
      }
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    return res.status(200).json({
      valid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        description: discountCode.description,
        discountType: discountCode.discount_type,
        discountValue: discountCode.discount_value,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        originalAmount: parseFloat(amount.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    return res.status(500).json({ 
      valid: false,
      error: 'Internal server error' 
    });
  }
}

