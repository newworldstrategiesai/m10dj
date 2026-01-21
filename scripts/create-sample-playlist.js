#!/usr/bin/env node

/**
 * Create a sample karaoke playlist
 * This demonstrates playlist functionality with the seeded songs
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function createSamplePlaylist() {
  console.log('🎶 Creating sample karaoke playlist...');

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
  console.log(`📍 Creating playlist for organization: ${organization.name}`);

  // Get an admin user from the organization
  const { data: orgMembers, error: memberError } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organization.id)
    .limit(1);

  if (memberError || !orgMembers || orgMembers.length === 0) {
    console.error('❌ No organization members found:', memberError);
    process.exit(1);
  }

  const adminUserId = orgMembers[0].user_id;
  console.log(`👤 Using admin user: ${adminUserId}`);

  // Get some seeded songs
  const { data: songs, error: songsError } = await supabase
    .from('karaoke_song_videos')
    .select('id, song_title, song_artist')
    .eq('organization_id', organization.id)
    .eq('source', 'bulk_import')
    .limit(8);

  if (songsError || !songs || songs.length === 0) {
    console.error('❌ No seeded songs found:', songsError);
    process.exit(1);
  }

  console.log(`🎵 Found ${songs.length} seeded songs`);

  // Create a sample playlist
  const { data: playlist, error: playlistError } = await supabase
    .from('user_playlists')
    .insert({
      organization_id: organization.id,
      user_id: adminUserId,
      name: '🎤 Popular Karaoke Hits',
      description: 'A collection of popular karaoke songs to get you started!',
      is_public: true,
      video_ids: songs.map(song => song.id)
    })
    .select()
    .single();

  if (playlistError) {
    console.error('❌ Error creating playlist:', playlistError);
    process.exit(1);
  }

  console.log(`✅ Created playlist: "${playlist.name}"`);
  console.log(`📋 Includes ${songs.length} songs:`);

  songs.forEach((song, index) => {
    console.log(`   ${index + 1}. "${song.song_title}" by ${song.song_artist}`);
  });

  console.log(`\n🎉 Sample playlist ready! Users can now browse and play these songs.`);
}

// Run the script
if (require.main === module) {
  createSamplePlaylist().catch(console.error);
}

module.exports = { createSamplePlaylist };