#!/usr/bin/env node

/**
 * Backfill Contacts Organization ID
 * 
 * Assigns orphaned contacts to the platform admin's organization
 * This is a one-time migration script.
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
const adminUserId = process.env.DEFAULT_ADMIN_USER_ID;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillContacts() {
  console.log('🔄 Backfilling Contacts Organization ID\n');

  // Get platform admin's organization
  let adminOrgId = null;
  
  if (adminUserId) {
    const { data: adminOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('owner_id', adminUserId)
      .single();
    
    if (adminOrg) {
      adminOrgId = adminOrg.id;
      console.log(`✅ Found admin organization: ${adminOrg.name} (${adminOrgId})`);
    }
  }

  // Fallback: Get first organization
  if (!adminOrgId) {
    const { data: firstOrg } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)
      .single();
    
    if (firstOrg) {
      adminOrgId = firstOrg.id;
      console.log(`⚠️  Using first organization as fallback: ${firstOrg.name} (${adminOrgId})`);
    }
  }

  if (!adminOrgId) {
    console.error('❌ No organization found. Cannot backfill contacts.');
    process.exit(1);
  }

  // Get orphaned contacts
  const { data: orphanedContacts, error: fetchError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email_address, created_at')
    .is('organization_id', null)
    .is('deleted_at', null);

  if (fetchError) {
    console.error('❌ Error fetching orphaned contacts:', fetchError);
    process.exit(1);
  }

  if (!orphanedContacts || orphanedContacts.length === 0) {
    console.log('✅ No orphaned contacts found. All contacts have organization_id.');
    return;
  }

  console.log(`\n📊 Found ${orphanedContacts.length} orphaned contacts`);
  console.log(`   Will assign to organization: ${adminOrgId}\n`);

  // Update in batches
  const batchSize = 100;
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < orphanedContacts.length; i += batchSize) {
    const batch = orphanedContacts.slice(i, i + batchSize);
    const ids = batch.map(c => c.id);

    const { error: updateError } = await supabase
      .from('contacts')
      .update({ organization_id: adminOrgId })
      .in('id', ids);

    if (updateError) {
      console.error(`❌ Error updating batch ${Math.floor(i / batchSize) + 1}:`, updateError);
      errors += batch.length;
    } else {
      updated += batch.length;
      console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1}: ${updated}/${orphanedContacts.length} contacts`);
    }
  }

  console.log(`\n📊 Backfill Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📝 Total: ${orphanedContacts.length}`);

  if (updated === orphanedContacts.length) {
    console.log('\n🎉 All contacts backfilled successfully!');
  }
}

backfillContacts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Backfill error:', error);
    process.exit(1);
  });

