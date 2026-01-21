'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import {
  Search,
  Music,
  Heart,
  Clock,
  Play,
  Plus,
  Crown,
  Star,
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
  last_played_at?: string;
  is_favorite?: boolean;
}

export default function MySongsPage() {
  const { toast } = useToast();
  const { organization, subscriptionTier, isLoading: authLoading, isAuthenticated, supabase } = useKaraokeAuth();

  const [loading, setLoading] = useState(true);

  // Data
  const [recentSongs, setRecentSongs] = useState<Video[]>([]);
  const [favoriteSongs, setFavoriteSongs] = useState<Video[]>([]);
  const [allSongs, setAllSongs] = useState<Video[]>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recent');

  const isPremium = subscriptionTier !== 'free';

  // Load data once authenticated
  useEffect(() => {
    if (isAuthenticated && organization && !authLoading) {
      loadUserSongs(organization.id);
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
    }
  }, [isAuthenticated, organization, authLoading]);

  const loadUserSongs = async (orgId: string) => {
    try {
      // For now, load some recent songs from the karaoke_videos table
      // In a real implementation, this would come from user preferences/history
        const { data: videos, error } = await supabase
          .from('karaoke_song_videos')
          .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Mock user-specific data - in real app this would come from user preferences
      const mockRecent = videos?.slice(0, 10).map(v => ({
        ...v,
        play_count: Math.floor(Math.random() * 20) + 1,
        last_played_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      })) || [];

      const mockFavorites = videos?.slice(10, 20).map(v => ({
        ...v,
        is_favorite: true,
        play_count: Math.floor(Math.random() * 50) + 10
      })) || [];

      setRecentSongs(mockRecent);
      setFavoriteSongs(mockFavorites);
      setAllSongs([...mockRecent, ...mockFavorites]);
    } catch (error) {
      console.error('Error loading user songs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your songs',
        variant: 'destructive'
      });
    }
  };

  const toggleFavorite = async (videoId: string, currentlyFavorite: boolean) => {
    try {
      // In a real implementation, this would update user preferences
      if (currentlyFavorite) {
        setFavoriteSongs(prev => prev.filter(v => v.id !== videoId));
        setRecentSongs(prev => prev.map(v =>
          v.id === videoId ? { ...v, is_favorite: false } : v
        ));
      } else {
        const video = allSongs.find(v => v.id === videoId);
        if (video) {
          setFavoriteSongs(prev => [...prev, { ...video, is_favorite: true }]);
          setRecentSongs(prev => prev.map(v =>
            v.id === videoId ? { ...v, is_favorite: true } : v
          ));
        }
      }

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

  const filteredSongs = (songs: Video[]) => {
    return songs.filter(song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const SongCard = ({ song, showLastPlayed = false }: { song: Video, showLastPlayed?: boolean }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-800/30 hover:bg-gray-700/30 transition-colors">
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
          {song.play_count && (
            <span className="text-gray-500 text-xs">Played {song.play_count} times</span>
          )}
          {showLastPlayed && song.last_played_at && (
            <span className="text-gray-500 text-xs">
              Last played {new Date(song.last_played_at).toLocaleDateString()}
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
  );

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="My Songs" currentPage="my-songs">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your songs...</p>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title="My Songs" currentPage="my-songs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Songs</h1>
            <p className="text-gray-400 mt-1">Your personal karaoke music library</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search your songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="recent" className="data-[state=active]:bg-pink-600">
              <Clock className="w-4 h-4 mr-2" />
              Recently Played ({recentSongs.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="data-[state=active]:bg-pink-600">
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favoriteSongs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-6">
            <Card className="karaoke-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recently Played
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSongs(recentSongs).length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchQuery ? 'No recent songs found' : 'No recently played songs'}
                    </h3>
                    <p className="text-gray-400">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : 'Songs you play will appear here'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSongs(recentSongs).map((song) => (
                      <SongCard key={song.id} song={song} showLastPlayed />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <Card className="karaoke-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Favorite Songs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSongs(favoriteSongs).length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {searchQuery ? 'No favorite songs found' : 'No favorite songs yet'}
                    </h3>
                    <p className="text-gray-400">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : 'Mark songs as favorites by clicking the heart icon'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSongs(favoriteSongs).map((song) => (
                      <SongCard key={song.id} song={song} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="karaoke-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-pink-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{allSongs.length}</p>
                  <p className="text-gray-400 text-sm">Total Songs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="karaoke-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{favoriteSongs.length}</p>
                  <p className="text-gray-400 text-sm">Favorites</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="karaoke-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Play className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {recentSongs.reduce((sum, song) => sum + (song.play_count || 0), 0)}
                  </p>
                  <p className="text-gray-400 text-sm">Total Plays</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </KaraokeLayout>
  );
}