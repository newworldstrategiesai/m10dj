'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Download, Calendar, Clock, HardDrive } from 'lucide-react';

interface Recording {
  id: string;
  recording_url: string;
  recording_duration: number | null;
  recording_size: number | null;
  recorded_at: string | null;
  title: string | null;
  username: string;
}

export default function RecordingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecording() {
      if (!params || !params.streamId) {
        setError('Invalid recording ID');
        setLoading(false);
        return;
      }
      
      const streamId = params.streamId as string;

      const { data, error: fetchError } = await supabase
        .from('live_streams')
        .select('id, recording_url, recording_duration, recording_size, recorded_at, title, username')
        .eq('id', streamId)
        .single();

      if (fetchError || !data) {
        setError('Recording not found');
        setLoading(false);
        return;
      }

      const recordingData = data as {
        id: string;
        recording_url: string | null;
        recording_duration: number | null;
        recording_size: number | null;
        recorded_at: string | null;
        title: string | null;
        username: string;
      };

      if (!recordingData.recording_url) {
        setError('No recording available for this stream');
        setLoading(false);
        return;
      }

      setRecording(recordingData as Recording);
      setLoading(false);
    }

    loadRecording();
  }, [params, supabase]);

  function formatDuration(seconds: number | null): string {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-xl mb-4">{error || 'Recording not found'}</p>
          <Button onClick={() => router.back()} variant="outline" className="text-white border-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-gray-800 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {recording.title || `Recording by @${recording.username}`}
            </h1>
            <p className="text-gray-400 text-sm">@{recording.username}</p>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-gray-900 rounded-lg overflow-hidden mb-6">
          <video
            src={recording.recording_url}
            controls
            className="w-full aspect-video"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Recording Info */}
        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Duration</p>
                <p className="text-white font-semibold">{formatDuration(recording.recording_duration)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HardDrive className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">File Size</p>
                <p className="text-white font-semibold">{formatFileSize(recording.recording_size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-gray-400 text-sm">Recorded</p>
                <p className="text-white font-semibold">{formatDate(recording.recorded_at)}</p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = recording.recording_url;
              link.download = `recording-${recording.username}-${recording.recorded_at || 'unknown'}.webm`;
              link.click();
            }}
            variant="outline"
            className="w-full border-gray-700 text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Recording
          </Button>
        </div>
      </div>
    </div>
  );
}

