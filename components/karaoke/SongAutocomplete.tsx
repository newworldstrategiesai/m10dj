'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Music, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';

interface SongSuggestion {
  id: string;
  title: string;
  artist: string;
  albumArt?: string | null;
  source?: 'database' | 'spotify' | 'apple_music' | 'itunes';
  popularity?: number;
}

interface SongAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (song: { title: string; artist: string; videoData?: any }) => void;
  placeholder?: string;
  organizationId?: string | null;
  className?: string;
  disabled?: boolean;
  minLength?: number;
  debounceMs?: number;
}

export default function SongAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a song...',
  organizationId,
  className,
  disabled = false,
  minLength = 2,
  debounceMs = 300
}: SongAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search songs
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't search if:
    // - Value is too short
    // - It looks like a URL
    // - Input is disabled
    if (disabled || !value || value.trim().length < minLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    // Check if it's a URL
    if (value.trim().match(/^https?:\/\//)) {
      setSuggestions([]);
      setShowSuggestions(false);
      setLoading(false);
      return;
    }

    // Debounce search
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: value.trim(),
          ...(organizationId && { organizationId }),
          limit: '10'
        });

        const response = await fetch(`/api/karaoke/search-songs?${params}`, {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Song search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, organizationId, minLength, debounceMs, disabled]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setShowSuggestions(true);
        setSelectedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: SongSuggestion) => {
    onChange(suggestion.title);
    if (onSelect) {
      onSelect({
        title: suggestion.title,
        artist: suggestion.artist,
        videoData: {
          youtube_video_id: suggestion.id, // The ID is the video ID
          youtube_video_title: suggestion.title,
          youtube_channel_name: null,
          youtube_channel_id: null,
          album_art_url: suggestion.albumArt,
          youtube_video_duration: null, // Could be added later
          is_premium: false, // Default to free
          karaoke_score: suggestion.popularity || 0
        }
      });
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'spotify':
        return '🎵';
      case 'apple_music':
        return '🍎';
      case 'itunes':
        return '🎵';
      case 'database':
        return '📊';
      default:
        return '🎵';
    }
  };

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'spotify':
        return 'Spotify';
      case 'apple_music':
        return 'Apple Music';
      case 'itunes':
        return 'iTunes';
      case 'database':
        return 'Previously requested';
      default:
        return '';
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          )}
          {!loading && value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuggestions([]);
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {!loading && !value && (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                'flex items-center gap-3',
                index === selectedIndex && 'bg-gray-50 dark:bg-gray-700'
              )}
            >
              {/* Album Art */}
              {suggestion.albumArt ? (
                <img
                  src={suggestion.albumArt}
                  alt={`${suggestion.title} by ${suggestion.artist}`}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-gray-400" />
                </div>
              )}

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {suggestion.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {suggestion.artist}
                </p>
              </div>

              {/* Source Badge */}
              {suggestion.source && (
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  <span>{getSourceIcon(suggestion.source)}</span>
                  <span className="hidden sm:inline">{getSourceLabel(suggestion.source)}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {showSuggestions && !loading && suggestions.length === 0 && value.length >= minLength && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No songs found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
}
