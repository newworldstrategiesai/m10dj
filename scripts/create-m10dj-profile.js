#!/usr/bin/env node

/**
 * Create DJ Profile for M10 DJ Company
 * This script creates a DJ profile for M10 DJ Company to appear on DJ Dash
 * Usage: node scripts/create-m10dj-profile.js
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

async function createM10DJProfile() {
  try {
    console.log('🎵 Creating DJ Profile for M10 DJ Company...\n');

    // First, verify the organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug, is_platform_owner')
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
    console.log(`  Slug: ${org.slug}`);
    console.log(`  Platform Owner: ${org.is_platform_owner}\n`);

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('dj_profiles')
      .select('id, dj_name, dj_slug, is_published')
      .eq('organization_id', M10_DJ_COMPANY_ORG_ID)
      .single();

    if (existingProfile && !checkError) {
      console.log('ℹ️  DJ Profile already exists:');
      console.log(`  Name: ${existingProfile.dj_name}`);
      console.log(`  Slug: ${existingProfile.dj_slug}`);
      console.log(`  Published: ${existingProfile.is_published}`);
      console.log(`  URL: https://djdash.net/dj/${existingProfile.dj_slug}\n`);
      
      if (!existingProfile.is_published) {
        console.log('⚠️  Profile exists but is not published. Updating...');
        const { error: updateError } = await supabase
          .from('dj_profiles')
          .update({ is_published: true, is_featured: true })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error('❌ Error updating profile:', updateError.message);
          process.exit(1);
        }
        console.log('✓ Profile updated and published!\n');
      }
      return;
    }

    // Create the DJ profile
    const profileData = {
      organization_id: M10_DJ_COMPANY_ORG_ID,
      dj_name: 'M10 DJ Company',
      dj_slug: 'm10djcompany',
      tagline: 'Professional DJ Services in Memphis, TN | 5★ Rated | Trusted by Thousands',
      bio: 'M10 DJ Company is Memphis\' premier DJ service, specializing in weddings, corporate events, and private parties. With years of experience and thousands of satisfied clients, we bring professional sound, lighting, and entertainment to make your event unforgettable.',
      city: 'Memphis',
      state: 'TN',
      zip_code: '38103',
      service_radius_miles: 100,
      service_areas: ['Memphis', 'Nashville', 'Atlanta', 'Greater Memphis Area'],
      event_types: ['wedding', 'corporate', 'private_party', 'birthday', 'school_dance', 'festival', 'holiday_party'],
      starting_price_range: '$800-$2,500',
      price_range_min: 800,
      price_range_max: 2500,
      availability_status: 'available',
      availability_message: 'Available for bookings. Contact us for availability!',
      is_published: true,
      is_featured: true,
      social_links: {
        website: 'https://www.m10djcompany.com',
        facebook: 'https://www.facebook.com/m10djcompany',
        instagram: 'https://www.instagram.com/m10djcompany'
      }
    };

    console.log('Creating DJ profile with data:');
    console.log(`  Name: ${profileData.dj_name}`);
    console.log(`  Slug: ${profileData.dj_slug}`);
    console.log(`  City: ${profileData.city}, ${profileData.state}`);
    console.log(`  Event Types: ${profileData.event_types.join(', ')}\n`);

    const { data: profile, error: profileError } = await supabase
      .from('dj_profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating DJ profile:', profileError.message);
      console.error('Details:', profileError);
      process.exit(1);
    }

    console.log('✅ DJ Profile created successfully!');
    console.log(`  Profile ID: ${profile.id}`);
    console.log(`  Name: ${profile.dj_name}`);
    console.log(`  Slug: ${profile.dj_slug}`);
    console.log(`  Published: ${profile.is_published}`);
    console.log(`  Featured: ${profile.is_featured}`);
    console.log(`\n🌐 Profile URL: https://djdash.net/dj/${profile.dj_slug}`);
    console.log(`   Local URL: http://localhost:3001/djdash/dj/${profile.dj_slug}\n`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createM10DJProfile();

