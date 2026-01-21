#!/usr/bin/env node

/**
 * Comprehensive karaoke playlists seeding
 * Creates multiple themed playlists with popular songs
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Playlist configurations
const PLAYLISTS = [
  {
    name: '🎤 80s & 90s Hits',
    description: 'Classic karaoke favorites from the 80s and 90s',
    songs: [
      'I Want It That Way', // Backstreet Boys
      'Wonderwall', // Oasis
      'Don\'t Stop Believin\'', // Journey
      'Livin\' on a Prayer' // Bon Jovi
    ]
  },
  {
    name: '💃 Dance Party',
    description: 'High-energy songs perfect for dancing',
    songs: [
      'Dancing Queen', // ABBA
      'Good Luck, Babe!', // Chappell Roan
      'Espresso', // Sabrina Carpenter
      'Please Please Please' // Sabrina Carpenter
    ]
  },
  {
    name: '🎸 Rock Classics',
    description: 'Legendary rock songs that never get old',
    songs: [
      'Bohemian Rhapsody', // Queen
      'Wonderwall', // Oasis
      'Don\'t Stop Believin\'', // Journey
      'Livin\' on a Prayer' // Bon Jovi
    ]
  },
  {
    name: '🎻 Country Nights',
    description: 'Country songs for a cozy karaoke evening',
    songs: [
      'Tennessee Whiskey', // Chris Stapleton
      'Before He Cheats', // Carrie Underwood
      'Wagon Wheel', // Old Crow Medicine Show
      'Take Me Home, Country Roads' // John Denver
    ]
  },
  {
    name: '🎵 Pop Sensations',
    description: 'Current pop hits and modern favorites',
    songs: [
      'Espresso', // Sabrina Carpenter
      'Good Luck, Babe!', // Chappell Roan
      'Please Please Please', // Sabrina Carpenter
      'Birds of a Feather' // Billie Eilish
    ]
  },
  {
    name: '🎺 Guilty Pleasures',
    description: 'Fun, cheesy songs everyone secretly loves',
    songs: [
      'Sweet Caroline', // Neil Diamond
      'I Want It That Way', // Backstreet Boys
      'Dancing Queen', // ABBA
      'Wagon Wheel' // Old Crow Medicine Show
    ]
  }
];

async function seedKaraokePlaylists() {
  console.log('🎶 Seeding comprehensive karaoke playlists...');

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
  console.log(`📍 Seeding playlists for organization: ${organization.name}`);

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

  // Get all seeded songs
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

  let totalPlaylistsCreated = 0;
  let totalSongsAdded = 0;

  for (const playlistConfig of PLAYLISTS) {
    console.log(`\n📝 Creating playlist: "${playlistConfig.name}"`);

    // Find song IDs for this playlist
    const songIds = [];
    for (const songTitle of playlistConfig.songs) {
      // Try to find the song in our seeded data
      const foundSong = allSongs.find(song =>
        song.song_title.toLowerCase().includes(songTitle.toLowerCase().split(' - ')[0])
      );

      if (foundSong) {
        songIds.push(foundSong.id);
        console.log(`   ✅ Found: "${foundSong.song_title}" by ${foundSong.song_artist}`);
      } else {
        console.log(`   ⚠️  Not found: ${songTitle}`);
      }
    }

    if (songIds.length === 0) {
      console.log(`⏭️  Skipping playlist - no songs found`);
      continue;
    }

    // Check if playlist already exists
    const { data: existingPlaylist } = await supabase
      .from('user_playlists')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('name', playlistConfig.name)
      .single();

    if (existingPlaylist) {
      console.log(`⏭️  Playlist already exists, skipping`);
      continue;
    }

    // Create the playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('user_playlists')
      .insert({
        organization_id: organization.id,
        user_id: adminUserId,
        name: playlistConfig.name,
        description: playlistConfig.description,
        is_public: true,
        video_ids: songIds
      })
      .select()
      .single();

    if (playlistError) {
      console.error(`❌ Error creating playlist "${playlistConfig.name}":`, playlistError);
      continue;
    }

    console.log(`✅ Created "${playlist.name}" with ${songIds.length} songs`);
    totalPlaylistsCreated++;
    totalSongsAdded += songIds.length;
  }

  console.log(`\n🎉 Playlist seeding complete!`);
  console.log(`📊 Results:`);
  console.log(`   📝 Playlists created: ${totalPlaylistsCreated}`);
  console.log(`   🎵 Total songs added: ${totalSongsAdded}`);
  console.log(`   📈 Average songs per playlist: ${totalPlaylistsCreated > 0 ? (totalSongsAdded / totalPlaylistsCreated).toFixed(1) : 0}`);

  if (totalPlaylistsCreated > 0) {
    console.log(`\n🎶 Your karaoke playlists section is now fully stocked!`);
    console.log(`   Browse different themes: 80s/90s, Dance Party, Rock Classics, Country, Pop, Guilty Pleasures`);
  }
}

// Run the script
if (require.main === module) {
  seedKaraokePlaylists().catch(console.error);
}

module.exports = { seedKaraokePlaylists };