/**
 * Script to update Twilio credentials in the database
 * Run with: node scripts/update-twilio-credentials.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateTwilioCredentials() {
  // Replace these with your actual Twilio credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_SID';
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN';

  console.log('Updating Twilio credentials...');
  console.log('Account SID:', twilioSid.substring(0, 10) + '...');
  console.log('Auth Token:', twilioAuthToken.substring(0, 10) + '...');

  // First, get the admin user ID
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    process.exit(1);
  }

  // Find admin user by email
  const adminEmail = 'djbenmurray@gmail.com';
  const adminUser = users?.users?.find(u => u.email === adminEmail);

  if (!adminUser) {
    console.error(`Admin user with email ${adminEmail} not found`);
    process.exit(1);
  }

  console.log(`Found admin user: ${adminUser.email} (${adminUser.id})`);

  // Test credentials with Twilio (skip if failing - still save to database)
  const twilio = require('twilio');
  const testClient = twilio(twilioSid.trim(), twilioAuthToken.trim());

  try {
    const account = await testClient.api.accounts(twilioSid.trim()).fetch();
    console.log('✅ Twilio credentials validated successfully!');
    console.log('   Account Name:', account.friendlyName);
    console.log('   Account Status:', account.status);
  } catch (error) {
    console.warn('⚠️  Twilio credentials test failed:', error.message);
    console.warn('   Error Code:', error.code);
    console.warn('   Saving credentials anyway - please verify they are correct in Twilio dashboard.');
    console.warn('   Make sure:');
    console.warn('   1. Account SID starts with "AC" and is 34 characters');
    console.warn('   2. Auth Token is 32 characters');
    console.warn('   3. No extra spaces or characters');
    console.warn('   4. Both belong to the same Twilio account');
  }

  // Upsert credentials using service role (bypasses RLS)
  const { data, error } = await supabase
    .from('api_keys')
    .upsert({
      user_id: adminUser.id,
      twilio_sid: twilioSid.trim(),
      twilio_auth_token: twilioAuthToken.trim(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error saving credentials:', error);
    console.error('   Error details:', JSON.stringify(error, null, 2));
    
    // Try alternative approach - delete and insert
    console.log('   Trying alternative approach (delete then insert)...');
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('user_id', adminUser.id);
    
    if (deleteError) {
      console.error('   Delete error:', deleteError);
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: adminUser.id,
        twilio_sid: twilioSid.trim(),
        twilio_auth_token: twilioAuthToken.trim(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert also failed:', insertError);
      console.error('   This might be an RLS policy issue. Check Supabase dashboard.');
      process.exit(1);
    }
    
    console.log('✅ Credentials saved using insert method');
    return;
  }

  console.log('✅ Twilio credentials saved successfully!');
  console.log('   Credentials are now stored in the database and will override environment variables.');
}

updateTwilioCredentials().catch(console.error);

