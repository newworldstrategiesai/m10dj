// Interactive test script for YouTube API key validation
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function testYouTubeAPI(apiKey) {
  console.log('\n🔍 Testing YouTube API Key...\n');

  if (!apiKey || apiKey.trim().length === 0) {
    console.log('❌ No YouTube API key provided');
    return;
  }

  console.log('✅ Testing API key:', apiKey.substring(0, 10) + '...');

  // Test 1: Simple API connectivity
  console.log('\n📡 Test 1: API Connectivity');
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=karaoke&type=video&maxResults=1&key=${apiKey}`;

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
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(testSong)}&type=video&maxResults=5&key=${apiKey}`;

    const response = await fetch(searchUrl);
    const data = await response.json();

    if (response.ok && !data.error) {
      console.log('✅ Search successful');
      console.log(`   Query: "${testSong}"`);
      console.log(`   Results: ${data.items?.length || 0} videos`);

      if (data.items && data.items.length > 0) {
        console.log('   Sample results:');
        data.items.slice(0, 2).forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.snippet.title.substring(0, 60)}...`);
        });
      }
    } else {
      console.log('❌ Search failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ Search error:', error.message);
  }

  // Test 3: Quota check
  console.log('\n📊 Test 3: API Status');
  try {
    const quotaUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${apiKey}`;

    const response = await fetch(quotaUrl);

    console.log('📈 API Status:');
    console.log(`   Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('✅ YouTube API key is working correctly!');
      console.log('   You can now add YOUTUBE_API_KEY to your .env.local file');
    } else {
      const data = await response.json();
      console.log('❌ API key validation failed');
      console.log(`   Error: ${data.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.log('❌ API status check error:', error.message);
  }

  console.log('\n🎉 YouTube API testing complete!');
}

async function main() {
  console.log('🧪 YouTube API Key Tester');
  console.log('========================');

  const apiKey = await askQuestion('Enter your YouTube API key: ');

  await testYouTubeAPI(apiKey.trim());

  rl.close();
}

main().catch(console.error);