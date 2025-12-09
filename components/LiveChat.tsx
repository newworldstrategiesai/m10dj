'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
  is_tip?: boolean;
  tip_amount?: number;
}

interface LiveChatProps {
  roomName: string;
  currentUserId?: string;
  currentUsername?: string;
}

export function LiveChat({ roomName, currentUserId, currentUsername }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Load recent messages
    loadRecentMessages();

    // Subscribe to real-time chat updates
    const channel = supabase
      .channel(`live_chat:${roomName}`)
      .on(
        'broadcast',
        { event: 'new_message' },
        (payload) => {
          const message = payload.payload as ChatMessage;
          setMessages((prev) => [...prev, message]);
        }
      )
      .on(
        'broadcast',
        { event: 'new_tip' },
        (payload) => {
          // Add tip message to chat
          const tipData = payload.payload;
          const tipMessage: ChatMessage = {
            id: `tip-${Date.now()}`,
            username: tipData.name || 'Anonymous',
            message: tipData.message || `Tipped $${tipData.amount?.toFixed(2)}!`,
            created_at: new Date().toISOString(),
            is_tip: true,
            tip_amount: tipData.amount,
          };
          setMessages((prev) => [...prev, tipMessage]);
          
          // Scroll to bottom to show new tip
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomName, supabase]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadRecentMessages() {
    // Load last 50 messages from database (optional - you can create a chat_messages table)
    // For now, we'll just use real-time broadcasts
  }

  async function sendMessage() {
    if (!newMessage.trim() || !currentUserId) return;

    setLoading(true);
    try {
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        username: currentUsername || 'Anonymous',
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
      };

      // Broadcast to all viewers
      await channelRef.current?.send({
        type: 'broadcast',
        event: 'new_message',
        payload: message,
      });

      // Add to local state
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Live Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded-lg ${
                msg.is_tip
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white text-sm">
                  {msg.username}
                </span>
                {msg.is_tip && (
                  <span className="text-xs text-green-400 font-bold">
                    💰 ${msg.tip_amount?.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-200 text-sm">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {currentUserId && (
        <div className="p-4 border-t border-gray-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-800 border-gray-700 text-white"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !newMessage.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

