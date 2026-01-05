'use client';

import React, { useState } from 'react';
import { Volume2, FileText, Download, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CallTranscriptionViewProps {
  callId: string;
  recordingUrl?: string | null;
  transcriptionText?: string | null;
  transcriptionStatus?: string | null;
  transcriptionConfidence?: number | null;
  extractedMetadata?: any;
  callDuration?: number | null;
}

export default function CallTranscriptionView({
  callId,
  recordingUrl,
  transcriptionText,
  transcriptionStatus,
  transcriptionConfidence,
  extractedMetadata,
  callDuration
}: CallTranscriptionViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handlePlayRecording = () => {
    if (!recordingUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(recordingUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('pause', () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleDownloadRecording = () => {
    if (!recordingUrl) return;
    window.open(recordingUrl, '_blank');
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = () => {
    switch (transcriptionStatus) {
      case 'completed':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Transcribed
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Call Recording & Transcription</h3>
        {getStatusBadge()}
      </div>

      {/* Recording Controls */}
      {recordingUrl && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Button
            onClick={handlePlayRecording}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            {isPlaying ? 'Pause' : 'Play'} Recording
          </Button>
          <Button
            onClick={handleDownloadRecording}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          {callDuration && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Duration: {formatDuration(callDuration)}
            </span>
          )}
        </div>
      )}

      {/* Transcription Text */}
      {transcriptionText ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Transcription</h4>
            {transcriptionConfidence && (
              <Badge variant="outline" className="ml-auto">
                {Math.round(transcriptionConfidence * 100)}% confidence
              </Badge>
            )}
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-96 overflow-y-auto">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {transcriptionText}
            </p>
          </div>
        </div>
      ) : transcriptionStatus === 'processing' ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Transcribing call...</span>
        </div>
      ) : transcriptionStatus === 'failed' ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">
            Transcription failed. Please try again or contact support.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Transcription not available yet. It will appear here once processing is complete.
          </p>
        </div>
      )}

      {/* Extracted Metadata */}
      {extractedMetadata && Object.keys(extractedMetadata).length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">Extracted Information</h4>
          <div className="grid grid-cols-2 gap-4">
            {extractedMetadata.event_type && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Event Type</p>
                <p className="font-semibold text-gray-900 dark:text-white capitalize">
                  {extractedMetadata.event_type}
                </p>
              </div>
            )}
            {extractedMetadata.event_date && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Event Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {extractedMetadata.event_date}
                </p>
              </div>
            )}
            {extractedMetadata.budget && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Budget</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {extractedMetadata.budget}
                </p>
              </div>
            )}
            {extractedMetadata.guest_count && (
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Guest Count</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {extractedMetadata.guest_count}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}









