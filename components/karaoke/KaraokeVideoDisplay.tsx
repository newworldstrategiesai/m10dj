'use client';

import { useState, useEffect } from 'react';
import { Music, Play, Pause, Volume2, AlertTriangle, Loader2 } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';

interface KaraokeSinger {
  id: string;
  singer_name: string;
  song_title: string;
  song_artist?: string;
  video_id?: string;
  video_url?: string;
  status: 'queued' | 'next' | 'singing' | 'completed' | 'skipped' | 'cancelled';
}

interface KaraokeVideoDisplayProps {
  currentSinger: KaraokeSinger | null;
  organizationId: string;
  className?: string;
  showControls?: boolean;
  autoPlay?: boolean;
}

export default function KaraokeVideoDisplay({
  currentSinger,
  organizationId,
  className = '',
  showControls = true,
  autoPlay = true
}: KaraokeVideoDisplayProps) {
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(30); // Default to 30% for karaoke

  // Extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    if (!url) return null;

    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /^[a-zA-Z0-9_-]{11}$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  };

  // Load video data for current singer
  useEffect(() => {
    const loadVideoData = async () => {
      if (!currentSinger) {
        setVideoData(null);
        setError(null);
        return;
      }

      // Only load video for actively singing users
      if (currentSinger.status !== 'singing') {
        setVideoData(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // If we have a video URL directly, use it
        if (currentSinger.video_url) {
          const videoId = extractVideoId(currentSinger.video_url);
          if (videoId) {
            setVideoData({
              videoId,
              title: `${currentSinger.song_title}${currentSinger.song_artist ? ` - ${currentSinger.song_artist}` : ''}`,
              source: 'direct'
            });
            setLoading(false);
            return;
          }
        }

        // If we have a video_id, fetch the video details
        if (currentSinger.video_id) {
          const response = await fetch(`/api/karaoke/video-details?videoId=${currentSinger.video_id}&organizationId=${organizationId}`);

          if (response.ok) {
            const data = await response.json();
            const videoId = extractVideoId(data.youtube_video_id ? `https://youtu.be/${data.youtube_video_id}` : '');

            if (videoId) {
              setVideoData({
                videoId,
                title: data.youtube_video_title || `${currentSinger.song_title}${currentSinger.song_artist ? ` - ${currentSinger.song_artist}` : ''}`,
                channel: data.youtube_channel_name,
                qualityScore: data.video_quality_score,
                source: 'linked'
              });
            } else {
              setError('Invalid video link');
            }
          } else {
            setError('Failed to load video details');
          }
        } else {
          // No video linked - show fallback
          setVideoData(null);
          setError('No video linked for this song');
        }
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    loadVideoData();
  }, [currentSinger, organizationId]);

  // Don't show anything if no current singer or not singing
  if (!currentSinger || currentSinger.status !== 'singing') {
    return null;
  }

  return (
    <div className={`bg-black/50 rounded-xl overflow-hidden border border-purple-500/30 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-4 py-2">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">KARAOKE VIDEO</span>
          {videoData?.qualityScore && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              videoData.qualityScore >= 80 ? 'bg-green-500 text-white' :
              videoData.qualityScore >= 60 ? 'bg-yellow-500 text-white' :
              'bg-red-500 text-white'
            }`}>
              {videoData.qualityScore}% Quality
            </span>
          )}
        </div>
      </div>

      {/* Video Content */}
      <div className="aspect-video relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center p-4">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold mb-1">Video Unavailable</p>
              <p className="text-gray-300 text-xs">{error}</p>
              <div className="mt-3 text-center">
                <p className="text-gray-400 text-xs">Now playing:</p>
                <p className="text-white text-sm font-semibold">
                  "{currentSinger.song_title}"
                  {currentSinger.song_artist && ` - ${currentSinger.song_artist}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {videoData && !loading && !error && (
          <YouTubePlayer
            videoId={videoData.videoId}
            isPlaying={currentSinger.status === 'singing'}
            showControls={showControls}
            autoPlay={autoPlay}
            volume={volume}
            onVolumeChange={setVolume}
            className="w-full h-full"
          />
        )}

        {!videoData && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center p-4">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-white text-lg font-semibold mb-2">No Video Available</p>
              <p className="text-gray-300 text-sm mb-4">
                Link a YouTube video in the admin panel for this song
              </p>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-white text-sm font-semibold">
                  "{currentSinger.song_title}"
                  {currentSinger.song_artist && ` - ${currentSinger.song_artist}`}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Sing along! 🎤
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Info Footer */}
      {videoData && !error && (
        <div className="bg-gray-900/50 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{videoData.title}</p>
              {videoData.channel && (
                <p className="text-gray-400 truncate">{videoData.channel}</p>
              )}
            </div>
            {videoData.source && (
              <span className={`px-2 py-0.5 rounded text-xs ${
                videoData.source === 'direct' ? 'bg-blue-500 text-white' :
                videoData.source === 'linked' ? 'bg-green-500 text-white' :
                'bg-purple-500 text-white'
              }`}>
                {videoData.source}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}