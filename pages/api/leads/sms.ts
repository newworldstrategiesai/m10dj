/**
 * Twilio SMS Webhook Handler
 * Receives incoming SMS messages and routes to AI assistant
 * Sends intelligent responses back via SMS
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const openaiApiKey = process.env.OPENAI_API_KEY;
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

interface SMSMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse Twilio webhook data
    const { From, To, Body, MessageSid } = req.body;

    if (!From || !Body) {
      console.warn('⚠️ Invalid Twilio SMS data received');
      return res.status(400).json({ error: 'Invalid SMS data' });
    }

    console.log(`📱 SMS received from ${From}: "${Body}"`);

    // Find or create lead by phone number
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email_address, event_type, event_date, venue_name, guest_count, phone')
      .eq('phone', From)
      .single();

    if (contactError && contactError.code !== 'PGRST116') {
      console.error('❌ Error fetching contact:', contactError);
    }

    if (!contact) {
      // Unknown number - send helpful response
      console.log(`ℹ️ SMS from unknown number: ${From}`);
      await sendSMSResponse(
        From,
        "👋 Hi! Thanks for reaching out to M10 DJ Company! To help you better, could you reply with your name? Or visit m10djcompany.com/contact to tell us about your event."
      );
      return res.status(200).send('');
    }

    // Get or create SMS conversation history
    const { data: conversation, error: convError } = await supabase
      .from('sms_conversations')
      .select('*')
      .eq('contact_id', contact.id)
      .single();

    let conversationId = conversation?.id;
    let messageHistory: SMSMessage[] = conversation?.messages || [];

    // Add incoming message to history
    messageHistory.push({
      role: 'user',
      content: Body,
      timestamp: new Date().toISOString()
    });

    try {
      // Get AI response
      const aiResponse = await getAIResponse(
        Body,
        messageHistory,
        contact
      );

      // Add AI response to history
      messageHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });

      // Truncate message history to last 10 messages to save storage
      if (messageHistory.length > 10) {
        messageHistory = messageHistory.slice(-10);
      }

      // Save or update conversation
      if (conversationId) {
        await supabase
          .from('sms_conversations')
          .update({
            messages: messageHistory,
            last_message_at: new Date().toISOString(),
            last_message_from: 'assistant'
          })
          .eq('id', conversationId);
      } else {
        const { data: newConv } = await supabase
          .from('sms_conversations')
          .insert({
            contact_id: contact.id,
            phone_number: From,
            messages: messageHistory,
            last_message_at: new Date().toISOString(),
            last_message_from: 'assistant'
          })
          .select()
          .single();

        conversationId = newConv?.id;
      }

      // Split response into SMS-friendly chunks (160 chars max)
      const smsChunks = splitSMSMessage(aiResponse);

      // Send each chunk as a separate SMS
      for (const chunk of smsChunks) {
        await sendSMSResponse(From, chunk);
      }

      console.log(`✅ SMS response sent to ${From}`);
    } catch (aiError) {
      console.error('❌ Error getting AI response:', aiError);

      // Send fallback response
      const fallback = "Thanks for your message! Ben will get back to you within 24 hours. In the meantime, call (901) 410-2020 if you have urgent questions! 🎵";
      await sendSMSResponse(From, fallback);
    }

    // Log SMS activity
    await supabase.from('activity_log').insert({
      contact_id: contact.id,
      activity_type: 'sms_received',
      description: `SMS from ${From}: "${Body.substring(0, 100)}"`,
      metadata: { message_sid: MessageSid }
    }).catch(err => console.error('Error logging activity:', err));

    // Return 200 OK to Twilio
    res.status(200).send('');
  } catch (error) {
    console.error('❌ SMS handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get AI response for SMS
 */
async function getAIResponse(
  userMessage: string,
  messageHistory: SMSMessage[],
  leadData: any
): Promise<string> {
  const systemPrompt = buildSMSSystemPrompt(leadData);

  // Convert message history to OpenAI format
  const conversationMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messageHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))
  ];

  console.log('📤 Sending SMS to OpenAI...');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 150, // Keep SMS responses short
      top_p: 0.95
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ OpenAI API Error:', error);
    throw new Error('OpenAI API failed');
  }

  const data = await response.json();
  const aiResponse = data.choices[0]?.message?.content || getFallbackSMSResponse();

  return aiResponse;
}

/**
 * Build system prompt optimized for SMS
 */
function buildSMSSystemPrompt(leadData: any): string {
  return `You are a friendly lead assistant for M10 DJ Company via SMS text messaging.

COMPANY:
- M10 DJ Company (Memphis, TN)
- Phone: (901) 410-2020
- Website: m10djcompany.com
- Owner: Ben

LEAD INFO:
- Name: ${leadData.first_name} ${leadData.last_name}
- Event: ${leadData.event_type || 'Not specified'} on ${leadData.event_date || 'TBD'}
- Venue: ${leadData.venue_name || 'Not specified'}
- Guests: ${leadData.guest_count || 'Not specified'}

PACKAGES:
- Package 1: Reception Only - $2,000
- Package 2: Reception + Ceremony - $2,500
- Package 3: Full Service - $3,000

GUIDELINES:
- Keep responses SHORT (1-2 sentences max for SMS)
- Use conversational, friendly tone
- Include relevant emojis sparingly
- Answer questions about packages/pricing
- Mention Ben will follow up within 24 hours
- Direct complex issues to phone call
- NEVER be robotic or overly formal
- ALWAYS be helpful and enthusiastic

Keep it brief - you're texting, not writing emails!`;
}

/**
 * Send SMS response via Twilio
 */
async function sendSMSResponse(toNumber: string, message: string): Promise<void> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.error('❌ Twilio credentials not configured');
    return;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(twilioAccountSid, twilioAuthToken);

    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: toNumber
    });

    console.log(`✅ SMS sent to ${toNumber}`);
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    throw error;
  }
}

/**
 * Split long messages into SMS chunks (160 char limit)
 */
function splitSMSMessage(message: string): string[] {
  const maxLength = 160;
  const chunks: string[] = [];
  let currentChunk = '';

  const words = message.split(' ');

  for (const word of words) {
    if ((currentChunk + ' ' + word).length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = word;
    }
  }

  if (currentChunk) chunks.push(currentChunk);

  return chunks.length === 0 ? [message.substring(0, maxLength)] : chunks;
}

/**
 * Get fallback SMS response
 */
function getFallbackSMSResponse(): string {
  const responses = [
    "Great question! I'll make sure Ben knows about that. Any other questions? 🎵",
    "Love the enthusiasm! Ben will chat with you soon. Anything else? 📱",
    "Got it! We'll make sure to include that. What else? 🎉",
    "Perfect! Ben will discuss all the details soon. Questions? 💬"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

