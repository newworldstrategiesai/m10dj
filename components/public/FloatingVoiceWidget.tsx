'use client';

import { useState, useRef, useEffect } from 'react';
import { PublicVoiceAssistant } from './PublicVoiceAssistant';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, X, MessageSquare, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FloatingVoiceWidgetProps {
  contactId?: string;
  phoneNumber?: string;
  context?: Record<string, any>;
  className?: string;
}

/**
 * Floating Voice Widget for Website
 * 
 * Provides a floating button that opens a voice assistant interface
 * for website visitors to interact with via voice
 */
export function FloatingVoiceWidget({
  contactId,
  phoneNumber,
  context,
  className
}: FloatingVoiceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let storedSessionId = localStorage.getItem('voice_session_id');
      if (!storedSessionId) {
        storedSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('voice_session_id', storedSessionId);
      }
      setSessionId(storedSessionId);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTranscription = (text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsProcessing(true);
  };

  const handleResponse = (response: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsProcessing(false);
  };

  const handleError = (error: Error) => {
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `Sorry, I encountered an error: ${error.message}` 
    }]);
    setIsProcessing(false);
  };

  if (!sessionId) {
    return null;
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 p-0 shadow-lg bg-[#fcba00] hover:bg-[#d99f00] text-black"
          size="lg"
        >
          <Mic className="w-6 h-6" />
        </Button>
      ) : (
        <Card className="w-96 h-[600px] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#fcba00] to-[#e6a800]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-black" />
              <h3 className="font-semibold text-black">Voice Assistant</h3>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-black hover:bg-black/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Click the microphone to start talking</p>
                <p className="text-xs mt-2">I can help you with bookings, quotes, and more!</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    msg.role === 'user'
                      ? 'bg-[#fcba00] text-black'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Assistant */}
          <div className="p-4 border-t bg-gray-50">
            <PublicVoiceAssistant
              sessionId={sessionId}
              onTranscription={handleTranscription}
              onResponse={handleResponse}
              onError={handleError}
              contactId={contactId}
              phoneNumber={phoneNumber}
              context={context}
              className="w-full"
            />
          </div>
        </Card>
      )}
    </div>
  );
}

