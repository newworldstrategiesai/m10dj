'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LiveKitRoom, useLocalParticipant } from '@livekit/components-react';
import { Room } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLiveKitTranscription } from '@/hooks/useLiveKitTranscription';

// Browser Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PublicVoiceAssistantProps {
  sessionId: string;
  onTranscription?: (text: string) => void;
  onResponse?: (response: string) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
  className?: string;
  contactId?: string;
  phoneNumber?: string;
  context?: Record<string, any>;
}

/**
 * Public Voice Assistant Component
 * 
 * Allows anonymous website visitors to interact with voice AI
 * Stores conversation history and connects to admin assistant API
 */
export function PublicVoiceAssistant({ 
  sessionId,
  onTranscription,
  onResponse,
  onError,
  onClose,
  className,
  contactId,
  phoneNumber,
  context
}: PublicVoiceAssistantProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useBrowserRecognition, setUseBrowserRecognition] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [transcription, setTranscription] = useState<string>('');

  // Get or generate session ID
  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      // Try to get from localStorage
      let storedSessionId = localStorage.getItem('voice_session_id');
      if (!storedSessionId) {
        storedSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('voice_session_id', storedSessionId);
      }
    }
  }, [sessionId]);

  // Send message to assistant API (defined early for use in other callbacks)
  const sendMessageToAssistant = useCallback(async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Get conversation history
      const historyResponse = await fetch('/api/voice-assistant/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || localStorage.getItem('voice_session_id'),
        }),
      });

      const historyData = await historyResponse.json();
      const conversationHistory = historyData.history || [];

      // Send to assistant API
      const response = await fetch('/api/voice-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: sessionId || localStorage.getItem('voice_session_id'),
          conversationHistory,
          contactId,
          phoneNumber,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }

      const data = await response.json();
      
      if (data.response) {
        onResponse?.(data.response);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process message');
      setError(error.message);
      onError?.(error);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, contactId, phoneNumber, context, isProcessing, onResponse, onError]);

  // Browser Speech Recognition fallback
  const startBrowserRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not available in this browser');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcription display with interim results
      if (interimTranscript) {
        setTranscription(interimTranscript);
      }

      // Send final transcript when complete
      if (finalTranscript.trim()) {
        const finalText = finalTranscript.trim();
        if (onTranscription) {
          onTranscription(finalText);
        }
        sendMessageToAssistant(finalText);
        finalTranscript = '';
        setTranscription('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart recognition after a delay
        setTimeout(() => {
          if (isListening && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Error restarting recognition:', e);
            }
          }
        }, 1000);
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (event.error === 'aborted') {
        // Recognition was stopped, don't show error
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      if (isListening && recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Error restarting recognition on end:', e);
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setError(null);
    } catch (e) {
      console.error('Error starting recognition:', e);
      setError('Failed to start speech recognition');
    }
  }, [isListening, onTranscription, sendMessageToAssistant]);

  // Get token and connect to room
  const connectRoom = useCallback(async () => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/livekit/public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || localStorage.getItem('voice_session_id'),
          participantName: 'Guest',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to get token (${response.status})`;
        console.error('LiveKit token error:', errorMessage);
        
        // If LiveKit is not configured, fall back to browser speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          console.log('LiveKit not available, falling back to browser speech recognition');
          setUseBrowserRecognition(true);
          setError(null);
          setIsConnecting(false);
          setIsConnected(true); // Mark as "connected" to browser recognition
          startBrowserRecognition();
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setToken(data.token);
      setServerUrl(data.url);
      setRoomName(data.roomName);
      setIsConnecting(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      console.error('Connection error:', error);
      
      // Try browser speech recognition as fallback
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !useBrowserRecognition) {
        console.log('Falling back to browser speech recognition');
        setUseBrowserRecognition(true);
        setError(null);
        setIsConnecting(false);
        setIsConnected(true);
        startBrowserRecognition();
        return;
      }
      
      setError(error.message);
      setIsConnecting(false);
      onError?.(error);
    }
  }, [sessionId, isConnecting, isConnected, onError, useBrowserRecognition, startBrowserRecognition]);

  // Handle room connection
  const handleConnected = useCallback(() => {
    // Room is available via LiveKitRoom context
    setIsConnected(true);
    setIsListening(true);
    
    // Check if browser Speech Recognition is available
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setUseBrowserRecognition(true);
      startBrowserRecognition();
    }
  }, [startBrowserRecognition]);

  // Handle transcription updates from inner component
  const handleTranscriptionUpdate = useCallback((text: string) => {
    setTranscription(text);
    
    if (text && text.trim() && onTranscription && !useBrowserRecognition) {
      const shouldSend = text.length > 10 || 
                        text.endsWith('.') || 
                        text.endsWith('?') ||
                        text.endsWith('!');

      if (shouldSend) {
        onTranscription(text);
        sendMessageToAssistant(text);
        setTranscription(''); // Clear after sending
      }
    }
  }, [onTranscription, useBrowserRecognition, sendMessageToAssistant]);

  // Handle disconnection
  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setIsListening(false);
    setRoom(null);
    setTranscription('');
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Toggle listening - will be handled by inner component with room access
  const toggleListening = useCallback(() => {
    if (!isConnected) {
      connectRoom();
      return;
    }

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      setIsListening(true);
      if (useBrowserRecognition && recognitionRef.current) {
        recognitionRef.current.start();
      }
    }
  }, [isConnected, isListening, useBrowserRecognition, connectRoom]);

  // If using browser recognition, show controls directly
  if (useBrowserRecognition && isConnected) {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <Button
          onClick={toggleListening}
          disabled={isProcessing}
          className={cn(
            "rounded-full w-16 h-16 p-0 transition-all",
            isListening && "bg-red-500 hover:bg-red-600 animate-pulse",
            isProcessing && "opacity-50"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
        {transcription && (
          <div className="text-xs text-gray-600 text-center max-w-xs">
            {transcription}
          </div>
        )}
        {error && (
          <p className="text-xs text-red-500 text-center max-w-xs">{error}</p>
        )}
      </div>
    );
  }

  // If no token/serverUrl, show connect button
  if (!token || !serverUrl) {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <Button
          onClick={connectRoom}
          disabled={isConnecting}
          className="rounded-full w-16 h-16 p-0"
        >
          {isConnecting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
        {error && (
          <p className="text-xs text-red-500 text-center max-w-xs">{error}</p>
        )}
        {!error && !isConnecting && (
          <p className="text-xs text-gray-500 text-center max-w-xs">
            Click to start voice assistant
          </p>
        )}
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      connect={isConnected}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      className={className}
    >
      <VoiceAssistantControls
        isListening={isListening}
        isProcessing={isProcessing}
        transcription={transcription}
        error={error}
        onToggleListening={toggleListening}
        onTranscriptionUpdate={handleTranscriptionUpdate}
        onClose={onClose}
      />
    </LiveKitRoom>
  );
}

/**
 * Inner component with access to LiveKit hooks
 */
function VoiceAssistantControls({
  isListening,
  isProcessing,
  transcription,
  error,
  onToggleListening,
  onTranscriptionUpdate,
  onClose,
}: {
  isListening: boolean;
  isProcessing: boolean;
  transcription: string;
  error: string | null;
  onToggleListening: () => void;
  onTranscriptionUpdate: (text: string) => void;
  onClose?: () => void;
}) {
  const { localParticipant } = useLocalParticipant();
  const { transcription: liveKitTranscription, clearTranscription } = useLiveKitTranscription();
  
  // Use ref to store latest callback to avoid dependency issues
  const onTranscriptionUpdateRef = useRef(onTranscriptionUpdate);
  useEffect(() => {
    onTranscriptionUpdateRef.current = onTranscriptionUpdate;
  }, [onTranscriptionUpdate]);

  // Update parent when LiveKit transcription changes
  useEffect(() => {
    if (liveKitTranscription && liveKitTranscription !== transcription) {
      // Use ref to avoid dependency on function reference
      onTranscriptionUpdateRef.current(liveKitTranscription);
    }
  }, [liveKitTranscription, transcription]); // Removed onTranscriptionUpdate from dependencies

  // Sync microphone with listening state
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(isListening);
    }
  }, [isListening, localParticipant]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        onClick={onToggleListening}
        disabled={isProcessing}
        className={cn(
          "rounded-full w-16 h-16 p-0 transition-all",
          isListening && "bg-red-500 hover:bg-red-600 animate-pulse",
          isProcessing && "opacity-50"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </Button>
      
      {(liveKitTranscription || transcription) && (
        <div className="text-xs text-gray-600 text-center max-w-xs">
          {liveKitTranscription || transcription}
        </div>
      )}
      
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}

