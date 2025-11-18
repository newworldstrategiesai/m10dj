/**
 * Script to create a 100% off test discount code
 * Run with: node scripts/create-test-discount-code.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestDiscountCode() {
  try {
    console.log('🎟️  Creating 100% off test discount code...\n');

    // Check if code already exists
    const { data: existing } = await supabase
      .from('discount_codes')
      .select('id, code')
      .eq('code', 'TEST100')
      .single();

    if (existing) {
      console.log('✅ Discount code TEST100 already exists!');
      console.log(`   Code ID: ${existing.id}`);
      return existing;
    }

    // Create the 100% off code
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: 'TEST100',
        description: '100% Off - Test Code for Buyer Simulation',
        discount_type: 'percentage',
        discount_value: 100,
        minimum_amount: 0,
        maximum_discount: null, // No cap for 100% off
        usage_limit: null, // Unlimited uses for testing
        valid_from: new Date().toISOString(),
        valid_until: null, // No expiration
        active: true,
        applicable_to: ['all'] // Applies to all packages
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating discount code:', error);
      throw error;
    }

    console.log('✅ Successfully created 100% off discount code!');
    console.log(`   Code: ${data.code}`);
    console.log(`   Description: ${data.description}`);
    console.log(`   Discount: ${data.discount_value}% off`);
    console.log(`   ID: ${data.id}\n`);
    console.log('🎯 You can now use code "TEST100" for buyer simulations!\n');

    return data;
  } catch (error) {
    console.error('❌ Failed to create discount code:', error);
    process.exit(1);
  }
}

// Run the script
createTestDiscountCode()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

