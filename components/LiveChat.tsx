'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Trash2, Ban, Shield, MoreVertical, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  stream_id: string;
  user_id: string | null;
  username: string;
  message: string;
  is_deleted: boolean;
  is_banned: boolean;
  banned_until?: string | null;
  is_moderator: boolean;
  is_streamer: boolean;
  created_at: string;
  is_tip?: boolean;
  tip_amount?: number;
}

interface LiveChatProps {
  streamId: string;
  roomName: string;
  currentUserId?: string | null;
  currentUsername?: string | null;
  isStreamer?: boolean;
  isModerator?: boolean;
}

export function LiveChat({ 
  streamId, 
  roomName, 
  currentUserId, 
  currentUsername,
  isStreamer = false,
  isModerator = false 
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Check if user is banned
    checkBanStatus();
    
    // Load recent messages
    loadRecentMessages();

    // Subscribe to real-time chat updates
    const channel = supabase
      .channel(`live_chat:${roomName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_stream_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload: any) => {
          const message = payload.new as ChatMessage;
          if (!message.is_deleted && (!message.is_banned || message.banned_until && new Date(message.banned_until) < new Date())) {
            setMessages((prev) => [...prev, message]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_stream_messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload: any) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .on(
        'broadcast',
        { event: 'new_tip' },
        (payload: any) => {
          // Add tip message to chat
          const tipData = payload.payload;
          const tipMessage: ChatMessage = {
            id: `tip-${Date.now()}`,
            stream_id: streamId,
            user_id: null,
            username: tipData.name || 'Anonymous',
            message: tipData.message || `Tipped $${tipData.amount?.toFixed(2)}!`,
            created_at: new Date().toISOString(),
            is_deleted: false,
            is_banned: false,
            is_moderator: false,
            is_streamer: false,
            is_tip: true,
            tip_amount: tipData.amount,
          };
          setMessages((prev) => [...prev, tipMessage]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [streamId, roomName, supabase]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function checkBanStatus() {
    if (!currentUserId) return;

    const { data, error } = await supabase
      .from('live_stream_banned_users')
      .select('*')
      .eq('stream_id', streamId)
      .eq('user_id', currentUserId)
      .single();

    if (data && !error) {
      const banData = data as { is_permanent?: boolean; banned_until?: string | null };
      if (banData.is_permanent || (banData.banned_until && new Date(banData.banned_until) > new Date())) {
        setIsBanned(true);
      }
    }
  }

  async function loadRecentMessages() {
    try {
      const { data, error } = await supabase
        .from('live_stream_messages')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      if (data) {
        // Filter out banned messages
        const filtered = (data as any[]).filter(
          (msg: any) => !msg.is_banned || (msg.banned_until && new Date(msg.banned_until) < new Date())
        );
        setMessages(filtered as ChatMessage[]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !currentUserId || isBanned) return;

    setLoading(true);
    try {
      // Check if user is banned before sending
      const { data: banData, error: banError } = await supabase
        .from('live_stream_banned_users')
        .select('*')
        .eq('stream_id', streamId)
        .eq('user_id', currentUserId)
        .single();

      if (banData && !banError) {
        const ban = banData as { is_permanent?: boolean; banned_until?: string | null };
        if (ban.is_permanent || (ban.banned_until && new Date(ban.banned_until) > new Date())) {
          alert('You are banned from this chat.');
          setIsBanned(true);
          setLoading(false);
          return;
        }
      }

      // Sanitize message
      const sanitizedMessage = newMessage.trim().substring(0, 500);

      const { data, error } = await (supabase
        .from('live_stream_messages') as any)
        .insert({
          stream_id: streamId,
          user_id: currentUserId,
          username: currentUsername || 'Anonymous',
          message: sanitizedMessage,
          is_streamer: isStreamer,
          is_moderator: isModerator,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      } else {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function deleteMessage(messageId: string) {
    if (!isStreamer && !isModerator) return;

    try {
      const { error } = await (supabase
        .from('live_stream_messages') as any)
        .update({
          is_deleted: true,
          deleted_by: currentUserId || null,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message.');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }

  async function banUser(userId: string | null, username: string, durationMinutes?: number) {
    if (!isStreamer && !isModerator) return;
    if (!userId) {
      alert('Cannot ban anonymous users.');
      return;
    }

    try {
      const bannedUntil = durationMinutes
        ? new Date(Date.now() + durationMinutes * 60 * 1000).toISOString()
        : null;

      const { error } = await (supabase
        .from('live_stream_banned_users') as any)
        .upsert({
          stream_id: streamId,
          user_id: userId,
          username: username,
          banned_by: currentUserId || null,
          banned_until: bannedUntil,
          is_permanent: !durationMinutes,
          reason: `Banned by ${isStreamer ? 'streamer' : 'moderator'}`,
        });

      if (error) {
        console.error('Error banning user:', error);
        alert('Failed to ban user.');
      } else {
        // Mark user's messages as banned
        await (supabase
          .from('live_stream_messages') as any)
          .update({
            is_banned: true,
            banned_until: bannedUntil,
            banned_by: currentUserId || null,
          })
          .eq('stream_id', streamId)
          .eq('user_id', userId);

        alert(`User ${username} has been ${durationMinutes ? `banned for ${durationMinutes} minutes` : 'permanently banned'}.`);
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  }

  function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  }

  const canModerate = isStreamer || isModerator;

  return (
    <div className="flex flex-col h-full bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Live Chat</h3>
        {canModerate && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Shield className="h-4 w-4" />
            <span>Moderator</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Be the first to chat!
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.is_deleted) {
              return (
                <div key={msg.id} className="text-center text-gray-500 text-sm italic py-2">
                  Message deleted
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`group p-2 rounded-lg ${
                  msg.is_tip
                    ? 'bg-green-900/30 border border-green-700'
                    : msg.is_streamer
                    ? 'bg-purple-900/30 border border-purple-700'
                    : msg.is_moderator
                    ? 'bg-blue-900/30 border border-blue-700'
                    : 'bg-gray-800/50'
                } hover:bg-gray-800/70 transition-colors`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-semibold text-sm ${
                        msg.is_streamer ? 'text-purple-400' :
                        msg.is_moderator ? 'text-blue-400' :
                        'text-white'
                      }`}>
                        {msg.username}
                        {msg.is_streamer && ' 👑'}
                        {msg.is_moderator && ' 🛡️'}
                      </span>
                      {msg.is_tip && (
                        <span className="text-xs text-green-400 font-bold">
                          💰 ${msg.tip_amount?.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-200 text-sm break-words">{msg.message}</p>
                  </div>
                  {canModerate && !msg.is_tip && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuItem
                          onClick={() => deleteMessage(msg.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Message
                        </DropdownMenuItem>
                        {msg.user_id && (
                          <>
                            <DropdownMenuItem
                              onClick={() => banUser(msg.user_id, msg.username, 10)}
                              className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Timeout 10min
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => banUser(msg.user_id, msg.username, 60)}
                              className="text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Timeout 1hr
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => banUser(msg.user_id, msg.username)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban Permanently
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {currentUserId && !isBanned ? (
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
              className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              disabled={loading}
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={loading || !newMessage.trim()}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : isBanned ? (
        <div className="p-4 border-t border-gray-800 bg-red-900/20">
          <p className="text-red-400 text-sm text-center">
            You are banned from this chat.
          </p>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            Sign in to chat
          </p>
        </div>
      )}
    </div>
  );
}
