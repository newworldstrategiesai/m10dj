'use client';

import { useState, useEffect, useCallback } from 'react';
import { LiveKitRoom, useVoiceAssistant, BarVisualizer } from '@livekit/components-react';
import { Room, RoomEvent, DataPacket_Kind } from 'livekit-client';
import { Mic, MicOff, X } from 'lucide-react';

/**
 * Voice Input Area Component
 * Integrates LiveKit voice assistant into the chat widget
 */
export function VoiceInputArea({
  token,
  serverUrl,
  roomName,
  sessionId,
  formData,
  submissionId,
  onTranscription,
  onResponse,
  onToggleVoice
}) {
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transcription, setTranscription] = useState('');

  const handleConnected = useCallback((room) => {
    setRoom(room);
    setIsConnected(true);
    room.localParticipant.setMicrophoneEnabled(true);
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setRoom(null);
    setTranscription('');
  }, []);

  // Listen for transcription from LiveKit
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant, kind, topic) => {
      if (kind === DataPacket_Kind.RELIABLE && topic === 'transcription') {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          if (data.type === 'transcription' && data.text) {
            setTranscription(data.text);
            if (data.isFinal && data.text.trim()) {
              onTranscription?.(data.text.trim());
            }
          }
        } catch (e) {
          console.error('Error parsing transcription:', e);
        }
      }
    };

    // Also listen for text stream messages (from agent)
    const handleDataReceivedText = (payload, participant, kind, topic) => {
      if (kind === DataPacket_Kind.RELIABLE && topic === 'agent-response') {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          if (data.type === 'response' && data.text) {
            onResponse?.(data.text);
          }
        } catch (e) {
          console.error('Error parsing agent response:', e);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.DataReceived, handleDataReceivedText);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.DataReceived, handleDataReceivedText);
    };
  }, [room, onTranscription, onResponse]);

  // Send transcription to voice assistant API when final (fallback if agent not connected)
  useEffect(() => {
    // Only use API fallback if no agent is connected
    const hasAgent = room?.remoteParticipants.size > 0 && 
                     Array.from(room.remoteParticipants.values()).some(p => p.kind === 'agent');
    
    if (transcription && transcription.trim() && transcription.endsWith('.') && !hasAgent) {
      sendToVoiceAssistant(transcription.trim());
    }
  }, [transcription, room]);

  const sendToVoiceAssistant = async (message) => {
    try {
      // Get conversation history
      const historyResponse = await fetch('/api/voice-assistant/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const historyData = await historyResponse.json();
      const conversationHistory = historyData.history || [];

      // Send to voice assistant
      const response = await fetch('/api/voice-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId,
          conversationHistory,
          contactId: submissionId,
          phoneNumber: formData.phone,
          context: {
            eventType: formData.eventType,
            eventDate: formData.eventDate,
            venueName: formData.venueName,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response) {
          onResponse?.(data.response);
          setTranscription('');
        }
      }
    } catch (error) {
      console.error('Error sending to voice assistant:', error);
    }
  };

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      connect={isConnected}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      className="w-full"
    >
      <VoiceAssistantUI
        room={room}
        transcription={transcription}
        onToggleVoice={onToggleVoice}
      />
    </LiveKitRoom>
  );
}

/**
 * Voice Assistant UI Component
 * Uses LiveKit hooks to display voice state and audio visualization
 */
function VoiceAssistantUI({ room, transcription, onToggleVoice }) {
  const { state, audioTrack } = useVoiceAssistant();

  return (
    <div className="space-y-3">
      {/* Audio Visualizer */}
      <div className="flex items-center justify-center h-16 bg-gray-100 dark:bg-gray-700 rounded-lg px-4">
        {agentAudioTrack ? (
          <BarVisualizer
            state={agentState}
            barCount={5}
            trackRef={agentAudioTrack}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {agentState === 'initializing' && 'Connecting to assistant...'}
            {agentState === 'listening' && '🎤 Listening...'}
            {agentState === 'thinking' && '🤔 Thinking...'}
            {agentState === 'speaking' && '🗣️ Speaking...'}
            {!agentParticipant && 'Waiting for agent...'}
          </div>
        )}
      </div>

      {/* Transcription Display */}
      {transcription && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">{transcription}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            state === 'listening' ? 'bg-green-500 animate-pulse' :
            state === 'thinking' ? 'bg-yellow-500 animate-pulse' :
            state === 'speaking' ? 'bg-blue-500 animate-pulse' :
            'bg-gray-400'
          }`} />
          <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
            {agentState || 'Ready'}
          </span>
        </div>
        <button
          onClick={onToggleVoice}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Switch to Text</span>
        </button>
      </div>
    </div>
  );
}

