import { useState, useEffect, useCallback } from 'react';

export function useSongSearch(query, organizationId = null, minLength = 2) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchSongs = useCallback(async (searchQuery, orgId) => {
    if (!searchQuery || searchQuery.trim().length < minLength) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Don't search if it looks like a URL
    if (searchQuery.trim().match(/^https?:\/\//)) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crowd-request/search-songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: searchQuery.trim(),
          organizationId: orgId 
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Song search error:', err);
      setError(err.message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [minLength]);

  // Debounce the search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSongs(query, organizationId);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, organizationId, searchSongs]);

  return { suggestions, loading, error, searchSongs };
}

