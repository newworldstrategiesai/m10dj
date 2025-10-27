/**
 * Setup Payments Table
 * Creates the payments table if it doesn't exist
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('🚀 Creating payments table...\n');
  
  // Check if table exists
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .limit(1);
  
  if (existing !== null) {
    console.log('✅ Payments table already exists!');
    return;
  }
  
  console.log('⚠️  Payments table does not exist.');
  console.log('\n📋 MANUAL SETUP REQUIRED:\n');
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/YOUR_PROJECT/sql\n');
  console.log('Copy and paste the entire contents of:');
  console.log('supabase/migrations/20250127000001_create_payments_table.sql\n');
  console.log('Then run this script again.');
}

createTable().catch(console.error);

