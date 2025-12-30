#!/usr/bin/env node

/**
 * Update M10 DJ Company organization slug from 'm10dj' to 'm10djcompany'
 * This changes the URL from tipjar.live/m10dj to tipjar.live/m10djcompany
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length) {
        const value = values.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value;
        }
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const M10_DJ_COMPANY_ORG_ID = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

async function updateOrganizationSlug() {
  try {
    console.log('🔄 Updating M10 DJ Company organization slug from "m10dj" to "m10djcompany"...\n');

    // First, verify the organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('id', M10_DJ_COMPANY_ORG_ID)
      .single();

    if (orgError || !org) {
      console.error('❌ M10 DJ Company organization not found!');
      console.error('Organization ID:', M10_DJ_COMPANY_ORG_ID);
      console.error('Error:', orgError?.message);
      process.exit(1);
    }

    console.log('✓ Found M10 DJ Company organization:');
    console.log(`  Name: ${org.name}`);
    console.log(`  Current Slug: ${org.slug}\n`);

    if (org.slug === 'm10djcompany') {
      console.log('✅ Slug is already "m10djcompany". No update needed.\n');
      return;
    }

    // Update the slug
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({ slug: 'm10djcompany' })
      .eq('id', M10_DJ_COMPANY_ORG_ID)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating organization slug:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Organization slug updated successfully!');
    console.log(`  Old Slug: ${org.slug}`);
    console.log(`  New Slug: ${updatedOrg.slug}`);
    console.log(`\n🌐 New URL: https://tipjar.live/m10djcompany/requests`);
    console.log(`   Old URL (will redirect): https://tipjar.live/m10dj/requests\n`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

updateOrganizationSlug();

