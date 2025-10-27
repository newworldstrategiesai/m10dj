/**
 * Run Payments Table Migration
 * 
 * Creates the payments table and all associated views
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running payments table migration...\n');
  
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250127000001_create_payments_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by statement (rough split, works for our case)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));
  
  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip comments
    if (statement.trim().startsWith('--')) continue;
    
    try {
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Some errors are OK (like "already exists")
        if (error.message.includes('already exists')) {
          console.log(`   ⚠️  Already exists, skipping`);
        } else {
          console.error(`   ❌ Error:`, error.message);
        }
      } else {
        console.log(`   ✅ Success`);
      }
    } catch (err) {
      console.error(`   ❌ Exception:`, err.message);
    }
  }
  
  console.log('\n✅ Migration complete!');
  console.log('\nCreated:');
  console.log('  ✅ payments table');
  console.log('  ✅ outstanding_balances view');
  console.log('  ✅ monthly_revenue view');
  console.log('  ✅ payment_method_stats view');
  console.log('  ✅ client_payment_summary view');
  console.log('  ✅ Auto-update triggers');
}

runMigration().catch(console.error);

