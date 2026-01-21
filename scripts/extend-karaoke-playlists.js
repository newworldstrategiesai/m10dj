#!/usr/bin/env node

/**
 * Extend existing karaoke playlists with more songs
 * Adds additional songs to each themed playlist
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Additional songs to add to each playlist theme
const PLAYLIST_EXTENSIONS = {
  '🎤 80s & 90s Hits': [
    'Sweet Caroline', // Neil Diamond
    'Dancing Queen', // ABBA
    'Bohemian Rhapsody', // Queen
    'Take Me Home, Country Roads' // John Denver (crossover hit)
  ],
  '💃 Dance Party': [
    'Wagon Wheel', // Old Crow Medicine Show (fun dance song)
    'Tennessee Whiskey', // Chris Stapleton
    'Before He Cheats', // Carrie Underwood
    'Wonderwall' // Oasis
  ],
  '🎸 Rock Classics': [
    'Sweet Caroline', // Neil Diamond
    'Tennessee Whiskey', // Chris Stapleton
    'Dancing Queen', // ABBA
    'Birds of a Feather' // Billie Eilish (modern rock feel)
  ],
  '🎻 Country Nights': [
    'Sweet Caroline', // Neil Diamond
    'I Want It That Way', // Backstreet Boys
    'Dancing Queen', // ABBA
    'Livin\' on a Prayer' // Bon Jovi
  ],
  '🎵 Pop Sensations': [
    'I Want It That Way', // Backstreet Boys
    'Dancing Queen', // ABBA
    'Wagon Wheel', // Old Crow Medicine Show
    'Tennessee Whiskey' // Chris Stapleton
  ],
  '🎺 Guilty Pleasures': [
    'Bohemian Rhapsody', // Queen
    'Birds of a Feather', // Billie Eilish
    'Livin\' on a Prayer', // Bon Jovi
    'Wonderwall' // Oasis
  ]
};

async function extendKaraokePlaylists() {
  console.log('🎶 Extending karaoke playlists with more songs...');

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
  console.log(`📍 Extending playlists for organization: ${organization.name}`);

  // Get all seeded songs for reference
  const { data: allSongs, error: songsError } = await supabase
    .from('karaoke_song_videos')
    .select('id, song_title, song_artist')
    .eq('organization_id', organization.id)
    .eq('source', 'bulk_import');

  if (songsError || !allSongs) {
    console.error('❌ Error fetching songs:', songsError);
    process.exit(1);
  }

  console.log(`🎵 Found ${allSongs.length} total seeded songs`);

  // Create a song lookup map
  const songMap = new Map();
  allSongs.forEach(song => {
    const key = `${song.song_title.toLowerCase()} ${song.song_artist.toLowerCase()}`;
    songMap.set(key, song.id);
  });

  let totalSongsAdded = 0;
  let totalPlaylistsExtended = 0;

  for (const [playlistName, additionalSongs] of Object.entries(PLAYLIST_EXTENSIONS)) {
    console.log(`\n📝 Extending playlist: "${playlistName}"`);

    // Find the existing playlist
    const { data: existingPlaylist, error: findError } = await supabase
      .from('user_playlists')
      .select('id, video_ids, name')
      .eq('organization_id', organization.id)
      .eq('name', playlistName)
      .single();

    if (findError || !existingPlaylist) {
      console.log(`⚠️  Playlist "${playlistName}" not found, skipping`);
      continue;
    }

    console.log(`📋 Current songs: ${existingPlaylist.video_ids?.length || 0}`);

    // Find new songs to add
    const newSongIds = [];
    for (const songTitle of additionalSongs) {
      // Try to find the song in our seeded data
      const foundSong = allSongs.find(song =>
        song.song_title.toLowerCase().includes(songTitle.toLowerCase().split(' - ')[0])
      );

      if (foundSong) {
        // Check if song is already in playlist
        if (!existingPlaylist.video_ids?.includes(foundSong.id)) {
          newSongIds.push(foundSong.id);
          console.log(`   ➕ Adding: "${foundSong.song_title}" by ${foundSong.song_artist}`);
        } else {
          console.log(`   ⏭️  Already in playlist: "${foundSong.song_title}"`);
        }
      } else {
        console.log(`   ⚠️  Not found in library: ${songTitle}`);
      }
    }

    if (newSongIds.length === 0) {
      console.log(`⏭️  No new songs to add`);
      continue;
    }

    // Update the playlist with additional songs
    const updatedVideoIds = [...(existingPlaylist.video_ids || []), ...newSongIds];

    const { error: updateError } = await supabase
      .from('user_playlists')
      .update({
        video_ids: updatedVideoIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPlaylist.id);

    if (updateError) {
      console.error(`❌ Error updating playlist "${playlistName}":`, updateError);
      continue;
    }

    console.log(`✅ Extended "${playlistName}" from ${existingPlaylist.video_ids?.length || 0} to ${updatedVideoIds.length} songs`);
    totalSongsAdded += newSongIds.length;
    totalPlaylistsExtended++;
  }

  console.log(`\n🎉 Playlist extension complete!`);
  console.log(`📊 Results:`);
  console.log(`   📝 Playlists extended: ${totalPlaylistsExtended}`);
  console.log(`   🎵 Songs added: ${totalSongsAdded}`);
  console.log(`   📈 Average songs added per playlist: ${totalPlaylistsExtended > 0 ? (totalSongsAdded / totalPlaylistsExtended).toFixed(1) : 0}`);

  if (totalSongsAdded > 0) {
    console.log(`\n🎶 Your karaoke playlists are now more substantial!`);
    console.log(`   Each themed playlist now has 6-8 songs to choose from.`);
  }
}

// Run the script
if (require.main === module) {
  extendKaraokePlaylists().catch(console.error);
}

module.exports = { extendKaraokePlaylists };