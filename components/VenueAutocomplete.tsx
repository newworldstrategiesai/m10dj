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

  const searchVenues = async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(`/api/google/venue-lookup?query=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.results) {
        setResults(data.results);
        setShowResults(data.results.length > 0);
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
    onVenueNameChange(venue.name);
    onVenueAddressChange(venue.address);
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

