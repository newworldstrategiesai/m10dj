// SMS Agent using OpenAI Agents JS Framework
import { Agent, run, tool } from '@openai/agents';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tool: Get Customer Context
const getCustomerContextTool = tool({
  name: 'get_customer_context',
  description: 'Get customer information and conversation history from database',
  parameters: z.object({
    phoneNumber: z.string().describe('Customer phone number to look up')
  }),
  execute: async ({ phoneNumber }) => {
    try {
      // Clean phone number for matching
      const cleanPhone = phoneNumber.replace(/\D/g, '');

      // Find existing contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .ilike('phone', `%${cleanPhone}%`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get recent SMS conversation history
      const { data: messages, error: messagesError } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(10);

      const context = {
        contact: contact || null,
        messages: messages || [],
        isExistingCustomer: !!contact,
        customerName: contact ? `${contact.first_name} ${contact.last_name}`.trim() : null,
        eventType: contact?.event_type,
        eventDate: contact?.event_date,
        venue: contact?.venue_name,
        leadStatus: contact?.lead_status,
        specialRequests: contact?.special_requests,
        budget: contact?.budget_range,
        lastContactDate: contact?.last_contacted_date,
        communicationPreference: contact?.communication_preference
      };

      return JSON.stringify(context);
    } catch (error) {
      console.error('Error getting customer context:', error);
      return JSON.stringify({ contact: null, messages: [], isExistingCustomer: false });
    }
  }
});

