/**
 * Create DJ profiles for top Google search results
 * Usage: node scripts/create-dj-profiles-from-google.js
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

// Parse Google results data
const googleResults = [
  { name: 'DNA Entertainment', rating: 5.0, reviews: 15030, phone: '(901) 438-2843', city: 'Memphis', state: 'TN' },
  { name: 'Tiger City DJs', rating: 4.9, reviews: 4510, phone: '(901) 270-0449', city: 'Memphis', state: 'TN' },
  { name: 'DJ Zoom', rating: 5.0, reviews: 12815, phone: '(901) 230-7445', city: null, state: null },
  { name: 'Rockin Robin DJs', rating: 4.9, reviews: 597, phone: '(901) 937-5444', city: 'Lakeland', state: 'TN' },
  { name: 'DJ1LUV Entertainment', rating: 5.0, reviews: 1167, phone: '(901) 848-2758', city: null, state: null },
  { name: 'Perfection DJs', rating: 5.0, reviews: 135, phone: '(901) 861-7126', city: 'Collierville', state: 'TN' },
  { name: 'Memphis Wedding DJ Mark Anderson', rating: 5.0, reviews: 1335, phone: '(901) 338-4328', city: null, state: null },
  { name: 'Dingo Entertainment', rating: 5.0, reviews: 1910, phone: '(901) 337-4114', city: 'Memphis', state: 'TN' },
  { name: 'DJ A.D.', rating: 5.0, reviews: 9310, phone: '(901) 609-6004', city: null, state: null },
  { name: 'Funn Entertainment', rating: 5.0, reviews: 57, phone: '(901) 860-1171', city: 'Memphis', state: 'TN' },
  { name: "DJ Wes' Mobile DJ Service", rating: 4.6, reviews: 1010, phone: '(901) 486-4599', city: 'Olive Branch', state: 'MS' },
  { name: 'M10 DJ Company Memphis', rating: 4.8, reviews: 2615, phone: '(901) 410-2020', city: null, state: null },
  { name: 'DJ Ferg', rating: 5.0, reviews: 1333, phone: '(901) 335-5724', city: null, state: null },
  { name: 'DJ IceKold Entertainment', rating: 5.0, reviews: 23, phone: '(901) 659-4211', city: null, state: null },
  { name: 'DeepBlu Entertainment', rating: 5.0, reviews: 4, phone: '(901) 650-4945', city: null, state: null },
  { name: 'C&D Photo Booth Rental & DJ Service', rating: 4.5, reviews: 4, phone: '(901) 669-3816', city: 'Memphis', state: 'TN' },
  { name: 'Twenty91', rating: 5.0, reviews: 493, phone: '(901) 474-5757', city: null, state: null },
  { name: 'Celebrations Disc Jockey Service', rating: 5.0, reviews: 16, phone: '(901) 827-1124', city: 'Collierville', state: 'TN' },
  { name: 'DJ ACE20', rating: 5.0, reviews: 30, phone: null, city: 'Memphis', state: 'TN' },
  { name: 'Dj Kaliber', rating: 5.0, reviews: 363, phone: '(901) 644-2162', city: null, state: null },
];

// Generate slug from name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Generate price range based on rating and reviews
function generatePriceRange(rating, reviews) {
  if (rating >= 4.9 && reviews > 5000) {
    return { min: 1200, max: 3000, display: '$1,200-$3,000' };
  } else if (rating >= 4.8 && reviews > 1000) {
    return { min: 800, max: 2500, display: '$800-$2,500' };
  } else if (rating >= 4.5) {
    return { min: 600, max: 2000, display: '$600-$2,000' };
  } else {
    return { min: 400, max: 1500, display: '$400-$1,500' };
  }
}

async function createSystemUser() {
  // Check if system user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const systemUser = existingUsers?.users?.find(u => 
    u.email === 'system@djdash.net' || 
    u.user_metadata?.is_system_user === true
  );

  if (systemUser) {
    console.log('Using existing system user:', systemUser.id);
    return systemUser.id;
  }

  // Create a system user for demo purposes
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: 'system@djdash.net',
    password: Math.random().toString(36).slice(-16) + 'A1!', // Random secure password
    email_confirm: true,
    user_metadata: {
      full_name: 'DJ Dash System',
      is_system_user: true,
      product_context: 'djdash'
    }
  });

  if (error) {
    console.error('Error creating system user:', error);
    throw error;
  }

  console.log('Created system user:', newUser.user.id);
  return newUser.user.id;
}

async function createDJProfiles() {
  try {
    console.log('Creating DJ profiles from Google search results...\n');

    // Create or get system user
    const systemUserId = await createSystemUser();
    console.log('');

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const dj of googleResults) {
      try {
        const slug = generateSlug(dj.name);
        const priceRange = generatePriceRange(dj.rating, dj.reviews);
        const city = dj.city || 'Memphis';
        const state = dj.state || 'TN';

        // Create organization
        const orgSlug = slug;
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: dj.name,
            slug: orgSlug,
            owner_id: systemUserId,
            product_context: 'djdash',
            subscription_tier: 'professional',
            subscription_status: 'active',
            trial_ends_at: null
          })
          .select()
          .single();

        if (orgError) {
          // Organization might already exist, try to get it
          const { data: existingOrg } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', orgSlug)
            .eq('product_context', 'djdash')
            .single();

          if (existingOrg) {
            console.log(`✓ Organization already exists: ${dj.name}`);
            var organizationId = existingOrg.id;
          } else {
            throw orgError;
          }
        } else {
          console.log(`✓ Created organization: ${dj.name}`);
          var organizationId = org.id;
        }

        // Create DJ profile
        const { data: profile, error: profileError } = await supabase
          .from('dj_profiles')
          .insert({
            organization_id: organizationId,
            dj_name: dj.name,
            dj_slug: slug,
            tagline: `${dj.rating}★ Rated DJ with ${dj.reviews.toLocaleString()}+ Reviews`,
            bio: `Professional DJ services${city ? ` in ${city}, ${state}` : ''}. ${dj.rating}★ rated with ${dj.reviews.toLocaleString()}+ reviews. Available for weddings, corporate events, and private parties.`,
            city: city,
            state: state,
            service_radius_miles: 50,
            service_areas: city ? [city, 'Memphis', 'Greater Memphis Area'] : ['Memphis', 'Greater Memphis Area'],
            event_types: ['wedding', 'corporate', 'private_party', 'festival', 'school_dance'],
            starting_price_range: priceRange.display,
            price_range_min: priceRange.min,
            price_range_max: priceRange.max,
            availability_status: 'available',
            availability_message: 'Available for bookings',
            social_links: dj.phone ? { phone: dj.phone } : {},
            is_published: true,
            is_featured: dj.rating >= 4.9 && dj.reviews > 1000
          })
          .select()
          .single();

        if (profileError) {
          // Profile might already exist, try to update it
          const { data: existingProfile } = await supabase
            .from('dj_profiles')
            .select('*')
            .eq('dj_slug', slug)
            .single();

          if (existingProfile) {
            // Update existing profile
            const { data: updatedProfile, error: updateError } = await supabase
              .from('dj_profiles')
              .update({
                is_published: true,
                tagline: `${dj.rating}★ Rated DJ with ${dj.reviews.toLocaleString()}+ Reviews`,
                city: city,
                state: state,
                starting_price_range: priceRange.display,
                price_range_min: priceRange.min,
                price_range_max: priceRange.max
              })
              .eq('id', existingProfile.id)
              .select()
              .single();

            if (updateError) {
              throw updateError;
            }

            console.log(`  ✓ Updated DJ profile: ${dj.name}`);
            results.push({
              dj_name: dj.name,
              dj_slug: slug,
              organization_id: organizationId,
              status: 'updated'
            });
            successCount++;
          } else {
            throw profileError;
          }
        } else {
          console.log(`  ✓ Created DJ profile: ${dj.name} (${slug})`);
          results.push({
            dj_name: dj.name,
            dj_slug: slug,
            organization_id: organizationId,
            status: 'created'
          });
          successCount++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`  ✗ Error creating profile for ${dj.name}:`, error.message);
        errorCount++;
        results.push({
          dj_name: dj.name,
          error: error.message,
          status: 'failed'
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Total: ${googleResults.length}`);
    console.log('='.repeat(60));

    console.log('\nResults (JSON):');
    console.log(JSON.stringify(results, null, 2));

    return results;

  } catch (error) {
    console.error('Error creating DJ profiles:', error);
    throw error;
  }
}

// Run the script
createDJProfiles()
  .then(() => {
    console.log('\n✓ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Script failed:', error.message);
    process.exit(1);
  });

