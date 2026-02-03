'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';
import { cn } from '@/utils/cn';
import { LiveKitVoiceAgentUI } from '@/components/agents-ui/LiveKitVoiceAgentUI';

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
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useBrowserRecognition, setUseBrowserRecognition] = useState(false);
  const recognitionRef = useRef<any>(null);

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

  // Toggle microphone (browser recognition only)
  const toggleMicrophone = useCallback(() => {
    if (!useBrowserRecognition || !recognitionRef.current) return;
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
  }, [isListening, useBrowserRecognition]);

  // Prefer browser recognition when available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setUseBrowserRecognition(true);
    }
  }, []);

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

  // LiveKit path: use Agents UI (TokenSource + useSession + AgentSessionProvider + BarVisualizer)
  return (
    <LiveKitVoiceAgentUI
      userId={userId}
      userEmail={userEmail}
      onTranscription={onTranscription}
      onError={onError}
      className={className}
    />
  );
}

