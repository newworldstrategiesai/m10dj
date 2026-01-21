'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  Search,
  Music,
  Play,
  Plus,
  Crown,
  Filter,
  X,
  Clock
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getCurrentOrganization } from '@/utils/organization-context';

interface Video {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration: string;
  is_premium?: boolean;
  category?: string;
  created_at: string;
}

interface SongBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToQueue?: (video: Video) => void;
  mode?: 'queue' | 'playlist'; // Default to queue mode
}

export default function SongBrowser({ isOpen, onClose, onAddToQueue, mode = 'queue' }: SongBrowserProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);

  const isPremium = subscriptionTier !== 'free';

  const categories = [
    { id: 'all', label: 'All Songs', count: 0 },
    { id: 'pop', label: 'Pop', count: 0 },
    { id: 'rock', label: 'Rock', count: 0 },
    { id: 'country', label: 'Country', count: 0 },
    { id: 'rb', label: 'R&B', count: 0 },
    { id: 'hiphop', label: 'Hip Hop', count: 0 },
    { id: '90s', label: '90s', count: 0 },
    { id: '80s', label: '80s', count: 0 },
    { id: 'classics', label: 'Classics', count: 0 }
  ];

  // Load organization
  useEffect(() => {
    async function loadOrganization() {
      try {
        const org = await getCurrentOrganization(supabase);
        if (org) {
          setOrganization(org);
          setSubscriptionTier(org.subscription_tier || 'free');
        }
      } catch (error) {
        console.error('Error loading organization:', error);
      }
    }

    if (isOpen) {
      loadOrganization();
    }
  }, [isOpen]);

  // Search songs
  const searchSongs = async (query: string = searchQuery, category: string = selectedCategory, premiumOnly: boolean = showPremiumOnly) => {
    if (!organization) return;

    setLoading(true);
    try {
      const response = await fetch('/api/karaoke/search-songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          organizationId: organization.id,
          category: category !== 'all' ? category : undefined,
          isPremium: premiumOnly || undefined,
          limit: 50
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.songs || []);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching songs:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen && organization) {
        searchSongs();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, showPremiumOnly, isOpen, organization]);

  const handleAddToQueue = async (video: Video) => {
    if (onAddToQueue) {
      onAddToQueue(video);
      toast({
        title: 'Added to queue',
        description: `"${video.title}" has been added to your queue`
      });
    } else {
      // Fallback: try to add to queue via API
      try {
        const response = await fetch('/api/karaoke/queue/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: organization.id,
            videoId: video.id
          })
        });

        if (response.ok) {
          toast({
            title: 'Added to queue',
            description: `"${video.title}" has been added to your queue`
          });
        } else {
          throw new Error('Failed to add to queue');
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add song to queue',
          variant: 'destructive'
        });
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setShowPremiumOnly(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            {mode === 'queue' ? 'Add Songs to Queue' : 'Browse Songs'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search songs, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-800/50 border border-gray-700 rounded px-3 py-1 text-white text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Premium Filter */}
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPremiumOnly}
                  onChange={(e) => setShowPremiumOnly(e.target.checked)}
                  className="rounded"
                />
                <Crown className="w-4 h-4 text-pink-400" />
                Premium only
              </label>

              {/* Clear Filters */}
              {(searchQuery || selectedCategory !== 'all' || showPremiumOnly) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Searching songs...</p>
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? 'No songs found' : 'Search for songs'}
                </h3>
                <p className="text-gray-400">
                  {searchQuery
                    ? `Try adjusting your search terms or filters`
                    : 'Enter a song title, artist, or keyword to find karaoke tracks'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white truncate">{video.title}</h4>
                        {video.is_premium && (
                          <Badge variant="outline" className="border-pink-500/50 text-pink-400 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{video.artist}</p>
                      {video.category && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {video.category}
                        </Badge>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      {video.duration}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-pink-400 hover:text-pink-300"
                      >
                        <Play className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleAddToQueue(video)}
                        disabled={video.is_premium && !isPremium}
                        className="karaoke-btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {mode === 'queue' ? 'Add to Queue' : 'Select'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with stats */}
          {!loading && searchResults.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400">
                Showing {searchResults.length} songs
                {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.label}`}
                {showPremiumOnly && ' (Premium only)'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}