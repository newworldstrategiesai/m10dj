import { useEffect, useState } from 'react';
import { useDataChannel } from '@livekit/components-react';
import { Room } from 'livekit-client';

export interface TranscriptionMessage {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export function useLiveKitTranscription() {
  const [transcription, setTranscription] = useState<string>('');
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionMessage[]>([]);
  const { message } = useDataChannel('transcription');

  useEffect(() => {
    if (message) {
      try {
        const data = JSON.parse(new TextDecoder().decode(message.payload));
        
        if (data.type === 'transcription') {
          const transcriptText = data.text || '';
          const isFinal = data.isFinal || false;
          
          if (isFinal && transcriptText.trim()) {
            // Final transcription - add to history and update current
            setTranscriptionHistory(prev => [...prev, {
              text: transcriptText,
              isFinal: true,
              timestamp: Date.now(),
            }]);
            setTranscription(transcriptText);
          } else if (!isFinal) {
            // Partial transcription - update current (don't add to history yet)
            setTranscription(transcriptText);
          }
        }
      } catch (error) {
        console.error('Error parsing transcription message:', error);
      }
    }
  }, [message]);

  const clearTranscription = () => {
    setTranscription('');
    setTranscriptionHistory([]);
  };

  return { 
    transcription, 
    transcriptionHistory,
    clearTranscription,
    hasTranscription: transcription.trim().length > 0,
  };
}

