#!/usr/bin/env node

/**
 * Test the general YouTube search endpoint with authentication
 * This script demonstrates how to test the endpoint programmatically
 * 
 * Usage: node scripts/test-general-search-with-auth.js [search query]
 * 
 * Note: This requires you to provide a valid session cookie or access token
 * For actual testing, use the browser dev tools Network tab while logged in
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Load environment variables
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' });
}
if (fs.existsSync('.env')) {
  require('dotenv').config({ path: '.env' });
}

const searchQuery = process.argv[2] || 'karaoke songs';

console.log('🧪 Testing General YouTube Search Endpoint');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Search Query: "${searchQuery}"`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Test the endpoint
function testGeneralSearchEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: searchQuery,
      maxResults: 5,
      order: 'relevance',
      filters: {}
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/youtube/search-general',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
        // Note: In a real test, you'd add:
        // 'Cookie': 'your-session-cookie-here'
        // or
        // 'Authorization': 'Bearer your-access-token-here'
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          console.log(`📡 Endpoint: POST /api/youtube/search-general`);
          console.log(`📊 Status Code: ${res.statusCode}`);
          console.log('');

          if (res.statusCode === 200 && json.success) {
            console.log('✅ SUCCESS - General Search Working!');
            console.log('─────────────────────────────────────────────────────');
            console.log(`Query: "${json.query}"`);
            console.log(`Total Results: ${json.totalResults}`);
            console.log(`Max Results: ${json.maxResults}`);
            console.log(`Order: ${json.order}`);
            console.log('');

            if (json.videos && json.videos.length > 0) {
              console.log('📹 Video Results:');
              json.videos.forEach((video, index) => {
                console.log(`\n   ${index + 1}. ${video.title}`);
                console.log(`      ID: ${video.id}`);
                console.log(`      Channel: ${video.channelTitle}`);
                console.log(`      Duration: ${video.durationSeconds}s (${video.duration})`);
                console.log(`      Views: ${parseInt(video.viewCount || 0).toLocaleString()}`);
                console.log(`      Published: ${new Date(video.publishedAt).toLocaleDateString()}`);
                console.log(`      Embeddable: ${video.embeddable ? 'Yes' : 'No'}`);
                if (video.tags && video.tags.length > 0) {
                  console.log(`      Tags: ${video.tags.slice(0, 3).join(', ')}${video.tags.length > 3 ? '...' : ''}`);
                }
              });
            } else {
              console.log('⚠️  No videos returned');
            }
          } else if (res.statusCode === 401) {
            console.log('⚠️  UNAUTHORIZED - Authentication Required');
            console.log('─────────────────────────────────────────────────────');
            console.log('This endpoint requires authentication.');
            console.log('');
            console.log('💡 To test with authentication:');
            console.log('   1. Open your browser and log in to the app');
            console.log('   2. Open DevTools (F12) → Network tab');
            console.log('   3. Perform a search in the Videos tab');
            console.log('   4. Find the request to /api/youtube/search-general');
            console.log('   5. Copy the request headers (especially Cookie)');
            console.log('   6. Use those headers in this script or use Postman');
            console.log('');
            console.log('💡 Or test directly in the browser:');
            console.log('   - Navigate to the karaoke admin page');
            console.log('   - Go to the Videos tab');
            console.log('   - Perform a general search');
            console.log('   - Check the Network tab for the API call');
          } else if (res.statusCode === 400) {
            console.log('❌ BAD REQUEST');
            console.log('─────────────────────────────────────────────────────');
            console.log(`Error: ${json.error || 'Invalid request'}`);
            if (json.message) {
              console.log(`Message: ${json.message}`);
            }
          } else if (res.statusCode === 503) {
            console.log('⚠️  SERVICE UNAVAILABLE');
            console.log('─────────────────────────────────────────────────────');
            console.log(`Error: ${json.error || 'Service unavailable'}`);
            if (json.youtubeError) {
              console.log(`YouTube Error: ${json.youtubeError}`);
            }
            console.log('');
            console.log('💡 Possible causes:');
            console.log('   - YouTube API key not configured');
            console.log('   - YouTube API quota exceeded');
            console.log('   - YouTube API rate limit exceeded');
            console.log('   - YouTube API temporarily unavailable');
          } else if (res.statusCode === 500) {
            console.log('❌ INTERNAL SERVER ERROR');
            console.log('─────────────────────────────────────────────────────');
            console.log(`Error: ${json.error || 'Internal server error'}`);
            if (json.message) {
              console.log(`Message: ${json.message}`);
            }
          } else {
            console.log(`⚠️  UNEXPECTED STATUS: ${res.statusCode}`);
            console.log('─────────────────────────────────────────────────────');
            console.log('Response:', JSON.stringify(json, null, 2));
          }

          console.log('');
          resolve(json);
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.error('Raw response:', data.substring(0, 500));
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Could not connect to server');
        console.log('   Make sure Next.js dev server is running: npm run dev');
      } else if (error.code === 'ETIMEDOUT') {
        console.log('❌ Request timed out');
        console.log('   The server might be slow or not responding');
      } else {
        console.error('❌ Request failed:', error.message);
      }
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Request timed out after 10 seconds');
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Run test
async function runTest() {
  try {
    await testGeneralSearchEndpoint();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test completed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
