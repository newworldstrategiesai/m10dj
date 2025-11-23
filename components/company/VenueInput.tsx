/**
 * Smart Venue Input Component
 * Allows users to type either a venue name OR address
 * Automatically detects and fills the corresponding field
 */

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VenueResult {
  name: string;
  address: string;
  place_id: string;
  types?: string[];
  rating?: number;
}

interface VenueInputProps {
  venueName: string;
  venueAddress: string;
  onVenueNameChange: (name: string) => void;
  onVenueAddressChange: (address: string) => void;
  className?: string;
  isModal?: boolean;
  error?: string;
}

export default function VenueInput({
  venueName,
  venueAddress,
  onVenueNameChange,
  onVenueAddressChange,
  className = '',
  isModal = false,
  error
}: VenueInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<VenueResult[]>([]);
  const [selectedFromList, setSelectedFromList] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync search query with venue name or address when manually edited
  useEffect(() => {
    if (!selectedFromList) {
      // If user is typing, update search query
      setSearchQuery(venueName || venueAddress || '');
    }
  }, [venueName, venueAddress, selectedFromList]);

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
    if (!query || query.length < 2) {
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

  const handleSearchChange = (value: string) => {
    // Remove any accidental leading numbers that might be from keyboard shortcuts
    // Only remove if it's a single digit followed by a capital letter (likely accidental)
    let cleanedValue = value;
    if (/^[0-9][A-Z]/.test(value)) {
      cleanedValue = value.substring(1);
    }
    
    setSearchQuery(cleanedValue);
    setSelectedFromList(false);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If user clears the field, clear both name and address
    if (!cleanedValue.trim()) {
      onVenueNameChange('');
      onVenueAddressChange('');
      setShowResults(false);
      setResults([]);
      return;
    }

    // Detect if user is typing an address (contains numbers and common address words)
    const looksLikeAddress = /\d/.test(cleanedValue) && (
      cleanedValue.toLowerCase().includes('street') ||
      cleanedValue.toLowerCase().includes('st') ||
      cleanedValue.toLowerCase().includes('avenue') ||
      cleanedValue.toLowerCase().includes('ave') ||
      cleanedValue.toLowerCase().includes('road') ||
      cleanedValue.toLowerCase().includes('rd') ||
      cleanedValue.toLowerCase().includes('drive') ||
      cleanedValue.toLowerCase().includes('dr') ||
      cleanedValue.toLowerCase().includes('lane') ||
      cleanedValue.toLowerCase().includes('ln') ||
      cleanedValue.toLowerCase().includes('boulevard') ||
      cleanedValue.toLowerCase().includes('blvd') ||
      cleanedValue.toLowerCase().includes('memphis') ||
      cleanedValue.toLowerCase().includes('tn') ||
      cleanedValue.toLowerCase().includes('tennessee')
    );

    // If it looks like an address, update address field directly
    if (looksLikeAddress && cleanedValue.length > 10) {
      onVenueAddressChange(cleanedValue);
      // Still search to see if we can find matching venue name
      searchTimeoutRef.current = setTimeout(() => {
        searchVenues(cleanedValue);
      }, 500);
    } else {
      // Otherwise, treat as venue name search
      onVenueNameChange(cleanedValue);
      // Debounce search
      searchTimeoutRef.current = setTimeout(() => {
        searchVenues(cleanedValue);
      }, 500);
    }
  };

  const handleSelectVenue = (venue: VenueResult) => {
    onVenueNameChange(venue.name);
    onVenueAddressChange(venue.address);
    setSearchQuery(''); // Clear search query so name doesn't appear twice
    setSelectedFromList(true);
    setShowResults(false);
    setResults([]);
  };

  // When search results come back and we have an address but no venue name,
  // check if any result matches the address and auto-fill the venue name
  useEffect(() => {
    if (results.length > 0 && venueAddress && !venueName && !selectedFromList) {
      // If we have an address but no name, check if any result matches
      const matchingVenue = results.find(v => {
        const venueAddr = v.address.toLowerCase();
        const currentAddr = venueAddress.toLowerCase();
        // Check if addresses match (within reason - allow partial matches)
        return venueAddr.includes(currentAddr) || currentAddr.includes(venueAddr);
      });
      if (matchingVenue) {
        // Auto-fill venue name from matching result
        onVenueNameChange(matchingVenue.name);
        setSelectedFromList(true);
      }
    }
  }, [results, venueAddress, venueName, selectedFromList, onVenueNameChange]);

  const handleManualEdit = (field: 'name' | 'address', value: string) => {
    if (field === 'name') {
      onVenueNameChange(value);
      handleSearchChange(value);
    } else {
      onVenueAddressChange(value);
      // If address is manually edited, try to match it to a venue
      if (value.length > 10) {
        handleSearchChange(value);
      }
    }
  };

  const hasAutoFilled = selectedFromList && (venueName && venueAddress);

  const handleClearVenue = () => {
    onVenueNameChange('');
    onVenueAddressChange('');
    setSearchQuery('');
    setSelectedFromList(false);
    setShowResults(false);
    setResults([]);
    // Focus the search input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div ref={containerRef} className={`space-y-3 ${className}`}>
      {/* Main Search Input - Only show when venue is not selected */}
      {!hasAutoFilled && (
        <div className="relative">
          <label className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
            Venue/Location
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery || venueName || venueAddress}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (results.length > 0) {
                  setShowResults(true);
                }
              }}
              className={`w-full px-4 ${isModal ? 'py-2 text-sm' : 'py-3'} pr-10 border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-transparent'}`}
              placeholder="Venue name or full address (e.g., 'Peabody' or '149 Union Ave, Memphis')"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {searching && (
                <Loader2 className="h-4 w-4 text-brand animate-spin" />
              )}
              {!searching && (
                <MapPin className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>

          {/* Results Dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {results.map((venue, index) => (
                <button
                  key={venue.place_id || index}
                  type="button"
                  onClick={() => handleSelectVenue(venue)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-brand dark:text-brand-gold flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {venue.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {venue.address}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show separate fields when venue name or address has been entered */}
      {(venueName || venueAddress) && (
        <div className="space-y-2">
          {hasAutoFilled && (
            <div className="flex items-center justify-between mb-2">
              <label className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 font-inter`}>
                Venue/Location
              </label>
              <button
                type="button"
                onClick={handleClearVenue}
                className={`${isModal ? 'text-xs' : 'text-sm'} text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors`}
              >
                Change venue
              </button>
            </div>
          )}
          <div className={`${hasAutoFilled ? '' : 'pt-2 border-t border-gray-200 dark:border-gray-700'} space-y-2`}>
            <div>
              <label className={`block ${isModal ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300 mb-1`}>
                Venue Name
                {selectedFromList && venueName && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                    ✓ Auto-filled
                  </span>
                )}
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => handleManualEdit('name', e.target.value)}
                className={`w-full px-4 ${isModal ? 'py-2 text-sm' : 'py-3'} border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-transparent'}`}
                placeholder="Venue name"
              />
            </div>

            <div>
              <label className={`block ${isModal ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300 mb-1`}>
                Venue Address
                {selectedFromList && venueAddress && (
                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-normal">
                    ✓ Auto-filled
                  </span>
                )}
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => handleManualEdit('address', e.target.value)}
                className={`w-full px-4 ${isModal ? 'py-2 text-sm' : 'py-3'} border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-transparent'}`}
                placeholder="Full address"
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
          <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <p className={`${isModal ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400`}>
        {!hasAutoFilled ? (
          <>
            Type a venue name (e.g., &quot;Peabody&quot;) or full address to see suggestions
          </>
        ) : (
          <>
            ✓ Address auto-filled! You can edit either field if needed.
          </>
        )}
      </p>
    </div>
  );
}

