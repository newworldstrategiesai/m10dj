/**
 * TipJar Chat Widget Component
 * 
 * Public-facing chat assistant for TipJar requests pages
 * Helps customers with questions about the admin's business and how to use TipJar
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TipJarChatWidgetProps {
  organizationId: string;
  organizationName: string;
  organizationData?: any; // Organization data for context
  accentColor?: string; // User's accent color selection
  themeMode?: 'light' | 'dark'; // Theme mode (light or dark)
  eventQrCode?: string; // Optional event QR code for looking up user requests
}

export default function TipJarChatWidget({ 
  organizationId, 
  organizationName,
  organizationData,
  accentColor = '#fcba00', // Default to yellow if not provided
  themeMode = 'dark', // Default to dark mode
  eventQrCode // Optional event QR code
}: TipJarChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Use display name (requests_header_artist_name) first, then fall back to organization name
      const displayName = organizationData?.requests_header_artist_name || organizationName;
      const greeting = `Hi! 👋 I'm here to help you with questions about ${displayName} or how to use this page. What would you like to know?`;
      const initialMessage = {
        id: 1,
        role: 'assistant' as const,
        content: greeting,
        timestamp: new Date()
      };
      setMessages([initialMessage]);
      conversationHistoryRef.current = [{ role: 'assistant', content: greeting }];
    }
  }, [isOpen, organizationName, organizationData?.requests_header_artist_name]);

  if (!isMounted || typeof document === 'undefined') {
    return null;
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Add user message to UI
    const userMessage = {
      id: messages.length + 1,
      role: 'user' as const,
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    conversationHistoryRef.current.push({ role: 'user', content: userText });

    try {
      const response = await fetch('/api/tipjar/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistoryRef.current,
          organizationId,
          organizationName,
          eventQrCode, // Pass event QR code for request lookup
          organizationData: {
            name: organizationName,
            slug: organizationData?.slug,
            requests_header_artist_name: organizationData?.requests_header_artist_name,
            requests_header_location: organizationData?.requests_header_location,
            social_links: organizationData?.social_links,
            requests_page_title: organizationData?.requests_page_title,
            requests_page_description: organizationData?.requests_page_description,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = {
        id: messages.length + 2,
        role: 'assistant' as const,
        content: data.message || 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      conversationHistoryRef.current.push({ role: 'assistant', content: assistantMessage.content });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMaximized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMaximized(false);
  };

  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && createPortal(
        <div className="fixed bottom-4 right-4 z-[9999]">
          <button
            onClick={handleOpen}
            style={{
              background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)`,
            }}
            className="flex items-center gap-2 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Ask a Question</span>
          </button>
        </div>,
        document.body
      )}

      {/* Chat widget */}
      {isOpen && createPortal(
        <Card className={`${isMaximized ? 'fixed inset-0 z-[99999]' : 'fixed bottom-4 right-4 z-[99999] w-[90vw] sm:w-96 h-[50vh]'} flex flex-col shadow-2xl border-2 ${themeMode === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'}`}>
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b text-white"
            style={{
              background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)`,
            }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">TipJar Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMaximize}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${themeMode === 'dark' ? 'bg-black' : 'bg-gray-50'}`}>
                {messages.map((msg) => {
                  // Parse message content to extract links
                  const parseMessage = (text: string) => {
                    const parts: Array<{ type: 'text' | 'link'; content: string; url?: string }> = [];
                    
                    // Pattern for markdown-style links: [text](url)
                    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                    // Pattern for plain URLs: http://... or https://...
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    
                    let lastIndex = 0;
                    let match: RegExpExecArray | null;
                    
                    // First, find markdown links
                    const markdownMatches: Array<{ start: number; end: number; text: string; url: string }> = [];
                    const regex1 = new RegExp(markdownLinkRegex);
                    while ((match = regex1.exec(text)) !== null) {
                      markdownMatches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[1],
                        url: match[2]
                      });
                    }
                    
                    // Then find plain URLs that aren't part of markdown links
                    const urlMatches: Array<{ start: number; end: number; url: string }> = [];
                    const regex2 = new RegExp(urlRegex);
                    while ((match = regex2.exec(text)) !== null) {
                      // Check if this URL is inside a markdown link
                      const isInMarkdown = markdownMatches.some(m => match !== null && match.index >= m.start && match.index < m.end);
                      if (!isInMarkdown && match !== null) {
                        urlMatches.push({
                          start: match.index,
                          end: match.index + match[0].length,
                          url: match[0]
                        });
                      }
                    }
                    
                    // Combine and sort all matches
                    const allMatches = [
                      ...markdownMatches.map(m => ({ ...m, type: 'markdown' as const })),
                      ...urlMatches.map(m => ({ ...m, type: 'url' as const, text: m.url }))
                    ].sort((a, b) => a.start - b.start);
                    
                    // If no links found, return whole text as single part
                    if (allMatches.length === 0) {
                      return [{ type: 'text', content: text }];
                    }
                    
                    // Build parts array
                    allMatches.forEach((match) => {
                      // Add text before match
                      if (match.start > lastIndex) {
                        parts.push({
                          type: 'text',
                          content: text.substring(lastIndex, match.start)
                        });
                      }
                      
                      // Add link
                      parts.push({
                        type: 'link',
                        content: match.text,
                        url: match.url
                      });
                      
                      lastIndex = match.end;
                    });
                    
                    // Add remaining text
                    if (lastIndex < text.length) {
                      parts.push({
                        type: 'text',
                        content: text.substring(lastIndex)
                      });
                    }
                    
                    return parts;
                  };
                  
                  const messageParts = parseMessage(msg.content);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'text-white'
                            : themeMode === 'dark' 
                              ? 'bg-gray-900 text-gray-100 border border-gray-700'
                              : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                        style={msg.role === 'user' ? {
                          background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)`,
                        } : {}}
                      >
                        {messageParts.map((part, index) => {
                          if (part.type === 'link' && 'url' in part && part.url) {
                            return (
                              <a
                                key={index}
                                href={part.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`underline font-semibold hover:opacity-80 ${
                                  msg.role === 'user'
                                    ? 'text-white'
                                    : themeMode === 'dark'
                                      ? 'text-gray-300'
                                      : ''
                                }`}
                                style={msg.role !== 'user' ? {
                                  color: accentColor,
                                } : {}}
                              >
                                {part.content}
                              </a>
                            );
                          }
                          return <span key={index}>{part.content}</span>;
                        })}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className={`${themeMode === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} rounded-lg px-4 py-2 flex items-center gap-2 border`}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: accentColor }} />
                      <span className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className={`p-4 border-t ${themeMode === 'dark' ? 'bg-black border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question..."
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      themeMode === 'dark'
                        ? 'border-gray-700 bg-gray-900 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                    style={{
                      '--tw-ring-color': accentColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    style={{
                      background: `linear-gradient(to right, ${accentColor}, ${accentColor}dd)`,
                    }}
                    className="hover:opacity-90"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </form>
        </Card>,
        document.body
      )}
    </>
  );
}

