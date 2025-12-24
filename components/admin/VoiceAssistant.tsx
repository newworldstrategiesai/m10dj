'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LiveKitRoom, useLocalParticipant, useDataChannel } from '@livekit/components-react';
import { Room, Track, RoomEvent, DataPacket_Kind } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { IconMicrophone, IconMicrophoneOff, IconLoader2 } from '@tabler/icons-react';
import { cn } from '@/utils/cn';
import { useLiveKitTranscription } from '@/hooks/useLiveKitTranscription';

// Browser Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  userId: string;
  userEmail?: string;
  onTranscription?: (text: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function VoiceAssistant({ 
  userId, 
  userEmail,
  onTranscription,
  onError,
  className 
}: VoiceAssistantProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [useBrowserRecognition, setUseBrowserRecognition] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { localParticipant } = useLocalParticipant();
  const { transcription, clearTranscription } = useLiveKitTranscription();

  // Get token and connect to room
  const connectRoom = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomType: 'admin-assistant',
          participantIdentity: userId,
          participantName: userEmail || 'Admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get token');
      }

      const data = await response.json();
      setToken(data.token);
      setServerUrl(data.url);
      setRoomName(data.roomName);
      setIsConnecting(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setError(error.message);
      setIsConnecting(false);
      onError?.(error);
    }
  }, [userId, userEmail, isConnecting, isConnected, onError]);

  // Handle room connection
  const handleConnected = useCallback(() => {
    setIsConnected(true);
    setIsListening(true);
    
    // Note: Room access is via LiveKitRoom context
    // Microphone will be enabled via options
  }, []);

  // Handle disconnection
  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setIsListening(false);
    clearTranscription();
  }, [clearTranscription]);

  // Initialize browser Speech Recognition as fallback
  useEffect(() => {
    // Check if browser Speech Recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript.trim() && onTranscription) {
          onTranscription(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Ignore - just means no speech detected
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };
      
      recognition.onend = () => {
        if (isListening && useBrowserRecognition) {
          // Restart if still listening
          try {
            recognition.start();
          } catch (e) {
            // Already started or error
          }
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, [isListening, useBrowserRecognition, onTranscription]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    // Try browser recognition first (works immediately)
    if (useBrowserRecognition && recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.error('Error starting recognition:', err);
          setError('Failed to start speech recognition');
        }
      }
      return;
    }

    // Fallback to LiveKit if available
    if (localParticipant) {
      try {
        const isEnabled = localParticipant.isMicrophoneEnabled;
        await localParticipant.setMicrophoneEnabled(!isEnabled);
        setIsListening(!isEnabled);
      } catch (err) {
        console.error('Error toggling microphone:', err);
        setError('Failed to toggle microphone');
      }
    }
  }, [localParticipant, isListening, useBrowserRecognition]);

  // Send transcription to parent when final
  useEffect(() => {
    if (transcription && transcription.trim() && onTranscription) {
      // Only send if it looks like a complete sentence or command
      // This is a simple heuristic - you might want to improve this
      const shouldSend = transcription.length > 10 || 
                        transcription.endsWith('.') || 
                        transcription.endsWith('?') ||
                        transcription.endsWith('!');
      
      if (shouldSend) {
        // Small delay to ensure it's final
        const timer = setTimeout(() => {
          onTranscription(transcription);
          clearTranscription();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [transcription, onTranscription, clearTranscription]);

  // Auto-connect on mount (or use browser recognition)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      // Use browser recognition as primary (works immediately)
      setUseBrowserRecognition(true);
    } else {
      // Fallback to LiveKit if browser recognition not available
      if (!isConnected && !isConnecting && !token) {
        connectRoom();
      }
    }
  }, [isConnected, isConnecting, token, connectRoom]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, []);

  // If using browser recognition, don't need LiveKit connection
  if (useBrowserRecognition) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          size="sm"
          variant={isListening ? 'default' : 'outline'}
          onClick={toggleMicrophone}
          className={cn(
            'rounded-full',
            isListening && 'bg-red-500 hover:bg-red-600'
          )}
        >
          {isListening ? (
            <IconMicrophone className="h-4 w-4" />
          ) : (
            <IconMicrophoneOff className="h-4 w-4" />
          )}
        </Button>
        
        {isListening && (
          <span className="text-xs text-muted-foreground">Listening...</span>
        )}
        
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
    );
  }

  // LiveKit connection UI
  if (!token || !serverUrl || !roomName) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isConnecting ? (
          <>
            <IconLoader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Connecting...</span>
          </>
        ) : error ? (
          <>
            <span className="text-sm text-destructive">{error}</span>
            <Button 
              size="sm" 
              variant="outline"
              onClick={connectRoom}
            >
              Retry
            </Button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      className={cn('flex items-center gap-2', className)}
    >
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isListening ? 'default' : 'outline'}
          onClick={toggleMicrophone}
          disabled={!isConnected}
          className={cn(
            'rounded-full',
            isListening && 'bg-red-500 hover:bg-red-600'
          )}
        >
          {isListening ? (
            <IconMicrophone className="h-4 w-4" />
          ) : (
            <IconMicrophoneOff className="h-4 w-4" />
          )}
        </Button>
        
        {transcription && (
          <span className="text-xs text-muted-foreground max-w-[200px] truncate">
            {transcription}
          </span>
        )}
        
        {!isConnected && (
          <span className="text-xs text-muted-foreground">Connecting...</span>
        )}
      </div>
    </LiveKitRoom>
  );
}

