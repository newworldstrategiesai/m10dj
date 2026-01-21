#!/usr/bin/env node

/**
 * Expand the karaoke song library with many more popular songs
 * Aim for ~4 hours total music (60-80 songs)
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Much larger collection of popular karaoke songs
const EXPANDED_SONGS = [
  // Current hits and modern pop
  { title: "Flowers", artist: "Miley Cyrus" },
  { title: "Last Night", artist: "Morgan Wallen" },
  { title: "Rich Men North of Richmond", artist: "Oliver Anthony Music" },
  { title: "Paint the Town Red", artist: "Doja Cat" },
  { title: "Rich Flex", artist: "Drake & 21 Savage" },
  { title: "Cruel Summer", artist: "Taylor Swift" },
  { title: "I Had Some Help", artist: "Post Malone ft. Morgan Wallen" },
  { title: "Fortnight", artist: "Taylor Swift ft. Post Malone" },
  { title: "Like Crazy", artist: "Jimin" },
  { title: "Seven", artist: "Jungkook ft. Latto" },

  // 2020s hits
  { title: "Levitating", artist: "Dua Lipa" },
  { title: "Good 4 U", artist: "Olivia Rodrigo" },
  { title: "Peaches", artist: "Justin Bieber ft. Daniel Caesar & Giveon" },
  { title: "Drivers License", artist: "Olivia Rodrigo" },
  { title: "Stay", artist: "The Kid Laroi & Justin Bieber" },
  { title: "Industry Baby", artist: "Lil Nas X & Jack Harlow" },
  { title: "Permission to Dance", artist: "BTS" },
  { title: "Butter", artist: "BTS" },
  { title: "Dynamite", artist: "BTS" },
  { title: "Savage Love", artist: "Jawsh 685 & Jason Derulo" },

  // 2010s hits
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
  { title: "Happy", artist: "Pharrell Williams" },
  { title: "Can't Stop the Feeling!", artist: "Justin Timberlake" },
  { title: "Shape of You", artist: "Ed Sheeran" },
  { title: "Thinking Out Loud", artist: "Ed Sheeran" },
  { title: "Royals", artist: "Lorde" },
  { title: "Royals", artist: "Lorde" },
  { title: "Shake It Off", artist: "Taylor Swift" },
  { title: "Blank Space", artist: "Taylor Swift" },
  { title: "Bad Blood", artist: "Taylor Swift" },

  // Classic rock and pop
  { title: "Stairway to Heaven", artist: "Led Zeppelin" },
  { title: "Hotel California", artist: "Eagles" },
  { title: "More Than a Feeling", artist: "Boston" },
  { title: "American Pie", artist: "Don McLean" },
  { title: "Piano Man", artist: "Billy Joel" },
  { title: "Bridge Over Troubled Water", artist: "Simon & Garfunkel" },
  { title: "Let It Be", artist: "The Beatles" },
  { title: "Hey Jude", artist: "The Beatles" },
  { title: "Yesterday", artist: "The Beatles" },
  { title: "Twist and Shout", artist: "The Beatles" },

  // 2000s hits
  { title: "Yeah!", artist: "Usher ft. Lil Jon & Ludacris" },
  { title: "Hey Ya!", artist: "OutKast" },
  { title: "Crazy in Love", artist: "Beyoncé" },
  { title: "Hollaback Girl", artist: "Gwen Stefani" },
  { title: "Since U Been Gone", artist: "Kelly Clarkson" },
  { title: "Bad Romance", artist: "Lady Gaga" },
  { title: "Poker Face", artist: "Lady Gaga" },
  { title: "Telephone", artist: "Lady Gaga ft. Beyoncé" },
  { title: "TiK ToK", artist: "Kesha" },
  { title: "Party in the U.S.A.", artist: "Miley Cyrus" },

  // 90s and 80s classics
  { title: "Smells Like Teen Spirit", artist: "Nirvana" },
  { title: "Losing My Religion", artist: "R.E.M." },
  { title: "Under the Bridge", artist: "Red Hot Chili Peppers" },
  { title: "Wonderwall", artist: "Oasis" },
  { title: "Don't Look Back in Anger", artist: "Oasis" },
  { title: "Creep", artist: "Radiohead" },
  { title: "Karma Police", artist: "Radiohead" },
  { title: "Black Hole Sun", artist: "Soundgarden" },
  { title: "Alive", artist: "Pearl Jam" },
  { title: "Even Flow", artist: "Pearl Jam" },

  // Motown and soul classics
  { title: "Respect", artist: "Aretha Franklin" },
  { title: "Chain of Fools", artist: "Aretha Franklin" },
  { title: "My Girl", artist: "The Temptations" },
  { title: "Ain't Too Proud to Beg", artist: "The Temptations" },
  { title: "What's Going On", artist: "Marvin Gaye" },
  { title: "Let's Get It On", artist: "Marvin Gaye" },
  { title: "Superstition", artist: "Stevie Wonder" },
  { title: "Sir Duke", artist: "Stevie Wonder" },
  { title: "Signed, Sealed, Delivered", artist: "Stevie Wonder" },
  { title: "I Heard It Through the Grapevine", artist: "Marvin Gaye" },

  // Country and folk
  { title: "Friends in Low Places", artist: "Garth Brooks" },
  { title: "Wagon Wheel", artist: "Darius Rucker" },
  { title: "Whiskey Lullaby", artist: "Brad Paisley ft. Alison Krauss" },
  { title: "Jesus Take the Wheel", artist: "Carrie Underwood" },
  { title: "Jesus Take the Wheel", artist: "Carrie Underwood" },
  { title: "Before He Cheats", artist: "Carrie Underwood" },
  { title: "Cowboy Casanova", artist: "Carrie Underwood" },
  { title: "Two Black Cadillacs", artist: "Carrie Underwood" },
  { title: "Good Girl", artist: "Carrie Underwood" },
  { title: "Mama's Broken Heart", artist: "Miranda Lambert" },

  // More current hits
  { title: "Kill Bill", artist: "SZA" },
  { title: "Last Time I Saw You", artist: "Nicki Minaj" },
  { title: "Super Freaky Girl", artist: "Nicki Minaj" },
  { title: "Barbie World", artist: "Ice Spice & Nicki Minaj" },
  { title: "First Class", artist: "Jack Harlow" },
  { title: "Wait for U", artist: "Future ft. Drake & Tems" },
  { title: "Jimmy Cooks", artist: "Drake ft. 21 Savage" },
  { title: "Way 2 Sexy", artist: "Drake ft. Future" },
  { title: "Knife Talk", artist: "Drake ft. 21 Savage" },
  { title: "What's Next", artist: "Drake" },

  // Additional classics
  { title: "Billie Jean", artist: "Michael Jackson" },
  { title: "Thriller", artist: "Michael Jackson" },
  { title: "Beat It", artist: "Michael Jackson" },
  { title: "Black or White", artist: "Michael Jackson" },
  { title: "Man in the Mirror", artist: "Michael Jackson" },
  { title: "Smooth Criminal", artist: "Michael Jackson" },
  { title: "Bad", artist: "Michael Jackson" },
  { title: "The Way You Make Me Feel", artist: "Michael Jackson" },
  { title: "Don't Stop 'Til You Get Enough", artist: "Michael Jackson" },
  { title: "Rock with You", artist: "Michael Jackson" }
];

async function expandKaraokeLibrary() {
  console.log('🎵 Expanding karaoke library with comprehensive song collection...');

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the organization
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (orgError || !organizations || organizations.length === 0) {
    console.error('❌ No organizations found:', orgError);
    process.exit(1);
  }

  const organization = organizations[0];
  console.log(`📍 Expanding library for organization: ${organization.name}`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  console.log(`🎼 Processing ${EXPANDED_SONGS.length} songs...`);

  for (const song of EXPANDED_SONGS) {
    try {
      // Check if this song already exists
      const normalizedTitle = song.title.toLowerCase().trim();
      const normalizedArtist = song.artist.toLowerCase().trim();

      const { data: existingSong } = await supabase
        .from('karaoke_song_videos')
        .select('id')
        .eq('organization_id', organization.id)
        .ilike('song_title', normalizedTitle)
        .ilike('song_artist', normalizedArtist)
        .single();

      if (existingSong) {
        skippedCount++;
        continue;
      }

      // Insert the song
      const { error: insertError } = await supabase
        .from('karaoke_song_videos')
        .insert({
          organization_id: organization.id,
          song_title: song.title,
          song_artist: song.artist,
          song_key: `${normalizedTitle} ${normalizedArtist}`.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(),
          // Placeholder YouTube data
          youtube_video_id: `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          youtube_video_title: `${song.title} - ${song.artist} (Search for karaoke version)`,
          youtube_channel_name: 'Placeholder - Search Required',
          youtube_channel_id: null,
          youtube_video_duration: null,
          youtube_view_count: 0,
          video_quality_score: 10, // Low score to encourage real video search
          is_karaoke_track: false,
          has_lyrics: true,
          has_instruments: true,
          source: 'bulk_import',
          confidence_score: 0.1,
          link_status: 'broken'
        });

      if (insertError) {
        console.error(`❌ Error inserting "${song.title}":`, insertError);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`✅ Added ${successCount} songs so far...`);
        }
      }

    } catch (error) {
      console.error(`❌ Error processing "${song.title}":`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Library expansion complete!`);
  console.log(`📊 Results:`);
  console.log(`   ✅ Successfully added: ${successCount} songs`);
  console.log(`   ⏭️  Skipped (already exist): ${skippedCount} songs`);
  console.log(`   ❌ Errors: ${errorCount} songs`);
  console.log(`   📈 Total processed: ${EXPANDED_SONGS.length} songs`);

  const totalSongs = successCount + skippedCount;
  const estimatedHours = Math.round((totalSongs * 3.5) / 60 * 10) / 10; // Rough estimate: 3.5 min per song

  console.log(`\n🎵 Library now contains approximately ${totalSongs} songs`);
  console.log(`   Estimated total music: ${estimatedHours} hours`);
  console.log(`   Perfect for extended karaoke sessions!`);
}

// Run the script
if (require.main === module) {
  expandKaraokeLibrary().catch(console.error);
}

module.exports = { expandKaraokeLibrary };