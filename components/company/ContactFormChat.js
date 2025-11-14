import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, CheckCircle2, Zap, Loader, X, Minimize2, Maximize2 } from 'lucide-react';

/**
 * Chat Window Component
 * Transforms the lead form into an interactive chat experience
 * Uses OpenAI GPT-4 for intelligent, contextual responses
 */
export default function ContactFormChat({ formData, submissionId, onClose, isMinimized, onMinimize, isMicro = false }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const conversationHistoryRef = useRef([]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // State for info banner visibility
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Initialize chat with AI greeting
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Send initial greeting from AI - more casual and natural
        const greetingMessage = `Hey ${formData.name.split(' ')[0]}! 👋 Thanks for reaching out about your ${formData.eventType || 'event'}. I'm here to help with any questions you have about our DJ services. What would you like to know?`;
        
        const initialMessages = [{
          id: 1,
          type: 'bot',
          text: greetingMessage,
          timestamp: new Date()
        }];

        // Add personalized service selection link for any event type with valid submissionId
        const eventType = formData.eventType?.toLowerCase() || '';
        const isWedding = eventType.includes('wedding');
        const isCorporate = eventType.includes('corporate') || eventType.includes('business');
        const isSchool = eventType.includes('school') || eventType.includes('dance') || eventType.includes('prom') || eventType.includes('homecoming');
        
        // Only show quote link if we have a valid submissionId
        if (submissionId) {
          // Ensure submissionId is a valid string
          const quoteId = String(submissionId).trim();
          if (quoteId && quoteId !== 'null' && quoteId !== 'undefined' && quoteId !== '') {
            console.log('✅ Creating quote link with ID:', quoteId);
            
            let linkMessage = '';
            let linkText = '';
            
            if (isWedding) {
              linkMessage = `We've prepared a service selection page for you! Check it out to see our wedding packages and add-ons:`;
              linkText = 'View Your Wedding Services Page →';
            } else if (isCorporate) {
              linkMessage = `We've prepared a service selection page for you! Check it out to see our corporate event packages:`;
              linkText = 'View Your Corporate Services Page →';
            } else if (isSchool) {
              linkMessage = `We've prepared a service selection page for you! Check it out to see our school dance packages:`;
              linkText = 'View Your School Event Services Page →';
            } else {
              linkMessage = `We've prepared a service selection page for you! Check it out to see our packages:`;
              linkText = 'View Your Services Page →';
            }
            
            initialMessages.push({
              id: 2,
              type: 'bot',
              text: linkMessage,
              timestamp: new Date(),
              hasLink: true,
              link: `/quote/${quoteId}`,
              linkText: linkText
            });
          } else {
            console.error('❌ Invalid quote ID:', quoteId, '(original:', submissionId, ')');
          }
        }

        setMessages(initialMessages);

        conversationHistoryRef.current = [
          { role: 'assistant', content: greetingMessage }
        ];

        console.log('✅ Chat initialized with greeting + service selection link');
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();
  }, [formData, submissionId]);

  // Auto-hide info banner after 5 seconds
  useEffect(() => {
    if (showInfoBanner) {
      const timer = setTimeout(() => {
        setShowInfoBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showInfoBanner]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    
    // Add user message to UI
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Add user message to conversation history
      conversationHistoryRef.current.push({
        role: 'user',
        content: userText
      });

      // Call AI endpoint
      console.log('📤 Sending message to AI assistant...');
      const response = await fetch('/api/leads/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistoryRef.current,
          leadData: formData
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.message;

      // Add assistant message to UI with link if provided
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        text: assistantText,
        timestamp: new Date(),
        hasLink: data.hasLink,
        link: data.link,
        linkText: data.link ? '👉 View Your Packages' : null
      }]);

      // Add to conversation history
      conversationHistoryRef.current.push({
        role: 'assistant',
        content: assistantText
      });

      console.log('✅ AI response received');
      if (data.usage) {
        console.log('Token usage:', data.usage.total_tokens);
      }
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      
      // Fallback response
      const fallbackMessages = [
        "That's a great question! Ben is going to love discussing this with you in detail. Is there anything else I can help with?",
        "I appreciate you sharing that! Our team will make sure to cover all the details when Ben reaches out within 24 hours.",
        "Perfect! That helps me understand your vision better. What else would you like to know about our services?"
      ];

      const fallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        text: fallback,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we're on the quote page and auto-minimize on mount (only if not already in micro view)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isMicro) {
      const checkAndMinimize = () => {
        const isQuotePage = window.location.pathname.includes('/quote/');
        if (isQuotePage && !isMinimized && !isMicro) {
          // Auto-minimize when on quote page (but only if not already in micro view)
          if (onMinimize) {
            onMinimize();
          }
        }
      };
      
      // Delay check to avoid interfering with initial open
      const timer = setTimeout(checkAndMinimize, 300);
      
      // Also listen for navigation changes (for client-side routing)
      const handleRouteChange = () => {
        setTimeout(checkAndMinimize, 100);
      };
      
      window.addEventListener('popstate', handleRouteChange);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [isMinimized, onMinimize, isMicro]);

  // If minimized, show compact widget (icon only)
  if (isMinimized && !isMicro) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] animate-fadeIn">
        <button
          onClick={() => onMinimize && onMinimize()}
          className="flex items-center gap-2 bg-gradient-to-r from-brand to-brand-600 text-white px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="font-medium hidden sm:inline">Chat</span>
          {messages.length > 1 && (
            <span className="bg-white text-brand rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {messages.length - 1}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Micro view - compact chat window (for service selection page)
  if (isMicro) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] w-80 h-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-brand/20 flex flex-col overflow-hidden animate-fadeIn">
        {/* Micro Header */}
        <div className="bg-gradient-to-r from-brand to-brand-600 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">M10 DJ Assistant</span>
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          </div>
          <div className="flex items-center gap-1">
            {onMinimize && (
              <button
                onClick={() => onMinimize && onMinimize()}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Minimize chat"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close chat"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Micro Messages Container */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-800"
        >
          {messages.map((message) => {
            const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\s]+)/gi;
            const urls = message.text.match(urlRegex) || [];
            let textParts = [];
            let lastIndex = 0;
            
            urls.forEach((url) => {
              const index = message.text.indexOf(url, lastIndex);
              if (index > lastIndex) {
                textParts.push({ type: 'text', content: message.text.substring(lastIndex, index) });
              }
              textParts.push({ type: 'url', content: url });
              lastIndex = index + url.length;
            });
            if (lastIndex < message.text.length) {
              textParts.push({ type: 'text', content: message.text.substring(lastIndex) });
            }
            if (textParts.length === 0) {
              textParts.push({ type: 'text', content: message.text });
            }

            return (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.type === 'user'
                      ? 'bg-brand text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div>
                    {textParts.map((part, idx) => {
                      if (part.type === 'url') {
                        const isInternal = part.content.startsWith('/');
                        return (
                          <a
                            key={idx}
                            href={part.content}
                            onClick={(e) => {
                              e.preventDefault();
                              if (onMinimize) onMinimize();
                              if (isInternal) {
                                window.location.href = part.content;
                              } else {
                                window.open(part.content, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="underline font-semibold hover:opacity-80"
                          >
                            {part.content} →
                          </a>
                        );
                      }
                      return <span key={idx}>{part.content}</span>;
                    })}
                  </div>
                  {message.hasLink && message.link && (
                    <a
                      href={message.link}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onMinimize) onMinimize();
                        window.location.href = message.link;
                      }}
                      className="inline-block mt-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded text-xs font-semibold transition-colors"
                    >
                      {message.linkText || 'View Services'} →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg rounded-bl-none border border-gray-200 dark:border-gray-600 flex items-center space-x-2">
                <Loader className="w-3 h-3 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Micro Input Area */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 bg-brand text-white rounded-lg flex items-center justify-center hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-brand to-brand-600 text-white p-4 sm:p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">M10 DJ Assistant</h3>
            <p className="text-sm text-white/80 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Online now
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Minimize chat"
              title="Minimize chat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
      >
        {messages.map((message) => {
          // Extract URLs from message text
          const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\/[^\s]+)/gi;
          const urls = message.text.match(urlRegex) || [];
          let textParts = [];
          let lastIndex = 0;
          
          // Split text by URLs to preserve non-URL text
          urls.forEach((url) => {
            const index = message.text.indexOf(url, lastIndex);
            if (index > lastIndex) {
              textParts.push({ type: 'text', content: message.text.substring(lastIndex, index) });
            }
            // Normalize URL (add https if missing)
            const normalizedUrl = url.startsWith('http') ? url : (url.startsWith('/') ? url : `https://${url}`);
            textParts.push({ type: 'url', content: url, normalizedUrl });
            lastIndex = index + url.length;
          });
          
          if (lastIndex < message.text.length) {
            textParts.push({ type: 'text', content: message.text.substring(lastIndex) });
          }
          
          // If no URLs found, use original text
          if (textParts.length === 0) {
            textParts = [{ type: 'text', content: message.text }];
          }

          return (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] sm:max-w-xl px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-brand text-white rounded-br-none shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700 shadow-sm'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {textParts.map((part, idx) => {
                    if (part.type === 'url') {
                      return (
                        <a
                          key={idx}
                          href={part.normalizedUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            // Validate link before navigating
                            if (!part.normalizedUrl || part.normalizedUrl.includes('null') || part.normalizedUrl.includes('undefined')) {
                              console.error('Invalid link:', part.normalizedUrl);
                              alert('Sorry, there was an issue loading that page. Please contact us directly at (901) 410-2020.');
                              return;
                            }
                            // Minimize the chat so user can browse the page
                            if (onMinimize) {
                              onMinimize();
                            }
                            // On mobile, use window.location for better compatibility
                            // On desktop, open in new tab for external URLs, same tab for internal
                            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                            const isInternal = part.normalizedUrl.startsWith('/');
                            
                            if (isMobile || isInternal) {
                              window.location.href = part.normalizedUrl;
                            } else {
                              window.open(part.normalizedUrl, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className="inline-block mt-2 px-4 py-2 bg-brand hover:bg-brand-600 text-white rounded-lg font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                        >
                          {part.content} →
                        </a>
                      );
                    }
                    return <span key={idx}>{part.content}</span>;
                  })}
                </div>
                {message.hasLink && message.link && (
                  <a
                    href={message.link}
                    onClick={(e) => {
                      e.preventDefault();
                      // Validate link before navigating
                      if (!message.link || message.link.includes('null') || message.link.includes('undefined')) {
                        console.error('Invalid quote link:', message.link);
                        alert('Sorry, there was an issue loading your quote page. Please contact us directly at (901) 410-2020.');
                        return;
                      }
                      // Minimize the chat so user can browse the page
                      if (onMinimize) {
                        onMinimize();
                      }
                      // Store chat state in sessionStorage so it persists across navigation
                      try {
                        sessionStorage.setItem('chat_minimized', 'true');
                        sessionStorage.setItem('chat_submission_id', String(submissionId || ''));
                        sessionStorage.setItem('chat_form_data', JSON.stringify(formData));
                      } catch (e) {
                        console.warn('Could not save chat state to sessionStorage:', e);
                      }
                      // Navigate in the same tab (not new tab) so chat can persist
                      window.location.href = message.link;
                    }}
                    className="inline-block mt-3 px-4 py-2 bg-brand hover:bg-brand-600 text-white rounded-lg font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                  >
                    {message.linkText || 'View Services'} →
                  </a>
                )}
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3 rounded-lg rounded-bl-none border border-gray-200 dark:border-gray-700 flex items-center space-x-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Assistant is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Info Banner - Auto-fades after 5 seconds */}
      {showInfoBanner && (
        <div className={`px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 transition-opacity duration-500 ${showInfoBanner ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-start space-x-3">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Check your email for your invoice, service agreement, and next steps. Ben will reach out within 24 hours!
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question or share details..."
            className="flex-1 px-5 py-3 text-base rounded-full border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          💬 We&apos;re here to help! Ask us anything.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-semibold">Quick actions:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.location.href = 'tel:+19014102020'}
            className="text-sm px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-brand transition-all"
          >
            📞 Call Now
          </button>
          <button
            onClick={() => setInputValue('Tell me more about your packages')}
            className="text-sm px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-brand transition-all"
          >
            📦 Packages
          </button>
          <button
            onClick={() => setInputValue('What are your add-ons?')}
            className="text-sm px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-brand transition-all"
          >
            ✨ Add-ons
          </button>
        </div>
      </div>
    </div>
  );
}

