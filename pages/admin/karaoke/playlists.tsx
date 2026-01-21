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
  Users
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

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <KaraokeLayout title="Playlists" currentPage="playlists">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading playlists...</p>
          </div>
        </div>
      </KaraokeLayout>
    );
  }

  return (
    <KaraokeLayout title="Playlists" currentPage="playlists">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Playlists</h1>
            <p className="text-gray-400 mt-1">Create and manage your karaoke playlists</p>
          </div>

          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="karaoke-btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Playlist Name *
                  </label>
                  <Input
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="My Awesome Playlist"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <Input
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    placeholder="A collection of great songs..."
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newPlaylistIsPublic}
                    onChange={(e) => setNewPlaylistIsPublic(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                    Make playlist public
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createPlaylist}
                    disabled={!newPlaylistName.trim() || creating}
                    className="karaoke-btn-primary"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search playlists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Playlists Grid */}
        {filteredPlaylists.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'No playlists found' : 'No playlists yet'}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first playlist to get started with karaoke'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)} className="karaoke-btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Playlist
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card key={playlist.id} className="karaoke-card group hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-lg truncate">
                        {playlist.name}
                      </CardTitle>
                      {playlist.description && (
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {playlist.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {playlist.is_public && (
                        <Badge variant="outline" className="border-green-500/50 text-green-400">
                          <Users className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Playlist Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Music className="w-4 h-4" />
                        <span>{playlist.video_count} songs</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(playlist.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/karaoke/playlist/${playlist.id}`}>
                        <Button size="sm" className="flex-1 karaoke-btn-secondary">
                          <Play className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      </Link>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deletePlaylist(playlist.id)}
                        className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </KaraokeLayout>
  );
}