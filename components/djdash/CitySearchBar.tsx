'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, X } from 'lucide-react';
import { findCity, searchCities, type CityInfo } from '@/utils/djdash/city-lookup';

interface CitySearchBarProps {
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  onCitySelect?: (city: CityInfo) => void;
}

export default function CitySearchBar({
  placeholder = 'Enter your city or zip code',
  className = '',
  showSuggestions = true,
  onCitySelect,
}: CitySearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CityInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update suggestions as user types
  useEffect(() => {
    if (query.trim().length === 0) {
      setSuggestions([]);
      setShowDropdown(false);
      setError(null);
      return;
    }

    const matches = searchCities(query, 5);
    setSuggestions(matches);
    setShowDropdown(matches.length > 0 && showSuggestions);
    setSelectedIndex(-1);
    setError(null);
  }, [query, showSuggestions]);

  // Handle clicks outside the component
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleCitySelect(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          handleCitySelect(suggestions[0]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleCitySelect = (city: CityInfo) => {
    setQuery(`${city.name}, ${city.stateAbbr}`);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setError(null);

    if (onCitySelect) {
      onCitySelect(city);
    } else {
      // Default behavior: navigate to city page
      router.push(`/djdash/find-dj/${city.slug}`);
    }
  };

  const handleSearch = () => {
    if (!query.trim()) {
      return;
    }

    const city = findCity(query);
    
    if (city) {
      handleCitySelect(city);
    } else {
      setError('City not found. Please try a different city or zip code.');
      setShowDropdown(false);
      
      // Fallback: try to search anyway or show all cities
      // For now, we'll just show an error and suggest popular cities
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setError(null);
    inputRef.current?.focus();
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder={placeholder}
            className={`w-full pl-12 pr-10 py-4 bg-transparent border ${
              error
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 ${
              error
                ? 'focus:ring-red-500 dark:focus:ring-red-500'
                : 'focus:ring-blue-500 dark:focus:ring-blue-400'
            } transition-all`}
            aria-label="Search for a city or zip code"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="city-suggestions"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap"
          aria-label="Search for DJs"
        >
          <Search className="mr-2 w-5 h-5" />
          Find DJs
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400 z-50">
          {error}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showDropdown && suggestions.length > 0 && !error && (
        <div
          ref={dropdownRef}
          id="city-suggestions"
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50"
          role="listbox"
        >
          {suggestions.map((city, index) => (
            <button
              key={city.slug}
              type="button"
              onClick={() => handleCitySelect(city)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-gray-700'
                  : ''
              } ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === suggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-100 dark:border-gray-700'
              }`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {city.name}, {city.stateAbbr}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {city.state}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Popular Cities Hint */}
      {!query && !showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium mb-2">Popular cities:</div>
          <div className="flex flex-wrap gap-2">
            {['Memphis, TN', 'Nashville, TN', 'Atlanta, GA', 'Los Angeles, CA', 'New York, NY'].map((cityText) => (
              <button
                key={cityText}
                type="button"
                onClick={() => {
                  const city = findCity(cityText);
                  if (city) {
                    handleCitySelect(city);
                  }
                }}
                className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-xs"
              >
                {cityText}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

