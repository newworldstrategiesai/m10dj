/**
 * Search YouTube for a song and return the best matching video
 * Uses YouTube Data API v3 if available, otherwise falls back to oEmbed
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Try YouTube Data API v3 if key is available
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (apiKey) {
      try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${apiKey}`;
        const response = await fetch(searchUrl);
        
        if (response.ok) {
          const data = await response.json();
          if (data.items && data.items.length > 0) {
            const video = data.items[0];
            return res.status(200).json({
              success: true,
              videoId: video.id.videoId,
              title: video.snippet.title,
              thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
              channelTitle: video.snippet.channelTitle
            });
          }
        }
      } catch (apiError) {
        console.error('YouTube API error:', apiError);
        // Fall through to alternative method
      }
    }

    // Fallback: Try to extract video ID from YouTube search page
    // Note: This requires a YouTube API key for reliable results
    // Without an API key, we'll return a search URL for manual verification
    return res.status(200).json({
      success: false,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      message: 'YouTube API key required for automatic video embedding. Please search manually or add YOUTUBE_API_KEY to environment variables.'
    });
  } catch (error) {
    console.error('Error in YouTube search API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

