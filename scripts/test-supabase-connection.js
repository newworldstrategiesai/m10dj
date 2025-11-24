#!/usr/bin/env node

/**
 * Test Supabase Connection
 * 
 * Tests connection to Supabase (local or remote) and checks
 * if we can access the database to verify migrations.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[match[1]] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔍 Testing Supabase Connection...\n');
console.log(`URL: ${supabaseUrl.substring(0, 30)}...`);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  try {
    // Test 1: Check if organizations table exists and has organization_id
    console.log('\n1️⃣ Checking organizations table...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, owner_id')
      .limit(5);
    
    if (orgError) {
      console.error('   ❌ Error:', orgError.message);
    } else {
      console.log(`   ✅ Found ${orgs?.length || 0} organizations`);
      if (orgs && orgs.length > 0) {
        console.log('   Sample:', orgs[0]);
      }
    }

    // Test 2: Check if critical tables have organization_id column
    console.log('\n2️⃣ Checking critical tables for organization_id...');
    const criticalTables = [
      'payments',
      'invoices', 
      'contracts',
      'contacts',
      'crowd_requests',
      'contact_submissions'
    ];

    for (const table of criticalTables) {
      try {
        // Try to query with organization_id filter
        const { error } = await supabase
          .from(table)
          .select('organization_id')
          .limit(1);
        
        if (error && error.code === '42703') {
          console.log(`   ❌ ${table}: Missing organization_id column`);
        } else if (error) {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Has organization_id column`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }

    // Test 3: Check RLS policies (skip - requires direct SQL access)
    console.log('\n3️⃣ RLS Status:');
    console.log('   ℹ️  RLS check requires direct database access');
    console.log('   💡 Use Supabase Dashboard > Database > Policies to verify');

    // Test 4: Count records by organization
    console.log('\n4️⃣ Checking data distribution...');
    const { data: orgCounts, error: countError } = await supabase
      .from('organizations')
      .select('id, name, slug');
    
    if (!countError && orgCounts) {
      for (const org of orgCounts.slice(0, 3)) {
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);
        
        console.log(`   ${org.name}: ${count || 0} contacts`);
      }
    }

    console.log('\n✅ Connection test complete!');
    console.log('\n📝 Next Steps:');
    console.log('   - Review the results above');
    console.log('   - Fix any missing organization_id columns');
    console.log('   - Update API routes to filter by organization_id');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();

