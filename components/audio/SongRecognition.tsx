'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, CheckCircle, XCircle, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface SongRecognitionProps {
  eventId?: string;
  contactId?: string;
  organizationId?: string;
  onSongDetected?: (song: { title: string; artist: string; confidence: number }) => void;
  autoStart?: boolean;
  chunkDuration?: number; // Duration in seconds for each audio chunk (default: 5)
}

interface DetectedSong {
  title: string;
  artist: string;
  confidence: number;
  timestamp: Date;
  album?: string;
  spotifyUrl?: string;
}

export default function SongRecognition({
  eventId,
  contactId,
  organizationId,
  onSongDetected,
  autoStart = false,
  chunkDuration = 5
}: SongRecognitionProps) {
  const [isListening, setIsListening] = useState(autoStart);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedSongs, setDetectedSongs] = useState<DetectedSong[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { toast } = useToast();

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
    return () => {
      stopListening();
    };
  }, []);

  // Set canvas size on mount and resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isListening]);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after checking
      setHasPermission(true);
    } catch (err) {
      setHasPermission(false);
      setError('Microphone permission denied. Please enable microphone access.');
    }
  };

  const startListening = async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;

      // Set up Web Audio API for visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start waveform visualization
      startWaveformVisualization();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Process the recorded audio chunk
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudioChunk(audioBlob);
          audioChunksRef.current = [];
        }

        // Continue listening if still active
        if (isListening) {
          startRecordingChunk();
        }
      };

      setIsListening(true);
      startRecordingChunk();

      toast({
        title: 'Listening started',
        description: 'Audio recognition is now active',
      });

    } catch (err: any) {
      console.error('Error starting audio capture:', err);
      setError(err.message || 'Failed to access microphone');
      setHasPermission(false);
      toast({
        title: 'Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const startWaveformVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isListening || !analyserRef.current || !canvasRef.current) {
        animationFrameRef.current = null;
        return;
      }

      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, width, height);

      // Draw waveform
      const barCount = Math.min(bufferLength, 64); // Limit bars for better performance
      const barWidth = width / barCount;
      let barHeight;
      let x = 0;

      ctx.fillStyle = '#8b5cf6'; // Purple color

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        barHeight = (dataArray[dataIndex] / 255) * height * 0.7; // Scale to 70% of height

        // Draw bar with rounded top
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  const startRecordingChunk = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'recording') {
      return;
    }

    // Start recording
    mediaRecorderRef.current.start();

    // Stop after chunkDuration seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, chunkDuration * 1000);
  };

  const processAudioChunk = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Call our API endpoint
        const response = await fetch('/api/audio/recognize-song', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioData: base64Audio,
            eventId,
            contactId,
            organizationId,
            audioFormat: 'webm'
          }),
        });

        const result = await response.json();

        if (result.success && result.song) {
          const detectedSong: DetectedSong = {
            title: result.song.title,
            artist: result.song.artist,
            confidence: result.song.confidence || 0,
            timestamp: new Date(),
            album: result.song.album,
            spotifyUrl: result.song.spotifyUrl,
          };

          setDetectedSongs(prev => [detectedSong, ...prev].slice(0, 10)); // Keep last 10

          toast({
            title: 'Song detected!',
            description: `${detectedSong.title} by ${detectedSong.artist}`,
          });

          // Callback for parent component
          if (onSongDetected) {
            onSongDetected({
              title: detectedSong.title,
              artist: detectedSong.artist,
              confidence: detectedSong.confidence,
            });
          }
        } else {
          // No song detected - this is normal, don't show error
          console.log('No song detected in this chunk');
        }
      };
    } catch (err: any) {
      console.error('Error processing audio:', err);
      setError(err.message || 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);

    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Clear waveform canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    toast({
      title: 'Listening stopped',
      description: 'Audio recognition has been disabled',
    });
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (hasPermission === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MicOff className="h-5 w-5" />
            Microphone Access Required
          </CardTitle>
          <CardDescription>
            Please enable microphone access to use audio recognition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={checkMicrophonePermission}>
            Request Permission
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="p-3 sm:p-6 pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Music className="h-4 w-4 sm:h-5 sm:w-5" />
          Automatic Song Recognition
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Listen to ambient audio and automatically detect songs being played
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
        {/* Waveform Visualization */}
        {isListening && (
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Audio Input</span>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-16 sm:h-20 rounded bg-gray-900 dark:bg-gray-950"
              style={{ display: 'block' }}
            />
          </div>
        )}

        {/* Control Button */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Button
            onClick={toggleListening}
            disabled={isProcessing || !hasPermission}
            variant={isListening ? 'destructive' : 'default'}
            size="lg"
            className="flex items-center gap-2 flex-1 sm:flex-initial text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
                <span className="sm:hidden">Processing</span>
              </>
            ) : isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                <span className="hidden sm:inline">Stop Listening</span>
                <span className="sm:hidden">Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Start Listening</span>
                <span className="sm:hidden">Start</span>
              </>
            )}
          </Button>

          {isListening && (
            <Badge variant="outline" className="animate-pulse text-xs sm:text-sm">
              <Mic className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-2 sm:p-3 bg-destructive/10 border border-destructive/20 rounded-md text-xs sm:text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Detected Songs List */}
        {detectedSongs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold">Recently Detected Songs</h3>
            <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {detectedSongs.map((song, index) => (
                <div
                  key={index}
                  className="p-2 sm:p-3 bg-muted rounded-md border flex items-start justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base truncate">{song.title}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground truncate">{song.artist}</div>
                    {song.album && (
                      <div className="text-xs text-muted-foreground mt-1 truncate">Album: {song.album}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(song.confidence * 100)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {song.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {song.spotifyUrl && (
                    <a
                      href={song.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary hover:underline flex-shrink-0"
                    >
                      <Music className="h-4 w-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t space-y-0.5">
          <p>• Audio is processed in {chunkDuration}-second chunks</p>
          <p>• Songs are automatically saved to your event</p>
          <p>• Matching song requests are marked as played</p>
        </div>
      </CardContent>
    </Card>
  );
}

