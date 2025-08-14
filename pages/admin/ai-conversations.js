// Admin interface for viewing AI SMS conversations
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '../../hooks/useUser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AIConversations() {
  const { user, isLoading } = useUser();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'ai_only', 'recent'

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, filter]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('conversation_summaries')
        .select('*')
        .order('last_message', { ascending: false });

      if (filter === 'ai_only') {
        query = query.gt('ai_responses', 0);
      } else if (filter === 'recent') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        query = query.gte('last_message', yesterday.toISOString());
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (phoneNumber, sessionId) => {
    try {
      const { data, error } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('conversation_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSelectedConversation({
        phoneNumber,
        sessionId,
        messages: data || []
      });
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.substring(1);
      return `(${number.substring(0,3)}) ${number.substring(3,6)}-${number.substring(6)}`;
    }
    return phone;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const disableAI = async (phoneNumber) => {
    if (!confirm('Disable AI assistant for this customer?')) return;

    try {
      const response = await fetch('/api/admin/disable-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber })
      });

      if (response.ok) {
        alert('AI disabled for this customer');
        fetchConversations();
      } else {
        alert('Failed to disable AI');
      }
    } catch (error) {
      console.error('Error disabling AI:', error);
      alert('Error disabling AI');
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI conversations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view AI conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 AI SMS Conversations
          </h1>
          <p className="text-gray-600">
            Monitor and manage ChatGPT assistant conversations with customers
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Conversations
          </button>
          <button
            onClick={() => setFilter('ai_only')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'ai_only'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            AI Responses Only
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'recent'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Last 24 Hours
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Conversations ({conversations.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {conversations.map((conv, index) => (
                  <div
                    key={index}
                    onClick={() => fetchConversationDetails(conv.phone_number, conv.conversation_session_id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {conv.first_name && conv.last_name 
                            ? `${conv.first_name} ${conv.last_name}`
                            : formatPhoneNumber(conv.phone_number)
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatTimestamp(conv.last_message)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex space-x-2 text-xs">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {conv.inbound_messages} in
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {conv.outbound_messages} out
                          </span>
                          {conv.ai_responses > 0 && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              🤖 {conv.ai_responses}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {conv.event_type && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">
                          {conv.event_type}
                        </span>
                        {conv.event_date && (
                          <span className="text-gray-500">
                            {new Date(conv.event_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                    {conv.customer_messages && conv.customer_messages.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2 truncate">
                        Latest: "{conv.customer_messages[conv.customer_messages.length - 1]}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Conversation with {formatPhoneNumber(selectedConversation.phoneNumber)}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedConversation.messages.length} messages
                    </p>
                  </div>
                  <button
                    onClick={() => disableAI(selectedConversation.phoneNumber)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                  >
                    Disable AI
                  </button>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto space-y-4">
                  {selectedConversation.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.direction === 'inbound'
                            ? 'bg-gray-100 text-gray-900'
                            : msg.message_type === 'ai_assistant'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message_content}</p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>{formatTimestamp(msg.created_at)}</span>
                          {msg.message_type === 'ai_assistant' && (
                            <span className="bg-purple-200 text-purple-800 px-1 py-0.5 rounded">
                              🤖 AI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow flex items-center justify-center h-96">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">Select a conversation to view details</p>
                  <p className="text-sm">Click on any conversation from the list to see the full message history</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
