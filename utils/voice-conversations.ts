/**
 * Voice Conversation History Utilities
 * 
 * Handles storing and retrieving voice conversation history
 * for website assistant, calls, and admin assistant
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface VoiceMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  functionCalls?: Array<{
    name: string;
    arguments: any;
    result?: any;
  }>;
}

export interface VoiceConversation {
  id: string;
  session_id: string;
  contact_id?: string;
  phone_number?: string;
  conversation_type: 'website' | 'inbound_call' | 'outbound_call' | 'admin_assistant';
  room_name?: string;
  messages: VoiceMessage[];
  summary?: string;
  context?: Record<string, any>;
  status: 'active' | 'completed' | 'abandoned';
  started_at: string;
  last_interaction_at: string;
}

/**
 * Get or create a conversation session
 */
export async function getOrCreateConversation(
  sessionId: string,
  conversationType: VoiceConversation['conversation_type'] = 'website',
  contactId?: string,
  phoneNumber?: string,
  context?: Record<string, any>
): Promise<VoiceConversation> {
  try {
    // Try to find existing active conversation
    const { data: existing } = await supabase
      .from('voice_conversations')
      .select('*')
      .eq('session_id', sessionId)
      .eq('conversation_type', conversationType)
      .eq('status', 'active')
      .order('last_interaction_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      // Check if conversation is still recent (within 2 hours)
      const lastInteraction = new Date(existing.last_interaction_at);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      if (lastInteraction > twoHoursAgo) {
        return existing as VoiceConversation;
      } else {
        // Mark old conversation as completed
        await supabase
          .from('voice_conversations')
          .update({ status: 'completed' })
          .eq('id', existing.id);
      }
    }

    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from('voice_conversations')
      .insert({
        session_id: sessionId,
        contact_id: contactId || null,
        phone_number: phoneNumber || null,
        conversation_type: conversationType,
        messages: [],
        context: context || {},
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return newConversation as VoiceConversation;
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
}

/**
 * Add a message to a conversation
 */
export async function addMessageToConversation(
  conversationId: string,
  message: VoiceMessage
): Promise<void> {
  try {
    const { data: conversation } = await supabase
      .from('voice_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = (conversation.messages as VoiceMessage[]) || [];
    messages.push(message);

    const { error } = await supabase
      .from('voice_conversations')
      .update({
        messages,
        last_interaction_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error adding message to conversation:', error);
    throw error;
  }
}

/**
 * Get conversation history for API context
 */
export async function getConversationHistory(
  sessionId: string,
  conversationType: VoiceConversation['conversation_type'] = 'website',
  limit: number = 20
): Promise<Array<{ role: string; content: string }>> {
  try {
    const { data: conversation } = await supabase
      .from('voice_conversations')
      .select('messages')
      .eq('session_id', sessionId)
      .eq('conversation_type', conversationType)
      .eq('status', 'active')
      .order('last_interaction_at', { ascending: false })
      .limit(1)
      .single();

    if (!conversation || !conversation.messages) {
      return [];
    }

    const messages = conversation.messages as VoiceMessage[];
    
    // Convert to OpenAI format (role + content)
    return messages
      .slice(-limit) // Get last N messages
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

/**
 * Update conversation context
 */
export async function updateConversationContext(
  conversationId: string,
  context: Record<string, any>
): Promise<void> {
  try {
    const { data: conversation } = await supabase
      .from('voice_conversations')
      .select('context')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const existingContext = (conversation.context as Record<string, any>) || {};
    const mergedContext = { ...existingContext, ...context };

    const { error } = await supabase
      .from('voice_conversations')
      .update({ context: mergedContext })
      .eq('id', conversationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating conversation context:', error);
    throw error;
  }
}

/**
 * Link conversation to contact
 */
export async function linkConversationToContact(
  conversationId: string,
  contactId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('voice_conversations')
      .update({ contact_id: contactId })
      .eq('id', conversationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error linking conversation to contact:', error);
    throw error;
  }
}

/**
 * Complete a conversation
 */
export async function completeConversation(
  conversationId: string,
  summary?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('voice_conversations')
      .update({
        status: 'completed',
        summary: summary || null,
      })
      .eq('id', conversationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error completing conversation:', error);
    throw error;
  }
}

