/**
 * YouTube Data API v3 integration for karaoke video linking
 * Handles video search, metadata retrieval, and quality scoring
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  description?: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string; // ISO 8601 duration
  viewCount: number;
  likeCount?: number;
  thumbnailUrl: string;
  tags?: string[];
}

export interface VideoSearchResult extends YouTubeVideo {
  relevanceScore: number;
  karaokeScore: number;
  confidenceScore: number;
}

export interface YouTubeAPIConfig {
  apiKey: string;
  baseUrl: string;
  maxResults: number;
  timeout: number;
}

/**
 * Default configuration for YouTube API
 */
const DEFAULT_CONFIG: YouTubeAPIConfig = {
  apiKey: process.env.YOUTUBE_API_KEY || '',
  baseUrl: 'https://www.googleapis.com/youtube/v3',
  maxResults: 25,
  timeout: 10000, // 10 seconds
};

/**
 * YouTube API client class
 */
export class YouTubeAPI {
  private config: YouTubeAPIConfig;

  constructor(config: Partial<YouTubeAPIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.apiKey) {
      throw new Error('YouTube API key is required. Set YOUTUBE_API_KEY environment variable.');
    }
  }

  /**
   * Search for videos on YouTube
   */
  async searchVideos(query: string, options: {
    maxResults?: number;
    order?: 'relevance' | 'viewCount' | 'rating' | 'date';
    type?: 'video' | 'playlist' | 'channel';
    safeSearch?: 'none' | 'moderate' | 'strict';
  } = {}): Promise<YouTubeVideo[]> {
    const {
      maxResults = this.config.maxResults,
      order = 'relevance',
      type = 'video',
      safeSearch = 'moderate'
    } = options;

    const url = new URL(`${this.config.baseUrl}/search`);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('q', query);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', maxResults.toString());
    url.searchParams.set('order', order);
    url.searchParams.set('type', type);
    url.searchParams.set('safeSearch', safeSearch);

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Karaoke-App/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`YouTube API error: ${data.error.message}`);
      }

      // Get video details for duration and statistics
      const videoIds = data.items.map((item: any) => item.id.videoId).filter(Boolean);
      if (videoIds.length === 0) {
        return [];
      }

      const videoDetails = await this.getVideoDetails(videoIds);

      // Combine search results with video details
      return data.items.map((item: any) => {
        const details = videoDetails.find(v => v.id === item.id.videoId);
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          channelId: item.snippet.channelId,
          publishedAt: item.snippet.publishedAt,
          duration: details?.duration || 'PT0S',
          viewCount: details?.viewCount || 0,
          likeCount: details?.likeCount || 0,
          thumbnailUrl: item.snippet.thumbnails?.medium?.url ||
                       item.snippet.thumbnails?.default?.url || '',
          tags: details?.tags || []
        };
      });
    } catch (error) {
      console.error('YouTube search error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to search YouTube videos: ${errorMessage}`);
    }
  }

  /**
   * Get detailed information for specific videos
   */
  async getVideoDetails(videoIds: string[]): Promise<Array<{
    id: string;
    duration: string;
    viewCount: number;
    likeCount: number;
    tags: string[];
  }>> {
    if (videoIds.length === 0) return [];

    const url = new URL(`${this.config.baseUrl}/videos`);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('part', 'contentDetails,statistics,snippet');

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`YouTube API error: ${data.error.message}`);
      }

      return data.items.map((item: any) => ({
        id: item.id,
        duration: item.contentDetails?.duration || 'PT0S',
        viewCount: parseInt(item.statistics?.viewCount || '0'),
        likeCount: parseInt(item.statistics?.likeCount || '0'),
        tags: item.snippet?.tags || []
      }));
    } catch (error) {
      console.error('YouTube video details error:', error);
      return [];
    }
  }

  /**
   * Validate if a video exists and get its current metadata
   */
  async validateVideo(videoId: string): Promise<YouTubeVideo | null> {
    try {
      const videos = await this.getVideoDetails([videoId]);
      if (videos.length === 0) return null;

      const details = videos[0];

      // Get basic info via search (since we need title, channel, etc.)
      const searchResults = await this.searchVideos(`id:${videoId}`, { maxResults: 1 });
      const searchInfo = searchResults[0];

      if (!searchInfo) return null;

      return {
        ...searchInfo,
        duration: details.duration,
        viewCount: details.viewCount,
        likeCount: details.likeCount,
        tags: details.tags
      };
    } catch (error) {
      console.error(`Video validation error for ${videoId}:`, error);
      return null;
    }
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Calculate karaoke quality score for a video
 */
export function calculateKaraokeScore(video: YouTubeVideo, songTitle: string, songArtist?: string): number {
  let score = 50; // Base score

  const title = video.title.toLowerCase();
  const description = video.description?.toLowerCase() || '';
  const channel = video.channelTitle.toLowerCase();
  const tags = video.tags?.map(t => t.toLowerCase()) || [];

  // Song title match (+30 points max)
  const titleWords = songTitle.toLowerCase().split(/\s+/);
  const titleMatchCount = titleWords.filter(word =>
    word.length > 2 && (title.includes(word) || description.includes(word))
  ).length;
  score += Math.min(titleMatchCount * 10, 30);

  // Artist match (+20 points)
  if (songArtist) {
    const artistWords = songArtist.toLowerCase().split(/\s+/);
    const artistMatch = artistWords.some(word =>
      word.length > 2 && (title.includes(word) || channel.includes(word))
    );
    if (artistMatch) score += 20;
  }

  // Karaoke indicators (+25 points max)
  const karaokeTerms = ['karaoke', 'instrumental', 'backing track', 'minus one', 'karaoké'];
  const hasKaraokeTerms = karaokeTerms.some(term =>
    title.includes(term) || description.includes(term) || tags.includes(term)
  );
  if (hasKaraokeTerms) score += 25;

  // Karafun channel priority (+50 points - highest priority!)
  const karafunChannels = (process.env.KARAFUN_CHANNEL_IDS || 'karafun').split(',');
  const isKarafunChannel = karafunChannels.some(karafunTerm =>
    video.channelId?.toLowerCase().includes(karafunTerm.toLowerCase()) ||
    channel.toLowerCase().includes(karafunTerm.toLowerCase())
  );
  if (isKarafunChannel) {
    score += 50; // Massive boost for Karafun videos
  }

  // Other reputable channels (+10 points)
  const reputableTerms = ['karaoke', 'sing', 'music', 'official', 'instrumental'];
  const isReputable = reputableTerms.some(term =>
    channel.toLowerCase().includes(term.toLowerCase()) && !isKarafunChannel // Don't double-count Karafun
  );
  if (isReputable) score += 10;

  // View count bonus (+10 points max)
  if (video.viewCount > 10000) score += Math.min(video.viewCount / 100000, 1) * 10;

  // Recent upload bonus (+5 points)
  const daysSinceUpload = (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpload < 365) score += 5;

  // Duration check (penalty for very short/long videos)
  const durationSeconds = parseDuration(video.duration);
  if (durationSeconds < 60 || durationSeconds > 600) score -= 15;

  // Copyright claims or restrictions (penalty)
  if (title.includes('private') || title.includes('unavailable')) score -= 30;

  return Math.max(0, Math.min(100, score));
}

/**
 * Search for karaoke videos with quality scoring
 */
export async function searchKaraokeVideos(
  songTitle: string,
  songArtist?: string,
  options: {
    maxResults?: number;
    filters?: {
      minQuality?: number;
      maxDuration?: number;
      channel?: string;
      hasLyrics?: boolean | null;
      sortBy?: 'karaokeScore' | 'viewCount' | 'date' | 'relevance';
    }
  } = {}
): Promise<VideoSearchResult[]> {
  const api = new YouTubeAPI();

  // Build search queries with Karafun prioritized
  const karafunQueries: string[] = [];
  const generalQueries = [
    // Primary: exact song + artist + karaoke
    `"${songTitle}"${songArtist ? ` "${songArtist}"` : ''} karaoke instrumental backing track`,
    // Fallback 1: song + artist + karaoke
    `"${songTitle}"${songArtist ? ` "${songArtist}"` : ''} karaoke`,
    // Fallback 2: just song title + karaoke
    `"${songTitle}" karaoke instrumental`,
    // Fallback 3: song title only
    `"${songTitle}" instrumental backing track`
  ];

  // Add Karafun-specific searches first (highest priority)
  const karafunTerms = (process.env.KARAFUN_CHANNEL_IDS || 'karafun').split(',');
  karafunTerms.forEach(term => {
    karafunQueries.push(`"${songTitle}"${songArtist ? ` "${songArtist}"` : ''} ${term}`);
    karafunQueries.push(`"${songTitle}" ${term} karaoke`);
    karafunQueries.push(`"${songTitle}" ${term}`);
  });

  const queries = [...karafunQueries, ...generalQueries];

  const allResults: VideoSearchResult[] = [];

  for (const query of queries) {
    try {
      const videos = await api.searchVideos(query, {
        maxResults: Math.min(options.maxResults || 10, 25),
        order: 'relevance'
      });

      // Convert to search results with scoring
      const scoredResults = videos.map(video => ({
        ...video,
        relevanceScore: calculateRelevanceScore(video, songTitle, songArtist),
        karaokeScore: calculateKaraokeScore(video, songTitle, songArtist),
        confidenceScore: 0.8 // High confidence for structured search
      }));

      allResults.push(...scoredResults);

      // If we have good results, stop searching
      if (scoredResults.some(r => r.karaokeScore > 70)) break;

    } catch (error) {
      console.error(`Search failed for query "${query}":`, error);
      continue;
    }
  }

  // Remove duplicates
  const uniqueResults = allResults.filter((result, index, self) =>
    index === self.findIndex(r => r.id === result.id)
  );

  // Apply filters
  let filteredResults = uniqueResults;
  if (options.filters) {
    const { minQuality, maxDuration, channel, hasLyrics, sortBy } = options.filters;

    filteredResults = uniqueResults.filter(result => {
      // Quality filter
      if (minQuality !== undefined && result.karaokeScore < minQuality) return false;

      // Duration filter
      if (maxDuration !== undefined) {
        const durationSeconds = parseDuration(result.duration);
        if (durationSeconds > maxDuration) return false;
      }

      // Channel filter
      if (channel && !result.channelTitle.toLowerCase().includes(channel.toLowerCase())) return false;

      return true;
    });

    // Apply sorting
    filteredResults.sort((a, b) => {
      switch (sortBy) {
        case 'viewCount':
          return b.viewCount - a.viewCount;
        case 'date':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        default:
          return b.karaokeScore - a.karaokeScore;
      }
    });
  } else {
    // Default sorting by karaoke score
    filteredResults.sort((a, b) => b.karaokeScore - a.karaokeScore);
  }

  return filteredResults.slice(0, options.maxResults || 10);
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(video: YouTubeVideo, songTitle: string, songArtist?: string): number {
  let score = 0;

  const title = video.title.toLowerCase();
  const songTitleLower = songTitle.toLowerCase();

  // Exact title match
  if (title.includes(songTitleLower)) score += 50;

  // Partial title match
  const titleWords = songTitleLower.split(/\s+/);
  const matchingWords = titleWords.filter(word =>
    word.length > 2 && title.includes(word)
  );
  score += matchingWords.length * 10;

  // Artist match
  if (songArtist) {
    const artistLower = songArtist.toLowerCase();
    if (title.includes(artistLower) || video.channelTitle.toLowerCase().includes(artistLower)) {
      score += 20;
    }
  }

  return Math.min(100, score);
}

/**
 * Create YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
}

/**
 * Create YouTube watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Singleton YouTube API instance
 */
let youtubeAPI: YouTubeAPI | null = null;

export function getYouTubeAPI(): YouTubeAPI {
  if (!youtubeAPI) {
    youtubeAPI = new YouTubeAPI();
  }
  return youtubeAPI;
}