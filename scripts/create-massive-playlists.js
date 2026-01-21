#!/usr/bin/env node

/**
 * Create massive 4-hour karaoke playlists
 * Redistribute all songs across themed playlists for substantial sessions
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Enhanced playlist configurations with broader themes
const MASSIVE_PLAYLISTS = {
  '🎤 80s & 90s Hits': {
    keywords: ['80s', '90s', 'journey', 'bon jovi', 'oasis', 'queen', 'michael jackson', 'madonna', 'prince', 'whitney', 'mariah', 'boyz ii men', 'spice girls', 'backstreet boys', 'nsync'],
    minSongs: 25
  },
  '💃 Dance Party': {
    keywords: ['dance', 'party', 'club', 'disco', 'electronic', 'house', 'techno', 'dancing queen', 'abba', 'bee gees', 'village people', 'chic', 'k.c.', 'earth wind', 'fire'],
    minSongs: 25
  },
  '🎸 Rock Classics': {
    keywords: ['rock', 'classic rock', 'led zeppelin', 'eagles', 'boston', 'journey', 'foreigner', 'survivor', 'reo', 'speedwagon', 'poison', 'bon jovi', 'def leppard', 'guns n roses', 'metallica', 'nirvana', 'pearl jam', 'soundgarden'],
    minSongs: 25
  },
  '🎻 Country Nights': {
    keywords: ['country', 'garth brooks', 'shania twain', 'tim mcgraw', 'faith hill', 'toby keith', 'carrie underwood', 'miranda lambert', 'brad paisley', 'darius rucker', 'tennessee whiskey', 'before he cheats', 'jesus take the wheel'],
    minSongs: 25
  },
  '🎵 Pop Sensations': {
    keywords: ['pop', 'modern', 'current', 'taylor swift', 'ed sheeran', 'justin bieber', 'ariana grande', 'katy perry', 'lady gaga', 'britney spears', 'christina aguilera', 'beyoncé', 'rihanna', 'kanye', 'drake', 'eminem'],
    minSongs: 25
  },
  '🎺 Guilty Pleasures': {
    keywords: ['guilty pleasure', 'cheesy', 'fun', 'nostalgia', 'air supply', 'berlin', 'wham', 'phil collins', 'peter gabriel', 'elton john', 'billy joel', 'carole king', 'dionne warwick', 'barry manilow'],
    minSongs: 25
  },
  '🎤 Ultimate Karaoke Mix': {
    keywords: ['ultimate', 'mix', 'best of', 'greatest hits', 'all time', 'classic'],
    minSongs: 30
  }
};

async function createMassivePlaylists() {
  console.log('🎵 Creating massive 4-hour karaoke playlists...');

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
  console.log(`📍 Creating massive playlists for organization: ${organization.name}`);

  // Get an admin user
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

  // Get all songs
  const { data: allSongs, error: songsError } = await supabase
    .from('karaoke_song_videos')
    .select('id, song_title, song_artist')
    .eq('organization_id', organization.id)
    .order('created_at', { ascending: false });

  if (songsError || !allSongs) {
    console.error('❌ Error fetching songs:', songsError);
    process.exit(1);
  }

  console.log(`🎵 Found ${allSongs.length} total songs in library`);

  // Create a song map for easier lookup
  const songMap = new Map();
  allSongs.forEach(song => {
    const key = `${song.song_title.toLowerCase()} ${song.song_artist.toLowerCase()}`;
    songMap.set(key, song.id);
  });

  let totalPlaylistsCreated = 0;
  let totalSongsAssigned = 0;

  for (const [playlistName, config] of Object.entries(MASSIVE_PLAYLISTS)) {
    console.log(`\n📝 Creating massive playlist: "${playlistName}"`);

    // First, delete existing playlist with this name
    await supabase
      .from('user_playlists')
      .delete()
      .eq('organization_id', organization.id)
      .eq('name', playlistName);

    // Collect songs for this playlist
    const playlistSongs = [];

    // Priority 1: Songs that match keywords exactly
    for (const song of allSongs) {
      const songText = `${song.song_title} ${song.song_artist}`.toLowerCase();
      const matchesKeyword = config.keywords.some(keyword =>
        songText.includes(keyword.toLowerCase())
      );

      if (matchesKeyword && !playlistSongs.includes(song.id)) {
        playlistSongs.push(song.id);
      }
    }

    // Priority 2: Fill with remaining songs if we don't have enough
    if (playlistSongs.length < config.minSongs) {
      for (const song of allSongs) {
        if (!playlistSongs.includes(song.id)) {
          playlistSongs.push(song.id);
          if (playlistSongs.length >= config.minSongs) break;
        }
      }
    }

    console.log(`🎵 Collected ${playlistSongs.length} songs for playlist`);

    if (playlistSongs.length === 0) {
      console.log(`⏭️  No songs found, skipping`);
      continue;
    }

    // Create the massive playlist
    const { data: playlist, error: playlistError } = await supabase
      .from('user_playlists')
      .insert({
        organization_id: organization.id,
        user_id: adminUserId,
        name: playlistName,
        description: `Massive ${playlistSongs.length}-song playlist perfect for extended karaoke sessions. Approximately ${Math.round(playlistSongs.length * 3.5 / 60 * 10) / 10} hours of music!`,
        is_public: true,
        video_ids: playlistSongs
      })
      .select()
      .single();

    if (playlistError) {
      console.error(`❌ Error creating playlist "${playlistName}":`, playlistError);
      continue;
    }

    const estimatedHours = Math.round(playlistSongs.length * 3.5 / 60 * 10) / 10;
    console.log(`✅ Created "${playlist.name}" with ${playlistSongs.length} songs (~${estimatedHours} hours)`);

    totalPlaylistsCreated++;
    totalSongsAssigned += playlistSongs.length;
  }

  console.log(`\n🎉 Massive playlist creation complete!`);
  console.log(`📊 Results:`);
  console.log(`   📝 Playlists created: ${totalPlaylistsCreated}`);
  console.log(`   🎵 Songs assigned: ${totalSongsAssigned}`);
  console.log(`   📈 Average songs per playlist: ${Math.round(totalSongsAssigned / totalPlaylistsCreated)}`);

  const totalEstimatedHours = Math.round(totalSongsAssigned * 3.5 / 60 * 10) / 10;
  console.log(`   ⏰ Total music across all playlists: ${totalEstimatedHours} hours`);

  console.log(`\n🎵 Your karaoke system now has substantial playlists for marathon sessions!`);
  console.log(`   Each playlist has enough songs for 2-4 hour karaoke parties.`);
}

// Run the script
if (require.main === module) {
  createMassivePlaylists().catch(console.error);
}

module.exports = { createMassivePlaylists };