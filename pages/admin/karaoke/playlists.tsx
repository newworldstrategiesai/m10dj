'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/Toasts/use-toast';
import KaraokeLayout from '@/components/karaoke/KaraokeLayout';
import {
  Plus,
  Search,
  Play,
  Edit3,
  Trash2,
  Music,
  Clock,
  Heart,
  Crown,
  Lock,
  Users,
  Filter,
  Grid,
  List,
  Sparkles,
  Shuffle,
  MoreHorizontal,
  Share,
  Download
} from 'lucide-react';
import { useKaraokeAuth } from '@/hooks/useKaraokeAuth';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  video_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  video_count?: number;
}

export default function KaraokePlaylistsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, organization, subscriptionTier, isLoading: authLoading, isAuthenticated, supabase } = useKaraokeAuth();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [newPlaylistIsPublic, setNewPlaylistIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  // New state for modern UI features
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'songs'>('recent');
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredPlaylist, setHoveredPlaylist] = useState<string | null>(null);

  const isPremium = subscriptionTier !== 'free';

  const loadPlaylists = useCallback(async (orgId: string) => {
    try {
      const { data: playlistsData, error } = await supabase
        .from('user_playlists')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add video count for each playlist
      const playlistsWithCount = (playlistsData || []).map((playlist: any) => ({
        ...playlist,
        video_count: (playlist.video_ids as any[])?.length || 0
      }));

      setPlaylists(playlistsWithCount);
      setLoading(false);
    } catch (error) {
      console.error('Error loading playlists:', error);
      toast({
        title: 'Error',
        description: 'Failed to load playlists',
        variant: 'destructive'
      });
      setLoading(false);
    }
  }, [supabase, toast]);

  // Load playlists once authenticated
  useEffect(() => {
    if (isAuthenticated && organization && !authLoading) {
      loadPlaylists(organization.id);
    } else if (!authLoading && (!isAuthenticated || !organization)) {
      setLoading(false);
    }
  }, [isAuthenticated, organization, authLoading, loadPlaylists]);

  const createPlaylist = async () => {
    if (!organization || !user || !newPlaylistName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'create',
          name: newPlaylistName.trim(),
          description: newPlaylistDescription.trim(),
          isPublic: newPlaylistIsPublic
        })
      });

      if (!response.ok) throw new Error('Failed to create playlist');

      const result = await response.json();

      // Add the new playlist to the list
      setPlaylists(prev => [{
        ...result.playlist,
        video_count: 0
      }, ...prev]);

      // Reset form
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setNewPlaylistIsPublic(false);
      setShowCreateModal(false);

      toast({
        title: 'Success',
        description: 'Playlist created successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create playlist',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const response = await fetch('/api/karaoke/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          action: 'delete',
          playlistId
        })
      });

      if (!response.ok) throw new Error('Failed to delete playlist');

      // Remove from list
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));

      toast({
        title: 'Success',
        description: 'Playlist deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete playlist',
        variant: 'destructive'
      });
    }
  };

  // Enhanced filtering and sorting logic
  const filteredAndSortedPlaylists = playlists
    .filter(playlist => {
      // Text search
      const matchesSearch = playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by privacy
      const matchesFilter = filterBy === 'all' ||
        (filterBy === 'public' && playlist.is_public) ||
        (filterBy === 'private' && !playlist.is_public);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'songs':
          return (b.video_count || 0) - (a.video_count || 0);
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="Playlists" currentPage="playlists">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-300 font-medium">Loading your playlists...</p>
            </div>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title="Playlists" currentPage="playlists">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900">
        {/* Hero Header Section */}
        <div className="relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-blue-600/20 animate-pulse"></div>

          {/* Floating Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>

          <div className="relative z-10 p-8 md:p-12">
            <div className="max-w-7xl mx-auto">
              {/* Header Content */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                        Your Playlists
                      </h1>
                      <p className="text-gray-400 text-lg mt-1">
                        {filteredAndSortedPlaylists.length} playlist{filteredAndSortedPlaylists.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {isPremium && (
                    <div className="flex items-center gap-2 text-sm text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full w-fit">
                      <Crown className="w-4 h-4" />
                      <span>Premium Features Unlocked</span>
                    </div>
                  )}
                </div>

                {/* Create Button */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <Button className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                      <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Create Playlist
                    </Button>
                  </DialogTrigger>

                  {/* Modern Create Modal */}
                  <DialogContent className="sm:max-w-lg bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 shadow-2xl">
                    <DialogHeader className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white">Create New Playlist</DialogTitle>
                      </div>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          Playlist Name *
                        </label>
                        <Input
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="e.g., Wedding Reception Hits, 80s Karaoke Night..."
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-300">Description</label>
                        <Input
                          value={newPlaylistDescription}
                          onChange={(e) => setNewPlaylistDescription(e.target.value)}
                          placeholder="What's this playlist about?"
                          className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 transition-colors"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-white font-medium">Make Public</p>
                            <p className="text-gray-400 text-sm">Allow others to discover and play</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={newPlaylistIsPublic}
                          onChange={(e) => setNewPlaylistIsPublic(e.target.checked)}
                          className="w-5 h-5 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateModal(false)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createPlaylist}
                          disabled={!newPlaylistName.trim() || creating}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold px-6"
                        >
                          {creating ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Create Playlist
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search your playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 rounded-xl focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-800/50 rounded-xl p-1 border border-gray-700/50">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'grid'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === 'list'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                >
                  <option value="recent">Recently Created</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="songs">Most Songs</option>
                </select>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    showFilters || filterBy !== 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                  } border border-gray-700/50`}
                >
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 flex flex-wrap gap-2 animate-in slide-in-from-top-2">
                {[
                  { value: 'all', label: 'All Playlists' },
                  { value: 'public', label: 'Public Only' },
                  { value: 'private', label: 'Private Only' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterBy(filter.value as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filterBy === filter.value
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-700/50'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Playlists Content */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {filteredAndSortedPlaylists.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Music className="w-12 h-12 text-gray-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                {searchQuery ? 'No playlists found' : 'Create your first playlist'}
              </h3>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                {searchQuery
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Start building your karaoke collection by creating a playlist. Add your favorite songs and share them with others.'
                }
              </p>

              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Your First Playlist
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredAndSortedPlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 transform hover:scale-[1.02] ${
                    viewMode === 'list' ? 'flex items-center gap-4 p-4' : 'p-0'
                  }`}
                  onMouseEnter={() => setHoveredPlaylist(playlist.id)}
                  onMouseLeave={() => setHoveredPlaylist(null)}
                >
                  {/* Playlist Cover */}
                  <div className={`relative overflow-hidden ${
                    viewMode === 'grid' ? 'aspect-square' : 'w-20 h-20 rounded-xl'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Music className="w-8 h-8 text-white/50" />
                    </div>

                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${
                      hoveredPlaylist === playlist.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <Link href={`/admin/karaoke/playlist/${playlist.id}`}>
                        <button className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </button>
                      </Link>
                    </div>

                    {/* Premium Badge */}
                    {isPremium && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Playlist Info */}
                  <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'p-4' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-lg truncate group-hover:text-purple-300 transition-colors">
                          {playlist.name}
                        </h3>
                        {playlist.description && (
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                      </div>

                      {/* Privacy Badge */}
                      {playlist.is_public && (
                        <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs ml-2 flex-shrink-0">
                          <Users className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {playlist.video_count || 0} songs
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(playlist.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Actions Menu */}
                      <div className="relative">
                        <button className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Action */}
                  {viewMode === 'grid' && (
                    <button
                      onClick={() => deletePlaylist(playlist.id)}
                      className="absolute top-2 left-2 p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </KaraokeLayout>
  );
}