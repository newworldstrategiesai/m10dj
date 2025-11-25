/**
 * Venue Autocomplete Component
 * Searches Google Places API for venues and auto-fills address
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader, Search, CheckCircle } from 'lucide-react';

interface VenueResult {
  name: string;
  address: string;
  place_id: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
}

interface VenueAutocompleteProps {
  venueName: string;
  venueAddress: string;
  onVenueNameChange: (name: string) => void;
  onVenueAddressChange: (address: string) => void;
  className?: string;
}

export default function VenueAutocomplete({
  venueName,
  venueAddress,
  onVenueNameChange,
  onVenueAddressChange,
  className = ''
}: VenueAutocompleteProps) {
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<VenueResult[]>([]);
  const [selectedFromList, setSelectedFromList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Extract searchable terms from a venue name
   * Handles "The Elliot (formerly At Pin Oak)" -> ["the elliot", "pin oak"]
   */
  const extractSearchableTerms = (venueName: string): string[] => {
    if (!venueName) return [];
    
    const terms: string[] = [];
    const normalized = venueName.toLowerCase().trim();
    
    // Extract main name (remove parenthetical content)
    const mainName = normalized.replace(/\s*\([^)]*\)\s*/g, '').trim();
    if (mainName) {
      terms.push(mainName);
    }
    
    // Extract "formerly" names from parentheses
    const formerlyMatch = normalized.match(/\(formerly\s+(?:at\s+)?([^)]+)\)/i);
    if (formerlyMatch && formerlyMatch[1]) {
      const formerlyName = formerlyMatch[1].trim().replace(/^at\s+/i, '').trim();
      if (formerlyName) {
        terms.push(formerlyName);
      }
    }
    
    // Also try to extract any parenthetical content that might be an old name
    const parentheticalMatch = normalized.match(/\(([^)]+)\)/);
    if (parentheticalMatch && parentheticalMatch[1]) {
      const parentheticalContent = parentheticalMatch[1].trim();
      // If it contains "formerly" or "at", extract the name part
      if (/formerly|at/i.test(parentheticalContent)) {
        const namePart = parentheticalContent.replace(/^(?:formerly\s+)?(?:at\s+)?/i, '').trim();
        if (namePart && namePart.length > 2) {
          terms.push(namePart);
        }
      } else if (parentheticalContent.length > 2) {
        // If it's not a "formerly" pattern, it might still be searchable
        terms.push(parentheticalContent);
      }
    }
    
    return terms.filter(term => term.length >= 2);
  };

  // Auto-search when component receives a venue name but no address
  useEffect(() => {
    if (venueName && !venueAddress && venueName.length >= 3) {
      // Extract searchable terms and use the most relevant one for search
      const searchableTerms = extractSearchableTerms(venueName);
      let searchTerm = venueName;
      
      // If we have multiple terms (e.g., "The Elliot (formerly At Pin Oak)"),
      // prioritize the "formerly" name as it's more likely what Google knows
      if (searchableTerms.length > 1) {
        // Use the last term (usually the "formerly" name)
        searchTerm = searchableTerms[searchableTerms.length - 1];
      } else if (searchableTerms.length === 1) {
        searchTerm = searchableTerms[0];
      }
      
      // Only search if we haven't already searched for this venue name
      const timeoutId = setTimeout(() => {
        searchVenues(searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueName, venueAddress]);

  const searchVenues = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);

    try {
      // Extract searchable terms from the query (handles "The Elliot (formerly At Pin Oak)")
      const searchableTerms = extractSearchableTerms(query);
      
      // Use the most relevant search term:
      // 1. If query has parenthetical content, try the "formerly" name first (more likely to find results)
      // 2. Otherwise, use the main name
      let searchQuery = query;
      if (searchableTerms.length > 1) {
        // If we have multiple terms (main name + formerly name), try the formerly name first
        // as it's more likely to be the name Google knows
        searchQuery = searchableTerms[searchableTerms.length - 1]; // Last term is usually the "formerly" name
      } else if (searchableTerms.length === 1) {
        searchQuery = searchableTerms[0];
      }
      
      const response = await fetch(`/api/google/venue-lookup?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.success && data.results) {
        setResults(data.results);
        setShowResults(data.results.length > 0);
        
        // If we searched with a "formerly" name but got no results, try the main name
        if (data.results.length === 0 && searchableTerms.length > 1 && searchQuery !== searchableTerms[0]) {
          // Try searching with the main name
          const mainNameResponse = await fetch(`/api/google/venue-lookup?query=${encodeURIComponent(searchableTerms[0])}`);
          const mainNameData = await mainNameResponse.json();
          
          if (mainNameData.success && mainNameData.results && mainNameData.results.length > 0) {
            setResults(mainNameData.results);
            setShowResults(true);
          }
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Venue search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setSearching(false);
    }
  };

  const handleVenueNameChange = (value: string) => {
    onVenueNameChange(value);
    setSelectedFromList(false);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchVenues(value);
    }, 500);
  };

  const handleSelectVenue = (venue: VenueResult) => {
    // Preserve the original venue name if it exists and has parenthetical content
    // This handles cases like "The Elliot (formerly At Pin Oak)" where we searched
    // for "Pin Oak" but want to keep "The Elliot (formerly At Pin Oak)" as the name
    if (venueName && venueName.includes('(') && venueName.includes(')')) {
      // Keep the original venue name, only update the address
      onVenueAddressChange(venue.address);
    } else {
      // If no original name with parenthetical content, use the selected venue's name
      onVenueNameChange(venue.name);
      onVenueAddressChange(venue.address);
    }
    setSelectedFromList(true);
    setShowResults(false);
    setResults([]);
  };

  const hasAutoFilledAddress = selectedFromList && venueAddress;

  return (
    <div ref={containerRef} className={`space-y-4 ${className}`}>
      {/* Venue Name Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Venue Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={venueName}
            onChange={(e) => handleVenueNameChange(e.target.value)}
            placeholder="The Peabody, Dixon Gallery, etc."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          {searching && (
            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600 animate-spin" />
          )}
          {hasAutoFilledAddress && !searching && (
            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
          )}
        </div>

        {/* Results Dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map((venue, index) => (
              <button
                key={venue.place_id || index}
                type="button"
                onClick={() => handleSelectVenue(venue)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {venue.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {venue.address}
                    </p>
                    {venue.rating && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        ⭐ {venue.rating} {venue.user_ratings_total && `(${venue.user_ratings_total} reviews)`}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Venue Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Venue Address
          {hasAutoFilledAddress && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
              ✓ Auto-filled from Google
            </span>
          )}
        </label>
        <input
          type="text"
          value={venueAddress}
          onChange={(e) => {
            onVenueAddressChange(e.target.value);
            setSelectedFromList(false);
          }}
          placeholder="Full address"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Type a venue name above to auto-fill the address, or enter it manually
        </p>
      </div>
    </div>
  );
}

