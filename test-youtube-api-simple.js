// Simple YouTube API test script
// Usage: node test-youtube-api-simple.js YOUR_API_KEY

const apiKey = process.argv[2];

if (!apiKey) {
  console.log('❌ Usage: node test-youtube-api-simple.js YOUR_YOUTUBE_API_KEY');
  console.log('   Example: node test-youtube-api-simple.js AIzaSyD...');
  process.exit(1);
}

async function testYouTubeAPI() {
  console.log('🔍 Testing YouTube API Key...\n');

  console.log('✅ Testing API key:', apiKey.substring(0, 10) + '...');

  // Test 1: Simple API connectivity
  console.log('📡 Test 1: API Connectivity');
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=karaoke&type=video&maxResults=1&key=${apiKey}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (response.ok && !data.error) {
      console.log('✅ API connection successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   Quota used: ${response.headers.get('x-quota-used') || 'N/A'}`);
    } else {
      console.log('❌ API connection failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }

  // Test 2: Search functionality
  console.log('\n🔎 Test 2: Search Functionality');
  try {
    const testSong = 'bohemian rhapsody karaoke';
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(testSong)}&type=video&maxResults=3&key=${apiKey}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (response.ok && !data.error) {
      console.log('✅ Search successful');
      console.log(`   Query: "${testSong}"`);
      console.log(`   Results: ${data.items?.length || 0} videos`);

      if (data.items && data.items.length > 0) {
        console.log('   Top results:');
        data.items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.snippet.title.substring(0, 50)}...`);
        });
      }
    } else {
      console.log('❌ Search failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Search error:', error.message);
    return false;
  }

  console.log('\n🎉 SUCCESS! Your YouTube API key is working correctly!');
  console.log('   You can now add it to your .env.local file:');
  console.log(`   YOUTUBE_API_KEY=${apiKey}`);

  return true;
}

testYouTubeAPI().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});