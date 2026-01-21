#!/usr/bin/env node

/**
 * Seed karaoke songs into the database
 * This script populates the karaoke_song_videos table with popular karaoke songs
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Popular karaoke songs to seed
const POPULAR_SONGS = [
  { title: "Tennessee Whiskey", artist: "Chris Stapleton" },
  { title: "I Want It That Way", artist: "Backstreet Boys" },
  { title: "Sweet Caroline", artist: "Neil Diamond" },
  { title: "Bohemian Rhapsody", artist: "Queen" },
  { title: "Dancing Queen", artist: "ABBA" },
  { title: "Before He Cheats", artist: "Carrie Underwood" },
  { title: "Espresso", artist: "Sabrina Carpenter" },
  { title: "Good Luck, Babe!", artist: "Chappell Roan" },
  { title: "Please Please Please", artist: "Sabrina Carpenter" },
  { title: "Birds of a Feather", artist: "Billie Eilish" },
  { title: "Wagon Wheel", artist: "Old Crow Medicine Show" },
  { title: "Take Me Home, Country Roads", artist: "John Denver" },
  { title: "Wonderwall", artist: "Oasis" },
  { title: "Don't Stop Believin'", artist: "Journey" },
  { title: "Livin' on a Prayer", artist: "Bon Jovi" }
];

async function seedKaraokeSongs() {
  console.log('🌱 Starting karaoke songs seeding...');

  // Get Supabase credentials from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the M10DJ organization (assuming it's the first/main org)
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (orgError || !organizations || organizations.length === 0) {
    console.error('❌ No organizations found:', orgError);
    process.exit(1);
  }

  const organization = organizations[0];
  console.log(`📍 Seeding for organization: ${organization.name} (${organization.id})`);

  let successCount = 0;
  let errorCount = 0;

  for (const song of POPULAR_SONGS) {
    try {
      console.log(`🎵 Adding: "${song.title}" by ${song.artist}`);

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
        console.log(`⏭️  Song already exists, skipping`);
        continue;
      }

      // Insert the song with placeholder YouTube data
      // Users can search for real karaoke videos later
      const { error: insertError } = await supabase
        .from('karaoke_song_videos')
        .insert({
          organization_id: organization.id,
          song_title: song.title,
          song_artist: song.artist,
          song_key: `${normalizedTitle} ${normalizedArtist}`.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim(),
          // Placeholder YouTube data - users can search for real videos
          youtube_video_id: `placeholder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          youtube_video_title: `${song.title} - ${song.artist} (Search for karaoke version)`,
          youtube_channel_name: 'Placeholder - Search Required',
          youtube_channel_id: null,
          youtube_video_duration: null,
          youtube_view_count: 0,
          video_quality_score: 10, // Low score to encourage searching
          is_karaoke_track: false, // Not actually karaoke yet
          has_lyrics: true,
          has_instruments: true,
          source: 'bulk_import',
          confidence_score: 0.1, // Low confidence
          link_status: 'broken' // Indicates needs real video
        });

      if (insertError) {
        console.error(`❌ Error inserting "${song.title}":`, insertError);
        errorCount++;
      } else {
        console.log(`✅ Added "${song.title}" by ${song.artist}`);
        successCount++;
      }

    } catch (error) {
      console.error(`❌ Error processing "${song.title}":`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`✅ Successfully added: ${successCount} songs`);
  console.log(`❌ Errors: ${errorCount} songs`);
  console.log(`📊 Total processed: ${POPULAR_SONGS.length} songs`);

  if (successCount > 0) {
    console.log(`\n🎵 Your karaoke system now has ${successCount} popular songs ready to sing!`);
  }
}

// Run the seeding
if (require.main === module) {
  seedKaraokeSongs().catch(console.error);
}

module.exports = { seedKaraokeSongs };