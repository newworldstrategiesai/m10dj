'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LiveKitRoom } from '@livekit/components-react';
import { Room, RoomEvent, DataPacket_Kind, ParticipantKind } from 'livekit-client';
import { Mic, X, Maximize2, Minimize2, Loader2 } from 'lucide-react';

/**
 * Floating Voice Assistant Widget
 * 
 * Appears when user clicks microphone in chat widget
 * Can be minimized to small floating button or maximized to full screen
 */
export function VoiceAssistantWidget({
  token,
  serverUrl,
  roomName,
  sessionId,
  formData,
  submissionId,
  onClose,
  onTranscription,
  onResponse
}) {
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);

  const handleConnected = useCallback(() => {
    setIsConnected(true);
    // Note: Room access is via LiveKitRoom context
    // Microphone will be enabled via component props
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setRoom(null);
    setTranscription('');
  }, []);

  const sendToVoiceAssistant = useCallback(async (message) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      // Add user message
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'user',
        content: message,
        timestamp: new Date()
      }]);

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
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            role: 'assistant',
            content: data.response,
            timestamp: new Date()
          }]);
          setTranscription('');
        }
      }
    } catch (error) {
      console.error('Error sending to voice assistant:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, submissionId, formData, onResponse]);

  // Listen for transcription and agent responses
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload, participant, kind, topic) => {
      if (kind === DataPacket_Kind.RELIABLE) {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          
          // Handle transcription
          if (topic === 'transcription' && data.type === 'transcription' && data.text) {
            setTranscription(data.text);
            if (data.isFinal && data.text.trim()) {
              onTranscription?.(data.text.trim());
              sendToVoiceAssistant(data.text.trim());
            }
          }
          
          // Handle agent response
          if (topic === 'agent-response' && data.type === 'response' && data.text) {
            onResponse?.(data.text);
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              role: 'assistant',
              content: data.text,
              timestamp: new Date()
            }]);
          }
        } catch (e) {
          console.error('Error parsing data:', e);
        }
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, onTranscription, onResponse, sendToVoiceAssistant]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transcription]);

  if (!token || !serverUrl || typeof window === 'undefined' || !document) {
    return null;
  }

  // Minimized view - small floating button
  if (isMinimized) {
    return createPortal(
      <div className="fixed bottom-20 right-4 z-[10000]">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          title="Open Voice Assistant"
        >
          <Mic className="w-6 h-6" />
        </button>
      </div>,
      document.body
    );
  }

  // Maximized view - full screen
  if (isMaximized) {
    return createPortal(
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
        className="fixed inset-0 z-[10001] bg-white dark:bg-gray-900"
      >
        <div className="h-full w-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="w-6 h-6" />
              <div>
                <h2 className="font-semibold text-lg">Voice Assistant</h2>
                <p className="text-sm text-purple-100">Speak naturally to interact</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMaximized(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <VoiceAssistantContent
              room={room}
              transcription={transcription}
              messages={messages}
              isProcessing={isProcessing}
              messagesEndRef={messagesEndRef}
            />
          </div>
        </div>
      </LiveKitRoom>,
      document.body
    );
  }

  // Normal view - floating widget
  return createPortal(
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      onConnected={handleConnected}
      onDisconnected={handleDisconnected}
      className="fixed bottom-20 right-4 z-[10000] w-96 h-[500px] bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-purple-200 dark:border-purple-800 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          <span className="font-semibold">Voice Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Maximize"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <VoiceAssistantContent
          room={room}
          transcription={transcription}
          messages={messages}
          isProcessing={isProcessing}
          messagesEndRef={messagesEndRef}
        />
      </div>
    </LiveKitRoom>,
    document.body
  );
}

/**
 * Voice Assistant Content Component
 * Displays audio visualizer, transcription, and messages
 */
function VoiceAssistantContent({ room, transcription, messages, isProcessing, messagesEndRef }) {
  // Find agent participant
  const agentParticipant = room ? Array.from(room.remoteParticipants.values())
    .find(p => p.kind === ParticipantKind.AGENT) : null;
  
  // Get agent state
  const agentState = agentParticipant?.attributes?.get('lk.agent.state') || 'initializing';
  
  // Get agent audio track
  const agentAudioTrack = agentParticipant?.audioTrackPublications.values().next().value?.track;

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !transcription && (
          <div className="text-center text-gray-500 py-8">
            <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Start speaking to interact with the assistant</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {transcription && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700">
              <p className="text-purple-900 dark:text-purple-100">{transcription}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Listening...</p>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Processing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Audio Visualizer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-center h-20 bg-white dark:bg-gray-900 rounded-lg px-4">
          <div className="flex flex-col items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              agentState === 'listening' ? 'bg-green-500 animate-pulse' :
              agentState === 'thinking' ? 'bg-yellow-500 animate-pulse' :
              agentState === 'speaking' ? 'bg-blue-500 animate-pulse' :
              'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
              {agentState === 'initializing' && 'Connecting...'}
              {agentState === 'listening' && '🎤 Listening...'}
              {agentState === 'thinking' && '🤔 Thinking...'}
              {agentState === 'speaking' && '🗣️ Speaking...'}
              {!agentParticipant && 'Waiting for agent...'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