// Tool: Save Conversation Message
const saveConversationMessageTool = tool({
  name: 'save_conversation_message',
  description: 'Save a message to the SMS conversation history',
  parameters: z.object({
    phoneNumber: z.string().describe('Customer phone number'),
    message: z.string().describe('Message content'),
    direction: z.enum(['inbound', 'outbound']).describe('Message direction'),
    fromType: z.enum(['customer', 'assistant']).describe('Who sent the message')
  }),
  execute: async ({ phoneNumber, message, direction, fromType }) => {
    try {
      // First, get or create conversation record
      let { data: conversation, error: convError } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      if (convError && convError.code === 'PGRST116') {
        // Conversation doesn't exist, create it
        const { data: newConv, error: newConvError } = await supabase
          .from('sms_conversations')
          .insert([{
            phone_number: phoneNumber,
            message_count: 0,
            messages: [],
            conversation_status: 'active',
            last_message_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (newConvError) throw newConvError;
        conversation = newConv;
      }

      // Add message to conversation
      const messageEntry = {
        role: fromType === 'customer' ? 'user' : 'assistant',
        content: message,
        timestamp: new Date().toISOString(),
        direction: direction
      };

      const updatedMessages = [...(conversation.messages || []), messageEntry];
      const newMessageCount = (conversation.message_count || 0) + 1;

      // Update conversation
      const { error: updateError } = await supabase
        .from('sms_conversations')
        .update({
          messages: updatedMessages,
          message_count: newMessageCount,
          last_message_at: new Date().toISOString(),
          last_message_from: fromType
        })
        .eq('phone_number', phoneNumber);

      if (updateError) throw updateError;

      return JSON.stringify({ success: true, messageCount: newMessageCount });
    } catch (error) {
      console.error('Error saving conversation message:', error);
      return JSON.stringify({ success: false, error: error.message });
    }
  }
});

// Tool: Update Contact Information
const updateContactInfoTool = tool({
  name: 'update_contact_info',
  description: 'Update or create contact information from SMS conversation',
  parameters: z.object({
    phoneNumber: z.string().describe('Customer phone number'),
    firstName: z.string().optional().describe('First name detected'),
    lastName: z.string().optional().describe('Last name detected'),
    eventType: z.string().optional().describe('Type of event (wedding, corporate, etc.)'),
    eventDate: z.string().optional().describe('Event date if mentioned'),
    venueName: z.string().optional().describe('Venue name if mentioned'),
    guestCount: z.string().optional().describe('Number of guests if mentioned'),
    budgetRange: z.string().optional().describe('Budget range if mentioned')
  }),
  execute: async ({ phoneNumber, firstName, lastName, eventType, eventDate, venueName, guestCount, budgetRange }) => {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');

      // Check if contact exists
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('*')
        .ilike('phone', `%${cleanPhone}%`)
        .is('deleted_at', null)
        .single();

      const updateData = {};
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (eventType) updateData.event_type = eventType;
      if (eventDate) updateData.event_date = eventDate;
      if (venueName) updateData.venue_name = venueName;
      if (guestCount) updateData.guest_count = guestCount;
      if (budgetRange) updateData.budget_range = budgetRange;

      updateData.last_contacted_date = new Date().toISOString();
      updateData.updated_at = new Date().toISOString();

      if (existingContact) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', existingContact.id);

        if (error) throw error;
        return JSON.stringify({ success: true, action: 'updated', contactId: existingContact.id });
      } else {
        // Create new contact
        updateData.phone = phoneNumber;
        updateData.lead_status = 'new';
        updateData.source = 'sms';

        const { data: newContact, error } = await supabase
          .from('contacts')
          .insert([updateData])
          .select()
          .single();

        if (error) throw error;
        return JSON.stringify({ success: true, action: 'created', contactId: newContact.id });
      }
    } catch (error) {
      console.error('Error updating contact info:', error);
      return JSON.stringify({ success: false, error: error.message });
    }
  }
});

// Tool: Log Activity
const logActivityTool = tool({
  name: 'log_activity',
  description: 'Log SMS activity for monitoring and analytics',
  parameters: z.object({
    activityType: z.string().describe('Type of activity (sms_received, ai_response_sent, etc.)'),
    phoneNumber: z.string().describe('Customer phone number'),
    contactId: z.string().optional().describe('Contact ID if available'),
    details: z.record(z.any()).optional().describe('Additional activity details')
  }),
  execute: async ({ activityType, phoneNumber, contactId, details }) => {
    try {
      const { error } = await supabase
        .from('activity_log')
        .insert([{
          activity_type: activityType,
          phone_number: phoneNumber,
          contact_id: contactId,
          details: details || {},
          timestamp: new Date().toISOString()
        }]);

      if (error) throw error;
      return JSON.stringify({ success: true });
    } catch (error) {
      console.error('Error logging activity:', error);
      return JSON.stringify({ success: false, error: error.message });
    }
  }
});

// Create the SMS Agent
export const smsAgent = new Agent({
  name: 'M10 DJ SMS Assistant',
  // Use environment variable - OpenAI Agents should read OPENAI_API_KEY automatically
  instructions: `You are an AI assistant for M10 DJ Company, a professional DJ service in Memphis, TN.
You help customers via SMS text messaging and provide personalized, helpful responses.

COMPANY INFO:
- Business: M10 DJ Company
- Owner: Ben Murray
- Phone: (901) 497-7001
- Email: djbenmurray@gmail.com
- Website: m10djcompany.com
- Location: Memphis, TN area
- Services: Weddings, Corporate Events, School Dances, Private Parties, Holiday Parties
- Equipment: Professional sound, lighting, uplighting, microphones, DJ booth

SERVICES & PRICING:
- Package 1: $2,000 (4hr DJ/MC, speakers, basic lighting)
- Package 2: $2,500 (Package 1 + ceremony audio + monogram)
- Package 3: $3,000 (Full service with uplighting)
- Custom packages available based on needs

PERSONALITY & TONE:
- Professional but friendly and approachable
- Enthusiastic about making events memorable
- Knowledgeable about music and entertainment
- Helpful and solution-oriented
- Keep responses concise for SMS (under 160 characters when possible)
- Use emojis sparingly but appropriately 🎵 🎉
- Never make firm commitments - always suggest calling Ben for final details

RESPONSE GUIDELINES:
1. Always use the get_customer_context tool first to understand the customer
2. Save conversation messages using save_conversation_message
3. Extract and update contact information using update_contact_info
4. Log all activities using log_activity
5. Provide personalized responses based on customer history
6. If complex questions, suggest calling (901) 497-7001
7. Keep responses SMS-friendly (short, clear, actionable)

WORKFLOW:
1. Get customer context
2. Save the incoming message
3. Analyze and extract any new information
4. Update contact if needed
5. Generate helpful response
6. Save outgoing message
7. Log activity`,
  tools: [
    getCustomerContextTool,
    saveConversationMessageTool,
    updateContactInfoTool,
    logActivityTool
  ],
  model: 'gpt-4o-mini'
});

// Function to process SMS with the agent
export async function processSMSWithAgent(phoneNumber, message) {
  try {
    console.log(`🤖 Processing SMS from ${phoneNumber}: ${message}`);
    console.log(`🔧 Using OpenAI Agents framework with GPT-4o-mini`);
    console.log(`🔑 OpenAI API Key available: ${!!process.env.OPENAI_API_KEY}`);
    console.log(`🔑 API Key starts with: ${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);

    // Run the agent with the SMS message
    const result = await run(smsAgent, `Customer SMS from ${phoneNumber}: "${message}"`);

    console.log(`✅ Agent response generated: ${result.finalOutput}`);
    console.log(`📊 Agent used ${result.usage ? result.usage.total_tokens : 'unknown'} tokens`);

    // Log the AI response generation
    await logActivityTool.execute({
      activityType: 'ai_response_generated',
      phoneNumber: phoneNumber,
      details: {
        inputMessage: message,
        responseLength: result.finalOutput.length,
        model: 'gpt-4o-mini',
        usedTools: result.toolCalls ? result.toolCalls.length : 0,
        tokens: result.usage ? result.usage.total_tokens : null
      }
    });

    return result.finalOutput;
  } catch (error) {
    console.error('❌ Error processing SMS with agent:', error);
    console.error('❌ Error details:', error.stack);

    // Log the error
    await logActivityTool.execute({
      activityType: 'ai_response_error',
      phoneNumber: phoneNumber,
      details: {
        error: error.message,
        errorType: error.constructor.name,
        inputMessage: message,
        stack: error.stack
      }
    });

    // Return fallback response
    return "Thanks for your message! Ben will get back to you soon. Call (901) 497-7001 for immediate assistance. 🎵";
  }
}

// Function to extract lead information from message (for admin notifications)
export function extractLeadInfo(message, context) {
  const info = {
    nameDetected: false,
    firstName: null,
    lastName: null,
    eventType: null,
    eventDate: null,
    venue: null,
    guestCount: null,
    budget: null
  };

  // Simple extraction logic (could be enhanced with better NLP)
  const lowerMessage = message.toLowerCase();

  // Name detection (basic)
  const namePatterns = [
    /my name is (\w+)/i,
    /i'm (\w+)/i,
    /this is (\w+)/i,
    /hi.* i'm (\w+)/i
  ];

  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match) {
      info.nameDetected = true;
      info.firstName = match[1];
      break;
    }
  }

  // Event type detection
  if (lowerMessage.includes('wedding')) info.eventType = 'wedding';
  else if (lowerMessage.includes('corporate') || lowerMessage.includes('business')) info.eventType = 'corporate';
  else if (lowerMessage.includes('birthday') || lowerMessage.includes('party')) info.eventType = 'birthday';
  else if (lowerMessage.includes('school') || lowerMessage.includes('dance')) info.eventType = 'school';

  // Date detection (basic)
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{1,2}\/\d{1,2}\/\d{2})/,
    /june (\d{1,2})/i,
    /july (\d{1,2})/i,
    /august (\d{1,2})/i,
    /september (\d{1,2})/i
  ];

  for (const pattern of datePatterns) {
    const match = message.match(pattern);
    if (match) {
      info.eventDate = match[0];
      break;
    }
  }

  // Guest count
  const guestMatch = message.match(/(\d+)\s*(?:guests?|people|attendees?)/i);
  if (guestMatch) {
    info.guestCount = guestMatch[1];
  }

  // Budget
  const budgetMatch = message.match(/\$?(\d+)[k]?\s*(?:budget|spend|price)/i);
  if (budgetMatch) {
    const amount = parseInt(budgetMatch[1]);
    if (amount >= 1000) {
      info.budget = amount < 2500 ? '$1k-$2.5k' : '$2.5k-$5k';
    }
  }

  return info;
}

// Function to update contact name (for admin notifications)
export async function updateContactName(phoneNumber, firstName, lastName) {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null)
      .single();

    if (existingContact) {
      const { error } = await supabase
        .from('contacts')
        .update({
          first_name: firstName,
          last_name: lastName || existingContact.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id);

      if (error) throw error;
      return { updated: true, contactId: existingContact.id };
    } else {
      // Create new contact with just name
      const { data: newContact, error } = await supabase
        .from('contacts')
        .insert([{
          phone: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          lead_status: 'new',
          source: 'sms',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { updated: true, contactId: newContact.id };
    }
  } catch (error) {
    console.error('Error updating contact name:', error);
    return { updated: false, error: error.message };
  }
}
