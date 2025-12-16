/**
 * Import Google Reviews for M10 DJ Company into DJ Dash profile
 * Usage: node scripts/import-google-reviews-to-dj-profile.js
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Reviews data
const googleReviews = [
  {
    reviewer_name: 'Vance D. Gamble',
    date: '2024-12-09', // a week ago from Dec 16
    review_text: 'Beyond the music, Ben was professional, easy to work with, and incredibly organized throughout the entire process. Communication was seamless...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Josh Hendry',
    date: '2024-11-16', // a month ago
    review_text: 'We booked M10 DJ Company for our event and they absolutely delivered. From the initial planning to the final track of the night, everything was smooth...',
    rating: 5,
    event_type: 'corporate'
  },
  {
    reviewer_name: 'adam osborne',
    date: '2024-11-16', // a month ago
    review_text: '⭐️⭐️⭐️⭐️⭐️ We had Ben Murray as the DJ for my son Piper\'s wedding this weekend, and he absolutely crushed it! From start to finish, Ben kept the energy high...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Robin Pledge',
    date: '2024-10-16', // 2 months ago
    review_text: 'Great communication, and the music was amazing! Definitely recommend M10!',
    rating: 5,
    event_type: 'private_party'
  },
  {
    reviewer_name: 'Rose Family',
    date: '2024-10-16', // 2 months ago
    review_text: 'DJ Ben Murray absolutely killed it this past Saturday night at Silky\'s!!!! His set was banger after banger, and the entire crowd was on their feet dancing...',
    rating: 5,
    event_type: 'private_party'
  },
  {
    reviewer_name: 'DANNY Cox',
    date: '2024-10-16', // 2 months ago
    review_text: 'Best dj in the city ! Definitely recommend booking !',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Quade Nowlin',
    date: '2024-06-16', // 6 months ago
    review_text: 'Ben was an excellent choice for my wedding. He played everything we asked and built a playlist based on those preferences. He had a better price...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Kim Murray',
    date: '2024-06-16', // 6 months ago
    review_text: 'M 10 DJ company did a great job with my daughter\'s wedding. They were very attentive with great attention to detail and they were very responsive...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Alexis Cameron',
    date: '2024-05-16', // 7 months ago
    review_text: 'Ben DJ\'d our wedding last weekend and I couldn\'t be more thankful. He was communicative, paid great attention to detail, and ensured everything went smoothly.',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'AK Warmus',
    date: '2022-12-16', // 2 years ago
    review_text: 'Would have another wedding just to have Ben DJ for us again',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'banner bros',
    date: '2021-12-16', // 3 years ago
    review_text: 'Ben from M10 recently DJ\'d a wedding for my brother... Ben really helped us every step of the way and made the night run smoothly.',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Chandler Keen',
    date: '2021-12-16', // 3 years ago
    review_text: 'Ben Murray DJ\'d my wedding and could not have been more thoughtful in the planning process. He\'s extremely talented and all of the guests...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Dan Roberts',
    date: '2021-12-16', // 3 years ago
    review_text: 'Ben worked as the DJ at my fairly large (200-250 people) wedding. He was extremely professional with his communication and knew the right questions...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Brad Eiseman',
    date: '2021-12-16', // 3 years ago
    review_text: 'This company is professional, courteous, and kind! Easily one of the best DJs we could have chosen for our wedding...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Arian Hill',
    date: '2021-12-16', // 3 years ago
    review_text: 'DJ Ben Murray is a PHENOMENAL DJ! He really took my birthday party to the next level. Awesome playlist & mixing skills, great lighting, big personality...',
    rating: 5,
    event_type: 'private_party'
  },
  {
    reviewer_name: 'Steven Gordon',
    date: '2021-12-16', // 3 years ago
    review_text: 'Ben is the best DJ in Memphis. We had him DJ our wedding, very easy to work with and the reception music, lighting, etc was perfect...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Mary Nguyen',
    date: '2021-12-16', // 3 years ago
    review_text: 'Ben is AMAZING! He\'s professional and knows what he\'s doing. He got us to put together our playlist and combined it with his and made the night magical!',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Josh Wurzburg',
    date: '2021-12-16', // 3 years ago
    review_text: 'DJ Ben Murray and the M10 DJ crew were awesome! ... Had DJ Ben Murray and the M10 DJ\'s stay 2 more hours after the original end time because they were that good...',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Haley Blalack',
    date: '2021-12-16', // 3 years ago
    review_text: 'Great!!!!! He did the music at the ceremony and Dj the reception! He did a fantastic job and it was a day not many people will forget.',
    rating: 5,
    event_type: 'wedding'
  },
  {
    reviewer_name: 'Son. person',
    date: '2021-12-16', // 3 years ago
    review_text: 'It was amazing, the best school dance experience I\'ve seen in highschool. 10/10 would recommend for any school event',
    rating: 5,
    event_type: 'school_dance'
  },
  {
    reviewer_name: 'Sami Jodeh',
    date: '2021-12-16', // 3 years ago
    review_text: 'Ben Murray One of the best I\'ve experienced all over my city the name says it all BOP🔥💥',
    rating: 5,
    event_type: 'private_party'
  },
  {
    reviewer_name: 'Matthew Murray',
    date: '2021-12-16', // 3 years ago
    review_text: 'Best event group in Memphis hands down. They were very professional and delivered a great experience! Thank you so much.',
    rating: 5,
    event_type: 'corporate'
  },
  {
    reviewer_name: 'GOE Jaxson',
    date: '2021-12-16', // 3 years ago
    review_text: 'Went to a college party by University of Memphis. Dance floor was packed all night 😁🙏',
    rating: 5,
    event_type: 'private_party'
  },
  {
    reviewer_name: 'Jamie Irby',
    date: '2021-12-16', // 3 years ago
    review_text: 'Super professional and punctual. Took care of our every need and want, would use again!',
    rating: 5,
    event_type: 'corporate'
  }
];

// Extract positive notes from review text
function extractPositiveNotes(reviewText) {
  const notes = [];
  const lowerText = reviewText.toLowerCase();
  
  if (lowerText.includes('professional') || lowerText.includes('professionalism')) {
    notes.push('Professionalism');
  }
  if (lowerText.includes('communication') || lowerText.includes('communicative')) {
    notes.push('Great Communication');
  }
  if (lowerText.includes('music') || lowerText.includes('playlist') || lowerText.includes('song')) {
    notes.push('Music Selection');
  }
  if (lowerText.includes('energy') || lowerText.includes('energetic')) {
    notes.push('High Energy');
  }
  if (lowerText.includes('organized') || lowerText.includes('organization')) {
    notes.push('Well Organized');
  }
  if (lowerText.includes('responsive') || lowerText.includes('responsive')) {
    notes.push('Responsive');
  }
  if (lowerText.includes('lighting') || lowerText.includes('light')) {
    notes.push('Great Lighting');
  }
  if (lowerText.includes('detail') || lowerText.includes('attentive')) {
    notes.push('Attention to Detail');
  }
  if (lowerText.includes('dance') || lowerText.includes('dancing')) {
    notes.push('Great Dance Floor');
  }
  if (lowerText.includes('price') || lowerText.includes('affordable') || lowerText.includes('value')) {
    notes.push('Great Value');
  }
  
  return notes.slice(0, 5); // Limit to 5 notes
}

async function importReviews() {
  try {
    console.log('Importing Google Reviews for M10 DJ Company...\n');

    // Find M10 DJ Company profile
    const { data: profile, error: profileError } = await supabase
      .from('dj_profiles')
      .select('id, dj_name, organization_id')
      .eq('dj_slug', 'm10-dj-company-memphis')
      .single();

    if (profileError || !profile) {
      console.error('Error: Could not find M10 DJ Company profile');
      console.error('Error:', profileError);
      process.exit(1);
    }

    console.log(`Found profile: ${profile.dj_name} (ID: ${profile.id})\n`);

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const review of googleReviews) {
      try {
        // Check if review already exists (by reviewer name and date)
        const { data: existing } = await supabase
          .from('dj_reviews')
          .select('id')
          .eq('dj_profile_id', profile.id)
          .eq('reviewer_name', review.reviewer_name)
          .eq('event_date', review.date)
          .single();

        if (existing) {
          console.log(`  ⏭️  Skipped (already exists): ${review.reviewer_name}`);
          continue;
        }

        // Extract positive notes
        const positiveNotes = extractPositiveNotes(review.review_text);

        // Create review
        const { data: newReview, error: insertError } = await supabase
          .from('dj_reviews')
          .insert({
            dj_profile_id: profile.id,
            reviewer_name: review.reviewer_name,
            rating: review.rating,
            review_text: review.review_text,
            event_type: review.event_type,
            event_date: review.date,
            is_verified: true, // Google reviews are considered verified
            verification_method: 'google_reviews',
            verified_at: new Date().toISOString(),
            is_approved: true, // Auto-approve Google reviews
            positive_notes: positiveNotes.length > 0 ? positiveNotes : null,
            review_aspects: review.event_type ? [review.event_type] : null
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        console.log(`  ✓ Imported: ${review.reviewer_name} (${review.rating}★)`);
        successCount++;
        results.push({
          reviewer: review.reviewer_name,
          status: 'imported',
          review_id: newReview.id
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`  ✗ Error importing ${review.reviewer_name}:`, error.message);
        errorCount++;
        results.push({
          reviewer: review.reviewer_name,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Import Summary:');
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Total: ${googleReviews.length}`);
    console.log('='.repeat(60));

    // Calculate aggregate rating
    const { data: allReviews } = await supabase
      .from('dj_reviews')
      .select('rating')
      .eq('dj_profile_id', profile.id)
      .eq('is_verified', true)
      .eq('is_approved', true);

    if (allReviews && allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / allReviews.length;
      console.log(`\nAggregate Rating: ${avgRating.toFixed(1)}★ (${allReviews.length} reviews)`);
    }

    console.log('\nResults (JSON):');
    console.log(JSON.stringify(results, null, 2));

    return results;

  } catch (error) {
    console.error('Error importing reviews:', error);
    throw error;
  }
}

// Run the import
importReviews()
  .then(() => {
    console.log('\n✓ Import completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Import failed:', error.message);
    process.exit(1);
  });

