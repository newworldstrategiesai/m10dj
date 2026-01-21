'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Search,
  X,
  Music,
  Clock,
  Users,
  Lock
} from 'lucide-react';
import SongBrowser from '@/components/karaoke/SongBrowser';

interface KaraokePlayerPanelProps {
  onClose: () => void;
  isPremium: boolean;
}

interface QueueItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnailUrl: string;
  isPremium?: boolean;
}

export default function KaraokePlayerPanel({ onClose, isPremium }: KaraokePlayerPanelProps) {
  const [logoError, setLogoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSong, setCurrentSong] = useState<QueueItem | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSongBrowser, setShowSongBrowser] = useState(false);

  // Mock data for demonstration
  const mockQueue: QueueItem[] = [
    {
      id: '1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      duration: '5:55',
      thumbnailUrl: '/api/placeholder/60/60',
      isPremium: false
    },
    {
      id: '2',
      title: 'Hotel California',
      artist: 'Eagles',
      duration: '6:30',
      thumbnailUrl: '/api/placeholder/60/60',
      isPremium: true
    },
    {
      id: '3',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      duration: '8:02',
      thumbnailUrl: '/api/placeholder/60/60',
      isPremium: false
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const removeFromQueue = (songId: string) => {
    setQueue(queue.filter(song => song.id !== songId));
  };

  const totalQueueTime = queue.reduce((total, song) => {
    const [mins, secs] = song.duration.split(':').map(Number);
    return total + mins * 60 + secs;
  }, 0);

  return (
    <aside className="w-96 bg-gray-900/95 backdrop-blur-sm border-l border-gray-700/50 flex flex-col karaoke-scrollbar">
      {/* Header with Karafun Branding */}
      <div className="relative h-32 karaoke-gradient-primary flex items-center justify-center shadow-lg">
        {!logoError ? (
          <img
            src="/assets/karafun-logo.png"
            alt="Karafun"
            className="h-12 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="text-white font-bold text-xl">KARAFUN</span>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Now Playing Section */}
      <div className="p-6 border-b border-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Now Playing
        </h3>

        {currentSong ? (
          <div className="space-y-4">
            {/* Album Art */}
            <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Music className="w-12 h-12 text-white/50" />
            </div>

            {/* Song Info */}
            <div className="text-center">
              <h4 className="font-semibold text-white text-lg">{currentSong.title}</h4>
              <p className="text-gray-400">{currentSong.artist}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-1 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                className="p-3 rounded-full karaoke-gradient-primary hover:shadow-xl text-white shadow-lg transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>

              <button className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-pink-500 to-purple-600 h-1 rounded-full"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-400 w-8">{isMuted ? 0 : volume}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">No item is being played</p>
          </div>
        )}
      </div>

      {/* Queue Section */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Queue
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {queue.length} song{queue.length !== 1 ? 's' : ''} - {formatTime(totalQueueTime)}
              </span>
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Queue Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="p-8 text-center">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h4 className="text-gray-400 font-medium mb-2">Your queue is empty</h4>
              <p className="text-sm text-gray-500 mb-4">
                Add songs or take quizzes to keep singing.
              </p>
              <Button
                size="sm"
                className="karaoke-btn-primary"
                onClick={() => setShowSongBrowser(true)}
              >
                Browse Songs
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {queue
                .filter(song =>
                  song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  song.artist.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((song, index) => (
                  <div
                    key={song.id}
                    className={`p-3 hover:bg-gray-800/30 transition-colors cursor-pointer ${
                      index === 0 ? 'bg-gradient-to-r from-pink-500/10 to-purple-600/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center flex-shrink-0">
                        <Music className="w-4 h-4 text-white/50" />
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white text-sm truncate">{song.title}</h4>
                          {song.isPremium && !isPremium && (
                            <Lock className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate">{song.artist}</p>
                      </div>

                      {/* Duration and Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs">{song.duration}</span>
                        <button
                          onClick={() => {
                            // Open video in new window if we have video data
                            // For now, this is a placeholder - in real implementation
                            // we'd need video data associated with queue items
                            console.log('Play video for:', song.title);
                          }}
                          className="text-pink-400 hover:text-pink-300 transition-colors"
                          title="Play Video"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromQueue(song.id)}
                          className="text-gray-500 hover:text-gray-400 transition-colors"
                          title="Remove from Queue"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Song Browser Dialog */}
      <SongBrowser
        isOpen={showSongBrowser}
        onClose={() => setShowSongBrowser(false)}
        onAddToQueue={(video) => {
          // Add to queue logic here
          const newItem: QueueItem = {
            id: video.id,
            title: video.title,
            artist: video.artist,
            duration: video.duration,
            thumbnailUrl: video.thumbnail_url,
            isPremium: video.is_premium
          };
          setQueue(prev => [...prev, newItem]);
        }}
        mode="queue"
      />
    </aside>
  );
}