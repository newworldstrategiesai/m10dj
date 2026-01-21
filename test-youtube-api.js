// Test script for YouTube API key validation
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function testYouTubeAPI() {
  console.log('🔍 Testing YouTube API Key...\n');

  // Check if API key exists
  if (!YOUTUBE_API_KEY) {
    console.log('❌ YouTube API key not found in environment variables');
    console.log('   Checked: .env.local, .env');
    return;
  }

  console.log('✅ YouTube API key found:', YOUTUBE_API_KEY.substring(0, 10) + '...');

  // Test 1: Simple API connectivity
  console.log('\n📡 Test 1: API Connectivity');
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=karaoke&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (response.ok && !data.error) {
      console.log('✅ API connection successful');
      console.log(`   Response status: ${response.status}`);
      console.log(`   Results found: ${data.items?.length || 0}`);
    } else {
      console.log('❌ API connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
      return;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return;
  }

  // Test 2: Search functionality
  console.log('\n🔎 Test 2: Search Functionality');
  try {
    const testSong = 'bohemian rhapsody karaoke';
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(testSong)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (response.ok && !data.error) {
      console.log('✅ Search successful');
      console.log(`   Query: "${testSong}"`);
      console.log(`   Results: ${data.items?.length || 0} videos`);

      if (data.items && data.items.length > 0) {
        console.log('   Sample results:');
        data.items.slice(0, 2).forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.snippet.title} by ${item.snippet.channelTitle}`);
        });
      }
    } else {
      console.log('❌ Search failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Search error:', error.message);
  }

  // Test 3: Video details (to test video metadata retrieval)
  console.log('\n🎬 Test 3: Video Details Retrieval');
  try {
    // Use a known YouTube video ID for testing
    const testVideoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up (safe test video)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${testVideoId}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (response.ok && !data.error) {
      console.log('✅ Video details retrieval successful');
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        console.log(`   Video: ${video.snippet.title}`);
        console.log(`   Channel: ${video.snippet.channelTitle}`);
        console.log(`   Duration: ${video.contentDetails.duration}`);
        console.log(`   Views: ${video.statistics.viewCount}`);
      }
    } else {
      console.log('❌ Video details failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Video details error:', error.message);
  }

  // Test 4: Quota check
  console.log('\n📊 Test 4: API Quota Status');
  try {
    // Make a request that includes quota info in headers (if available)
    const quotaUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(quotaUrl);

    // Check rate limit headers
    const limitHeader = response.headers.get('x-ratelimit-limit');
    const remainingHeader = response.headers.get('x-ratelimit-remaining');
    const resetHeader = response.headers.get('x-ratelimit-reset');

    console.log('📈 Quota Information:');
    if (limitHeader) {
      console.log(`   Daily Limit: ${limitHeader}`);
    }
    if (remainingHeader) {
      console.log(`   Remaining: ${remainingHeader}`);
    }
    if (resetHeader) {
      console.log(`   Reset Time: ${new Date(parseInt(resetHeader) * 1000).toLocaleString()}`);
    }

    if (!limitHeader) {
      console.log('   ℹ️  Quota headers not available (normal for most API plans)');
    }

    console.log('✅ YouTube API key is working correctly!');

  } catch (error) {
    console.log('❌ Quota check error:', error.message);
  }

  console.log('\n🎉 YouTube API testing complete!');
  console.log('   If all tests passed, your YouTube API key is working properly.');
}

testYouTubeAPI().catch(console.error);