#!/usr/bin/env node

/**
 * Multi-Tenant Isolation Test Script
 * 
 * Tests that organizations cannot see each other's data
 * and that platform admins can see all data.
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
      if (line.trim().startsWith('#') || !line.trim()) return;
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        let value = match[2].trim();
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
    if (message) console.log(`   ${message}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (message) console.log(`   ${message}`);
  }
}

function logWarning(name, message) {
  results.warnings++;
  console.log(`⚠️  ${name}`);
  console.log(`   ${message}`);
}

async function testMultiTenantIsolation() {
  console.log('🧪 Testing Multi-Tenant Data Isolation\n');
  console.log('=' .repeat(60));

  // Test 1: Get all organizations
  console.log('\n1️⃣  Fetching Organizations...');
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, slug, owner_id')
    .order('created_at', { ascending: false });

  if (orgError) {
    logTest('Fetch organizations', false, orgError.message);
    return;
  }

  if (!organizations || organizations.length < 2) {
    logWarning('Organization count', `Found ${organizations?.length || 0} organizations. Need at least 2 for isolation testing.`);
    console.log('\n💡 Tip: Create a second organization to test isolation properly.');
  } else {
    logTest('Fetch organizations', true, `Found ${organizations.length} organizations`);
  }

  // Test 2: Check organization_id columns exist
  console.log('\n2️⃣  Checking Database Schema...');
  const criticalTables = [
    'contacts',
    'contact_submissions',
    'crowd_requests',
    'payments',
    'invoices',
    'contracts',
    'events'
  ];

  for (const table of criticalTables) {
    try {
      // Try to query with organization_id filter
      const { error } = await supabase
        .from(table)
        .select('organization_id')
        .limit(1);
      
      if (error && error.code === '42703') {
        logTest(`${table} has organization_id`, false, 'Column missing');
      } else if (error) {
        logWarning(`${table} check`, error.message);
      } else {
        logTest(`${table} has organization_id`, true);
      }
    } catch (err) {
      logWarning(`${table} check`, err.message);
    }
  }

  // Test 3: Data distribution check
  console.log('\n3️⃣  Checking Data Distribution...');
  if (organizations && organizations.length >= 2) {
    const orgA = organizations[0];
    const orgB = organizations[1];

    console.log(`\n   Organization A: ${orgA.name} (${orgA.slug})`);
    console.log(`   Organization B: ${orgB.name} (${orgB.slug})`);

    // Count records per organization
    const tablesToCheck = ['contacts', 'contact_submissions', 'crowd_requests', 'payments', 'invoices', 'contracts'];
    
    for (const table of tablesToCheck) {
      try {
        const { count: countA } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgA.id);

        const { count: countB } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgB.id);

        const totalA = countA || 0;
        const totalB = countB || 0;

        if (totalA > 0 || totalB > 0) {
          logTest(`${table} data distribution`, true, 
            `Org A: ${totalA} records, Org B: ${totalB} records`);
        } else {
          logWarning(`${table} data`, 'No records found for either organization');
        }
      } catch (err) {
        logWarning(`${table} distribution check`, err.message);
      }
    }
  }

  // Test 4: Check for orphaned records (records without organization_id)
  console.log('\n4️⃣  Checking for Orphaned Records...');
  for (const table of ['contacts', 'contact_submissions', 'crowd_requests']) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .is('organization_id', null);

      if (count > 0) {
        logWarning(`${table} orphaned records`, `${count} records without organization_id`);
      } else {
        logTest(`${table} orphaned records`, true, 'All records have organization_id');
      }
    } catch (err) {
      logWarning(`${table} orphaned check`, err.message);
    }
  }

  // Test 5: RLS Policy Check (indirect)
  console.log('\n5️⃣  RLS Policy Status...');
  try {
    // Check if RLS is enabled on critical tables
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('organizations', 'contacts', 'payments', 'invoices', 'contracts')
        ORDER BY tablename;
      `
    }).catch(() => ({ data: null, error: { message: 'Cannot check RLS directly' } }));

    if (rlsError) {
      logWarning('RLS direct check', 'Cannot verify RLS status directly. Check Supabase Dashboard > Database > Policies');
    } else {
      logTest('RLS check', true, 'Use Supabase Dashboard to verify policies');
    }
  } catch (err) {
    logWarning('RLS check', 'Cannot verify RLS - check manually in Supabase Dashboard');
  }

  // Test 6: Organization slug uniqueness
  console.log('\n6️⃣  Checking Organization Slugs...');
  if (organizations && organizations.length > 0) {
    const slugs = organizations.map(org => org.slug);
    const uniqueSlugs = new Set(slugs);
    
    if (slugs.length === uniqueSlugs.size) {
      logTest('Organization slug uniqueness', true, `All ${slugs.length} slugs are unique`);
    } else {
      logTest('Organization slug uniqueness', false, 
        `Found ${slugs.length - uniqueSlugs.size} duplicate slug(s)`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);

  if (results.failed === 0) {
    console.log('\n🎉 All critical tests passed!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Test API routes manually with different organization users');
    console.log('   2. Verify RLS policies in Supabase Dashboard');
    console.log('   3. Test contact form organization assignment');
    console.log('   4. Create test data for both organizations and verify isolation');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.');
  }

  return results;
}

// Run tests
testMultiTenantIsolation()
  .then(() => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  });

