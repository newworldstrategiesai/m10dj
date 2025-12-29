/**
 * Track string normalization utilities for Serato play matching
 */

/**
 * Normalize a track string for matching
 * - Convert to lowercase
 * - Trim whitespace
 * - Remove punctuation
 * - Normalize whitespace
 * - Remove common prefixes/suffixes (feat, ft, remix, etc.)
 */
export function normalizeTrackString(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')           // Remove punctuation
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/\b(feat|ft|featuring)\s+/gi, '')  // Remove "feat" variations
    .replace(/\s*\(.*?\)\s*/g, '')     // Remove parenthetical content
    .replace(/\s*\[.*?\]\s*/g, '')     // Remove bracketed content
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create matrix
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // substitution
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity between two strings
 * Returns a value between 0 and 1 (1 = identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Check if two track strings match (exact or fuzzy)
 * @param str1 First string (normalized)
 * @param str2 Second string (normalized)
 * @param threshold Similarity threshold (0-1, default 0.85)
 */
export function stringsMatch(
  str1: string,
  str2: string,
  threshold: number = 0.85
): boolean {
  // Exact match
  if (str1 === str2) return true;

  // Fuzzy match
  const similarity = calculateSimilarity(str1, str2);
  return similarity >= threshold;
}

/**
 * Check if a track matches a request (both artist and title)
 */
export function trackMatchesRequest(
  trackArtist: string,
  trackTitle: string,
  requestArtist: string,
  requestTitle: string,
  threshold: number = 0.85
): { matches: boolean; artistSimilarity: number; titleSimilarity: number } {
  // Normalize all strings
  const normTrackArtist = normalizeTrackString(trackArtist);
  const normTrackTitle = normalizeTrackString(trackTitle);
  const normRequestArtist = normalizeTrackString(requestArtist);
  const normRequestTitle = normalizeTrackString(requestTitle);

  // Calculate similarities
  const artistSimilarity = calculateSimilarity(normTrackArtist, normRequestArtist);
  const titleSimilarity = calculateSimilarity(normTrackTitle, normRequestTitle);

  // Both must meet threshold
  const matches = artistSimilarity >= threshold && titleSimilarity >= threshold;

  return {
    matches,
    artistSimilarity,
    titleSimilarity
  };
}

/**
 * Find best matching request from a list
 */
export function findBestMatch<T extends { normalized_artist?: string; normalized_title?: string }>(
  trackArtist: string,
  trackTitle: string,
  requests: T[],
  threshold: number = 0.85
): { request: T; artistSimilarity: number; titleSimilarity: number } | null {
  const normTrackArtist = normalizeTrackString(trackArtist);
  const normTrackTitle = normalizeTrackString(trackTitle);

  let bestMatch: T | null = null;
  let bestScore = 0;
  let bestArtistSim = 0;
  let bestTitleSim = 0;

  for (const request of requests) {
    if (!request.normalized_artist || !request.normalized_title) continue;

    const artistSimilarity = calculateSimilarity(normTrackArtist, request.normalized_artist);
    const titleSimilarity = calculateSimilarity(normTrackTitle, request.normalized_title);

    // Both must meet threshold
    if (artistSimilarity < threshold || titleSimilarity < threshold) continue;

    // Combined score (weighted average)
    const score = (artistSimilarity + titleSimilarity) / 2;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = request;
      bestArtistSim = artistSimilarity;
      bestTitleSim = titleSimilarity;
    }
  }

  if (!bestMatch) return null;

  return {
    request: bestMatch,
    artistSimilarity: bestArtistSim,
    titleSimilarity: bestTitleSim
  };
}

