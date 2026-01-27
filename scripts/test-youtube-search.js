#!/usr/bin/env node

/**
 * Test YouTube search functionality locally via CLI
 * Usage: node scripts/test-youtube-search.js [search query]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables from both .env.local and .env
// dotenv loads .env.local by default, but we also want .env
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
}
if (fs.existsSync('.env')) {
  require('dotenv').config({ path: '.env' });
}

// Try both possible environment variable names
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Check:');
console.log('  YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? `✅ Found (${process.env.YOUTUBE_API_KEY.substring(0, 10)}...)` : '❌ Not found');
console.log('  NEXT_PUBLIC_YOUTUBE_API_KEY:', process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? `✅ Found (${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY.substring(0, 10)}...)` : '❌ Not found');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Found' : '❌ Not found');
console.log('');

if (!YOUTUBE_API_KEY) {
  console.error('❌ Error: YouTube API key not found in environment variables');
  console.log('💡 To test YouTube search, add one of these to your .env.local file:');
  console.log('   YOUTUBE_API_KEY=your_api_key_here');
  console.log('   OR');
  console.log('   NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here');
  console.log('\n💡 You can get a YouTube API key from: https://console.cloud.google.com/apis/credentials');
  console.log('\n⚠️  Continuing with API endpoint test only (will fail without key)...\n');
}

const searchQuery = process.argv[2] || 'karaoke songs';

console.log('🔍 Testing YouTube Search');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Search Query: "${searchQuery}"`);
if (YOUTUBE_API_KEY) {
  console.log(`API Key: ${YOUTUBE_API_KEY.substring(0, 10)}...${YOUTUBE_API_KEY.substring(YOUTUBE_API_KEY.length - 4)}`);
} else {
  console.log('API Key: ❌ Not configured');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test 1: Direct YouTube API call
async function testDirectYouTubeAPI() {
  console.log('📡 Test 1: Direct YouTube API Search');
  console.log('─────────────────────────────────────────────────────');
  
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is required for this test');
  }
  
  return new Promise((resolve, reject) => {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('key', YOUTUBE_API_KEY);
    url.searchParams.set('q', searchQuery);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', '5');
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('type', 'video');
    url.searchParams.set('safeSearch', 'moderate');

    https.get(url.toString(), (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.error) {
            console.error('❌ YouTube API Error:', json.error);
            console.error('   Code:', json.error.code);
            console.error('   Message:', json.error.message);
            if (json.error.errors) {
              json.error.errors.forEach(err => {
                console.error('   Details:', err);
              });
            }
            reject(new Error(json.error.message));
            return;
          }

          console.log('✅ YouTube API Response:');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Results: ${json.items?.length || 0} videos found\n`);
          
          if (json.items && json.items.length > 0) {
            console.log('📹 Sample Results:');
            json.items.slice(0, 3).forEach((item, index) => {
              console.log(`   ${index + 1}. ${item.snippet.title}`);
              console.log(`      Channel: ${item.snippet.channelTitle}`);
              console.log(`      Video ID: ${item.id.videoId}`);
              console.log('');
            });
          }

          resolve(json);
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.error('Raw response:', data.substring(0, 500));
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
  });
}

// Test 2: Get video details
async function getVideoDetails(videoIds) {
  console.log('📡 Test 2: Get Video Details');
  console.log('─────────────────────────────────────────────────────');
  
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is required for this test');
  }
  
  if (!videoIds || videoIds.length === 0) {
    console.log('⚠️  No video IDs to fetch details for');
    return null;
  }

  return new Promise((resolve, reject) => {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('key', YOUTUBE_API_KEY);
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('part', 'contentDetails,statistics,snippet,status');

    https.get(url.toString(), (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.error) {
            console.error('❌ YouTube API Error:', json.error.message);
            reject(new Error(json.error.message));
            return;
          }

          console.log('✅ Video Details Retrieved:');
          console.log(`   Videos: ${json.items?.length || 0}\n`);
          
          if (json.items && json.items.length > 0) {
            json.items.slice(0, 2).forEach((item, index) => {
              console.log(`   ${index + 1}. ${item.snippet.title}`);
              console.log(`      Duration: ${item.contentDetails.duration}`);
              console.log(`      Views: ${parseInt(item.statistics.viewCount || 0).toLocaleString()}`);
              console.log(`      Embeddable: ${item.status.embeddable ? 'Yes' : 'No'}`);
              console.log('');
            });
          }

          resolve(json);
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
  });
}

// Test 3: Test via our API endpoints (if running locally)
async function testLocalAPI() {
  console.log('📡 Test 3: Local API Endpoints');
  console.log('─────────────────────────────────────────────────────');
  console.log('⚠️  This requires the Next.js dev server to be running');
  console.log('    Start it with: npm run dev');
  console.log('    Note: APIs require authentication (401 is expected without auth)\n');
  
  // Test new general search endpoint
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: searchQuery,
      maxResults: 5,
      order: 'relevance'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/youtube/search-general',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ General Search API Response Status: ${res.statusCode}`);
          
          if (res.statusCode === 200 && json.success !== false) {
            console.log(`   Videos: ${json.videos?.length || 0}`);
            console.log(`   Query: ${json.query}`);
            console.log(`   Order: ${json.order}`);
            if (json.youtubeError) {
              console.log(`   ⚠️  YouTube Error: ${json.youtubeError}`);
            }
            if (json.error) {
              console.log(`   ⚠️  API Error: ${json.error}`);
            }
            if (json.videos && json.videos.length > 0) {
              console.log('\n   📹 Sample Results:');
              json.videos.slice(0, 3).forEach((video, index) => {
                console.log(`      ${index + 1}. ${video.title || video.id}`);
                if (video.channelTitle) console.log(`         Channel: ${video.channelTitle}`);
                if (video.durationSeconds) console.log(`         Duration: ${video.durationSeconds}s`);
              });
            }
          } else if (res.statusCode === 401) {
            console.log('   ⚠️  Unauthorized - API requires authentication');
            console.log('   💡 This is expected when testing without auth');
            console.log('   💡 To test with auth, use the browser dev tools or Postman');
          } else if (res.statusCode === 503) {
            console.log(`   ⚠️  Service Unavailable: ${json.error || 'YouTube search unavailable'}`);
            if (json.youtubeError) {
              console.log(`   YouTube Error: ${json.youtubeError}`);
            }
          } else if (res.statusCode === 400) {
            console.log(`   ⚠️  Bad Request: ${json.error || 'Invalid request'}`);
          } else {
            console.log(`   ⚠️  Error: ${json.error || json.message || 'Unknown error'}`);
          }
          console.log('');
          resolve(json);
        } catch (error) {
          console.error('❌ Failed to parse API response:', error.message);
          console.error('Response:', data.substring(0, 500));
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Could not connect to local server');
        console.log('    Make sure Next.js dev server is running: npm run dev');
        console.log('    Then run this script again\n');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('⚠️  Request timed out');
        console.log('    The server might be slow or not responding\n');
      } else {
        console.error('❌ Request failed:', error.message);
      }
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('⚠️  Request timed out after 5 seconds');
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    // Test 1: Direct YouTube API (only if key is available)
    if (YOUTUBE_API_KEY) {
      try {
        const searchResults = await testDirectYouTubeAPI();
        
        // Test 2: Get video details if we have results
        if (searchResults?.items && searchResults.items.length > 0) {
          const videoIds = searchResults.items.map(item => item.id.videoId).filter(Boolean);
          if (videoIds.length > 0) {
            await getVideoDetails(videoIds);
          }
        }
      } catch (error) {
        console.error('❌ Direct YouTube API test failed:', error.message);
        console.log('');
      }
    } else {
      console.log('⏭️  Skipping direct YouTube API test (no API key)\n');
    }

    // Test 3: Local API (optional, may fail if server not running)
    console.log('📡 Test 3: Local API Endpoint');
    console.log('─────────────────────────────────────────────────────');
    try {
      await testLocalAPI();
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('⚠️  Could not connect to local server');
        console.log('    Make sure Next.js dev server is running: npm run dev');
        console.log('    Then run this script again\n');
      } else {
        console.error('❌ API test failed:', error.message);
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Tests completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
