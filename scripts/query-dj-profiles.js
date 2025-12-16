/**
 * Query published DJ profiles for DJ Dash
 * Usage: node scripts/query-dj-profiles.js
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryPublishedDJProfiles() {
  try {
    console.log('Querying published DJ profiles for DJ Dash...\n');

    // First, check if there are any DJ Dash organizations
    const { data: djdashOrgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, product_context')
      .eq('product_context', 'djdash');

    if (orgsError) {
      console.error('Error querying organizations:', orgsError);
    } else {
      console.log(`Found ${djdashOrgs?.length || 0} organization(s) with product_context = 'djdash'`);
      if (djdashOrgs && djdashOrgs.length > 0) {
        console.log('DJ Dash Organizations:', djdashOrgs.map(o => ({ id: o.id, name: o.name })));
      }
      console.log('');
    }

    // Check all DJ profiles (published and unpublished)
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('dj_profiles')
      .select('id, dj_name, dj_slug, organization_id, is_published, city, state, created_at')
      .order('created_at', { ascending: false });

    if (allProfilesError) {
      throw allProfilesError;
    }

    console.log(`Total DJ profiles in database: ${allProfiles?.length || 0}`);
    if (allProfiles && allProfiles.length > 0) {
      console.log(`Published profiles: ${allProfiles.filter(p => p.is_published).length}`);
      console.log(`Unpublished profiles: ${allProfiles.filter(p => !p.is_published).length}\n`);
    }

    // Query with join to organizations table to filter by product_context
    const { data: profiles, error } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        dj_slug,
        organization_id,
        is_published,
        city,
        state,
        created_at,
        organizations:organization_id (
          id,
          name,
          product_context
        )
      `)
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash');

    if (error) {
      // If the join syntax doesn't work, try a different approach
      console.log('Trying alternative query method...\n');
      
      // First get all published profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from('dj_profiles')
        .select('id, dj_name, dj_slug, organization_id, is_published, city, state, created_at')
        .eq('is_published', true);

      if (profilesError) {
        throw profilesError;
      }

      if (!allProfiles || allProfiles.length === 0) {
        console.log('No published DJ profiles found.\n');
        return [];
      }

      // Get organization IDs
      const orgIds = [...new Set(allProfiles.map(p => p.organization_id))];
      
      // Query organizations to filter by product_context
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, product_context')
        .in('id', orgIds)
        .eq('product_context', 'djdash');

      if (orgsError) {
        throw orgsError;
      }

      const djdashOrgIds = new Set(orgs.map(o => o.id));
      
      // Filter profiles to only those with DJ Dash organizations
      const profiles = allProfiles.filter(p => djdashOrgIds.has(p.organization_id));

      // Format output
      const result = profiles.map(profile => {
        const org = orgs.find(o => o.id === profile.organization_id);
        return {
          dj_name: profile.dj_name,
          dj_slug: profile.dj_slug,
          organization_id: profile.organization_id,
          organization_name: org?.name || 'Unknown',
          city: profile.city,
          state: profile.state,
          created_at: profile.created_at
        };
      });

      console.log(`Found ${result.length} published DJ profile(s) for DJ Dash:\n`);
      console.log(JSON.stringify(result, null, 2));
      
      return result;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No published DJ profiles found for DJ Dash.\n');
      return [];
    }

    // Format output
    const result = profiles.map(profile => ({
      dj_name: profile.dj_name,
      dj_slug: profile.dj_slug,
      organization_id: profile.organization_id,
      organization_name: profile.organizations?.name || 'Unknown',
      city: profile.city,
      state: profile.state,
      created_at: profile.created_at
    }));

    console.log(`Found ${result.length} published DJ profile(s) for DJ Dash:\n`);
    console.log(JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.error('Error querying DJ profiles:', error);
    throw error;
  }
}

// Run the query
queryPublishedDJProfiles()
  .then(() => {
    console.log('\nQuery completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nQuery failed:', error.message);
    process.exit(1);
  });

