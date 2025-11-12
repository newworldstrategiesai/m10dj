import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, CheckCircle2, Zap, Loader, X } from 'lucide-react';

/**
 * Chat Window Component
 * Transforms the lead form into an interactive chat experience
 * Uses OpenAI GPT-4 for intelligent, contextual responses
 */
export default function ContactFormChat({ formData, onClose }) {
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

  // Initialize chat with AI greeting
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Send initial greeting from AI
        const greetingMessage = `👋 Hey ${formData.name}! Thanks so much for reaching out! I'm the lead assistant at M10 DJ Company. I'm here to help answer any questions you have about your ${formData.eventType} and our services. What can I tell you about making your day absolutely unforgettable? 🎵`;
        
        setMessages([{
          id: 1,
          type: 'bot',
          text: greetingMessage,
          timestamp: new Date()
        }]);

        conversationHistoryRef.current = [
          { role: 'assistant', content: greetingMessage }
        ];

        console.log('✅ Chat initialized with greeting');
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();
  }, [formData]);

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

      // Add assistant message to UI
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'bot',
        text: assistantText,
        timestamp: new Date()
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
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
      >
        {messages.map((message) => (
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
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.text}
              </p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

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

      {/* Info Banner */}
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Check your email for your invoice, service agreement, and next steps. Ben will reach out within 24 hours!
          </p>
        </div>
      </div>

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
          💬 We're here to help! Ask us anything.
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

