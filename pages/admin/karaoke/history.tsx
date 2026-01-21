'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import {
  Search,
  Clock,
  Play,
  Heart,
  Crown,
  Calendar,
  Music,
  Trash2
} from 'lucide-react';
import { useKaraokeAuth } from '@/hooks/useKaraokeAuth';

interface Video {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  duration: string;
  is_premium?: boolean;
  category?: string;
  played_at: string;
  play_count?: number;
  is_favorite?: boolean;
}

export default function HistoryPage() {
  const { toast } = useToast();
  const { organization, subscriptionTier, isLoading: authLoading, isAuthenticated, supabase } = useKaraokeAuth();

  const [loading, setLoading] = useState(true);
  const [historySongs, setHistorySongs] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month

  const isPremium = subscriptionTier !== 'free';

  // Load history once authenticated
  useEffect(() => {
    if (isAuthenticated && organization && !authLoading) {
      loadHistory(organization.id);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, organization, authLoading]);

  const loadHistory = async (orgId: string) => {
    try {
      // For now, load songs from karaoke_videos with mock play history
      // In a real implementation, this would come from user play history
        const { data: videos, error } = await supabase
          .from('karaoke_song_videos')
          .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Mock history data - in real app this would come from play history table
      const mockHistory = videos?.map((v, index) => ({
        ...v,
        played_at: new Date(Date.now() - index * 2 * 60 * 60 * 1000).toISOString(), // Spread over last 100 hours
        play_count: Math.floor(Math.random() * 10) + 1,
        is_favorite: Math.random() > 0.7
      })) || [];

      setHistorySongs(mockHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your history',
        variant: 'destructive'
      });
    }
  };

  const toggleFavorite = async (videoId: string, currentlyFavorite: boolean) => {
    try {
      setHistorySongs(prev => prev.map(song =>
        song.id === videoId ? { ...song, is_favorite: !currentlyFavorite } : song
      ));

      toast({
        title: currentlyFavorite ? 'Removed from favorites' : 'Added to favorites',
        description: currentlyFavorite
          ? 'Song removed from your favorites'
          : 'Song added to your favorites'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorites',
        variant: 'destructive'
      });
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your play history? This action cannot be undone.')) return;

    try {
      // In a real implementation, this would clear the user's play history
      setHistorySongs([]);
      toast({
        title: 'History cleared',
        description: 'Your play history has been cleared'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear history',
        variant: 'destructive'
      });
    }
  };

  const filteredSongs = historySongs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         song.artist.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (timeFilter === 'all') return true;

    const playedAt = new Date(song.played_at);
    const now = new Date();

    switch (timeFilter) {
      case 'today':
        return playedAt.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return playedAt >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return playedAt >= monthAgo;
      default:
        return true;
    }
  });

  const formatPlayedAt = (playedAt: string) => {
    const date = new Date(playedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      return `${Math.floor(diffMs / (1000 * 60))} minutes ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} hours ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="History" currentPage="history">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your history...</p>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title="History" currentPage="history">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Play History</h1>
            <p className="text-gray-400 mt-1">Your recently played karaoke songs</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">{historySongs.length} songs played</span>
            </div>
            {historySongs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="text-red-400 border-red-500/50 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search your history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>

          {/* Time Filter */}
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History List */}
        <Card className="karaoke-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Recently Played ({filteredSongs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSongs.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery || timeFilter !== 'all' ? 'No songs found' : 'No play history yet'}
                </h3>
                <p className="text-gray-400">
                  {searchQuery || timeFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Songs you play will appear here. Start singing to build your history!'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSongs.map((song) => (
                  <div
                    key={`${song.id}-${song.played_at}`}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <img
                      src={song.thumbnail_url}
                      alt={song.title}
                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                    />

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white truncate">{song.title}</h4>
                        {song.is_premium && (
                          <Badge variant="outline" className="border-pink-500/50 text-pink-400 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-gray-500 text-xs">{song.duration}</span>
                        <span className="text-gray-500 text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatPlayedAt(song.played_at)}
                        </span>
                        {song.play_count && song.play_count > 1 && (
                          <span className="text-gray-500 text-xs">
                            Played {song.play_count} times
                          </span>
                        )}
                      </div>
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
                        variant="ghost"
                        onClick={() => toggleFavorite(song.id, song.is_favorite || false)}
                        className={song.is_favorite ? "text-red-400 hover:text-red-300" : "text-gray-400 hover:text-white"}
                      >
                        <Heart className={`w-4 h-4 ${song.is_favorite ? 'fill-current' : ''}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {historySongs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="karaoke-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Music className="w-8 h-8 text-pink-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">{historySongs.length}</p>
                    <p className="text-gray-400 text-sm">Songs Played</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="karaoke-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {historySongs.filter(song => song.is_favorite).length}
                    </p>
                    <p className="text-gray-400 text-sm">Favorites</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="karaoke-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {historySongs.filter(song => song.is_premium).length}
                    </p>
                    <p className="text-gray-400 text-sm">Premium Songs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </KaraokeLayout>
  );
}