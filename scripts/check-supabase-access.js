#!/usr/bin/env node

/**
 * Check Supabase Access Script
 * 
 * This script helps determine how to access Supabase:
 * 1. Check if local Supabase is running
 * 2. Check if remote Supabase credentials are available
 * 3. Test connection to both
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

console.log('🔍 Checking Supabase Access Options...\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Environment Variables:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}\n`);

// Check local Supabase status
console.log('🏠 Local Supabase Status:');
try {
  const status = execSync('npx supabase status --output json', { encoding: 'utf-8', stdio: 'pipe' });
  const statusData = JSON.parse(status);
  console.log('  ✅ Local Supabase is running');
  console.log(`  API URL: ${statusData.API.URL}`);
  console.log(`  DB URL: ${statusData.DB.URL}`);
  console.log(`  Studio URL: ${statusData.Studio.URL}\n`);
} catch (error) {
  console.log('  ❌ Local Supabase is not running\n');
}

// Test remote connection if credentials available
if (supabaseUrl && supabaseAnonKey) {
  console.log('🌐 Testing Remote Supabase Connection:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try a simple query
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`  ⚠️  Connection failed: ${error.message}`);
    } else {
      console.log('  ✅ Remote connection successful');
    }
  } catch (error) {
    console.log(`  ❌ Connection error: ${error.message}`);
  }
  console.log();
}

// Recommendations
console.log('💡 Recommendations:');
if (!supabaseUrl || !supabaseAnonKey) {
  console.log('  1. Set up environment variables (.env.local)');
  console.log('     - NEXT_PUBLIC_SUPABASE_URL');
  console.log('     - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('     - SUPABASE_SERVICE_ROLE_KEY (for admin operations)');
}

try {
  execSync('npx supabase status --output json', { encoding: 'utf-8', stdio: 'pipe' });
  console.log('  2. ✅ Local Supabase is available - use for development');
} catch (error) {
  console.log('  2. Start local Supabase: npm run supabase:start');
  console.log('  3. Or link to remote: npx supabase link --project-ref <your-project-ref>');
}

console.log('\n📝 Next Steps:');
console.log('  - For local development: npm run supabase:start');
console.log('  - For remote access: Ensure .env.local has Supabase credentials');
console.log('  - To check database schema: npx supabase db diff');

