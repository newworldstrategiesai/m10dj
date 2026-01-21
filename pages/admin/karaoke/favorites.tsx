'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import {
  Search,
  Heart,
  Play,
  Plus,
  Crown,
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
  play_count?: number;
  favorited_at?: string;
}

export default function FavoritesPage() {
  const { toast } = useToast();
  const { organization, subscriptionTier, isLoading: authLoading, isAuthenticated, supabase } = useKaraokeAuth();

  const [loading, setLoading] = useState(true);
  const [favoriteSongs, setFavoriteSongs] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const isPremium = subscriptionTier !== 'free';

  // Load favorites once authenticated
  useEffect(() => {
    if (isAuthenticated && organization && !authLoading) {
      loadFavorites(organization.id);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, organization, authLoading]);

  const loadFavorites = async (orgId: string) => {
    try {
      // For now, load some songs from karaoke_videos and mark some as favorites
      // In a real implementation, this would come from user preferences
        const { data: videos, error } = await supabase
          .from('karaoke_song_videos')
          .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) throw error;

      // Mock favorites - in real app this would come from user preferences
      const mockFavorites = videos?.slice(0, 15).map((v, index) => ({
        ...v,
        is_favorite: true,
        favorited_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        play_count: Math.floor(Math.random() * 50) + 10
      })) || [];

      setFavoriteSongs(mockFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your favorites',
        variant: 'destructive'
      });
    }
  };

  const removeFavorite = async (videoId: string) => {
    try {
      // Update local state
      setFavoriteSongs(prev => prev.filter(v => v.id !== videoId));

      toast({
        title: 'Removed from favorites',
        description: 'Song removed from your favorites'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove from favorites',
        variant: 'destructive'
      });
    }
  };

  const filteredSongs = favoriteSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="Favorites" currentPage="favorites">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your favorites...</p>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title="Favorites" currentPage="favorites">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Favorite Songs</h1>
            <p className="text-gray-400 mt-1">Your most loved karaoke tracks</p>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400 fill-current" />
            <span className="text-white font-semibold">{favoriteSongs.length} favorites</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search your favorites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Favorites List */}
        <Card className="karaoke-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              Your Favorite Songs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSongs.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {searchQuery ? 'No favorites found' : 'No favorite songs yet'}
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Songs you mark as favorites will appear here. Start exploring and save your favorite tracks!'
                  }
                </p>
                <Button
                  className="karaoke-btn-primary"
                  onClick={() => window.history.back()}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Browse Songs
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors"
                  >
                    {/* Thumbnail */}
                    <img
                      src={song.thumbnail_url}
                      alt={song.title}
                      className="w-14 h-14 rounded object-cover flex-shrink-0"
                    />

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white text-lg truncate">{song.title}</h4>
                        {song.is_premium && (
                          <Badge variant="outline" className="border-pink-500/50 text-pink-400">
                            <Crown className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-gray-500 text-xs">{song.duration}</span>
                        {song.play_count && (
                          <span className="text-gray-500 text-xs">Played {song.play_count} times</span>
                        )}
                        {song.favorited_at && (
                          <span className="text-gray-500 text-xs">
                            Favorited {new Date(song.favorited_at).toLocaleDateString()}
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
                        onClick={() => removeFavorite(song.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {favoriteSongs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="karaoke-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-red-400" />
                  <div>
                    <p className="text-xl font-bold text-white">{favoriteSongs.length}</p>
                    <p className="text-gray-400 text-sm">Favorites</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="karaoke-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Play className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-xl font-bold text-white">
                      {favoriteSongs.reduce((sum, song) => sum + (song.play_count || 0), 0)}
                    </p>
                    <p className="text-gray-400 text-sm">Total Plays</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="karaoke-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-pink-400" />
                  <div>
                    <p className="text-xl font-bold text-white">
                      {favoriteSongs.filter(song => song.is_premium).length}
                    </p>
                    <p className="text-gray-400 text-sm">Premium Songs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="karaoke-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Music className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-xl font-bold text-white">
                      {new Set(favoriteSongs.map(song => song.category).filter(Boolean)).size}
                    </p>
                    <p className="text-gray-400 text-sm">Categories</p>
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