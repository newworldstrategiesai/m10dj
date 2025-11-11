// ChatGPT-powered SMS Assistant for M10 DJ Company
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get customer context from database based on phone number
 * @param {string} phoneNumber - Customer's phone number
 * @returns {Object} Customer context and conversation history
 */
export async function getCustomerContext(phoneNumber) {
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

    if (contactError && contactError.code !== 'PGRST116') {
      console.error('Error fetching contact:', contactError);
    }

    // Get recent SMS conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('sms_conversations')
      .select('*')
      .eq('phone_number', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
    }

    return {
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
  } catch (error) {
    console.error('Error getting customer context:', error);
    return { contact: null, messages: [], isExistingCustomer: false };
  }
}

/**
 * Generate ChatGPT response with customer context
 * @param {string} customerMessage - The customer's message
 * @param {Object} context - Customer context from database
 * @returns {string} AI-generated response
 */
export async function generateAIResponse(customerMessage, context) {
  try {
    const systemPrompt = buildSystemPrompt(context);
    const conversationHistory = buildConversationHistory(context.messages);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model for SMS responses
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: customerMessage }
        ],
        max_tokens: 300, // Keep responses SMS-friendly
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid OpenAI API response structure');
    }
    
    const aiResponse = data.choices[0].message.content.trim();
    
    // Validate the response content
    if (!aiResponse || aiResponse.length === 0) {
      throw new Error('OpenAI returned empty response');
    }
    
    // Ensure response isn't too long for SMS (160 chars per SMS, aim for 2-3 messages max)
    if (aiResponse.length > 480) {
      console.warn(`⚠️ AI response is long (${aiResponse.length} chars), may be split into multiple SMS`);
    }
    
    console.log(`✅ OpenAI generated response: ${aiResponse.length} characters`);
    return aiResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return getFallbackResponse(context);
  }
}

/**
 * Build system prompt with customer context
 * @param {Object} context - Customer context
 * @returns {string} System prompt for ChatGPT
 */
function buildSystemPrompt(context) {
  const { contact, isExistingCustomer } = context;
  
  let prompt = `You are an AI assistant for M10 DJ Company, a professional DJ service in Memphis, TN. You help customers via SMS text messaging.

COMPANY INFO:
- Business: M10 DJ Company
- Owner: Ben Murray
- Phone: (901) 497-7001
- Email: djbenmurray@gmail.com
- Website: m10djcompany.com
- Location: Memphis, TN area
- Services: Weddings, Corporate Events, School Dances, Private Parties, Holiday Parties
- Equipment: Professional sound, lighting, uplighting, microphones, DJ booth

PERSONALITY & TONE:
- Professional but friendly and approachable
- Enthusiastic about making events memorable
- Knowledgeable about music and entertainment
- Helpful and solution-oriented
- Keep responses concise for SMS (under 160 characters when possible)
- Use emojis sparingly but appropriately 🎵 🎉

CUSTOMER CONTEXT:`;

  if (isExistingCustomer && contact) {
    prompt += `
- Name: ${contact.first_name} ${contact.last_name}
- Event Type: ${contact.event_type || 'Not specified'}
- Event Date: ${contact.event_date || 'Not specified'}
- Venue: ${contact.venue_name || 'Not specified'}
- Lead Status: ${contact.lead_status}
- Special Requests: ${contact.special_requests || 'None'}
- Budget Range: ${contact.budget_range || 'Not specified'}
- Last Contact: ${contact.last_contacted_date || 'First contact'}
- Communication Preference: ${contact.communication_preference}`;
  } else {
    prompt += `
- New customer (no previous contact record)
- This is their first interaction with M10 DJ Company`;
  }

  prompt += `

CAPABILITIES:
1. Answer questions about DJ services and pricing
2. Help schedule consultations
3. Gather event details (date, venue, type, guest count)
4. Provide rough price estimates
5. Share testimonials and experience
6. Handle booking inquiries

PRICING GUIDELINES (for rough estimates only):
- Weddings: $800-$2,500 (depending on hours, equipment, location)
- Corporate Events: $600-$1,800
- School Dances: $500-$1,200  
- Private Parties: $400-$1,000
- Holiday Parties: $500-$1,500
Always mention that final pricing depends on specific requirements and a consultation is needed for accurate quotes.

IMPORTANT RULES:
1. Always be helpful and professional
2. If you don't know something specific, offer to have Ben call them
3. For complex questions or bookings, suggest a phone consultation
4. Keep responses SMS-friendly (short and clear)
5. Always end with a way to move the conversation forward
6. Never make firm commitments - only Ben can confirm bookings
7. If they seem ready to book, get their contact info and have Ben follow up

SAMPLE RESPONSES:
- "Hi! Thanks for reaching out to M10 DJ Company! 🎵 I'd love to help with your [event type]. What date are you planning?"
- "Great! For a [event type] on [date], we typically range $X-$Y depending on your specific needs. Can you tell me about your venue?"
- "That sounds like an amazing celebration! I'd love to have Ben give you a call to discuss the details. What's the best number to reach you?"`;

  return prompt;
}

/**
 * Build conversation history for ChatGPT context
 * @param {Array} messages - Recent SMS messages
 * @returns {Array} Formatted conversation history
 */
function buildConversationHistory(messages) {
  if (!messages || messages.length === 0) return [];
  
  return messages.slice(-5).reverse().map(msg => ({
    role: msg.direction === 'inbound' ? 'user' : 'assistant',
    content: msg.message_content
  }));
}

/**
 * Get fallback response when AI fails
 * @param {Object} context - Customer context
 * @returns {string} Fallback response
 */
function getFallbackResponse(context) {
  const { isExistingCustomer, customerName } = context;
  
  if (isExistingCustomer && customerName) {
    return `Hi ${customerName}! Thanks for reaching out to M10 DJ Company! 🎵 I'm having a quick technical issue, but Ben will personally respond to you within 30 minutes. For immediate assistance, call (901) 497-7001!`;
  } else {
    return `Thank you for contacting M10 DJ Company! 🎵 We're excited to help make your event unforgettable! Ben will respond personally within 30 minutes, or call (901) 497-7001 for immediate assistance.`;
  }
}

/**
 * Save conversation message to database
 * @param {string} phoneNumber - Customer phone number
 * @param {string} message - Message content
 * @param {string} direction - 'inbound' or 'outbound'
 * @param {string} messageType - 'customer' or 'ai_assistant'
 * @returns {Object} Database result
 */
export async function saveConversationMessage(phoneNumber, message, direction, messageType = 'customer') {
  try {
    const { data, error } = await supabase
      .from('sms_conversations')
      .insert([{
        phone_number: phoneNumber,
        message_content: message,
        direction: direction,
        message_type: messageType,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error saving conversation:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error saving conversation message:', error);
    return { success: false, error };
  }
}

/**
 * Update contact name when they introduce themselves
 * @param {string} phoneNumber - Customer phone number  
 * @param {string} firstName - First name
 * @param {string} lastName - Last name (optional)
 * @returns {Object} Update result
 */
export async function updateContactName(phoneNumber, firstName, lastName = null) {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Find existing contact
    const { data: contact, error: findError } = await supabase
      .from('contacts')
      .select('*')
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null)
      .limit(1)
      .single();

    if (findError || !contact) {
      console.log('No contact found to update name for:', phoneNumber);
      return { success: false, error: findError || 'Contact not found' };
    }

    // Only update if name is currently empty or "Unknown"
    const shouldUpdate = !contact.first_name || 
                        contact.first_name === 'Unknown' || 
                        contact.first_name === '';

    if (!shouldUpdate) {
      console.log('Contact already has a name, skipping update:', contact.first_name, contact.last_name);
      return { success: true, skipped: true, message: 'Contact already has a name' };
    }

    // Update the contact with the new name
    const updateData = {
      first_name: firstName,
      updated_at: new Date().toISOString()
    };
    
    if (lastName) {
      updateData.last_name = lastName;
    }

    const { data, error: updateError } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contact.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contact name:', updateError);
      return { success: false, error: updateError };
    }

    console.log(`✅ Updated contact name: ${firstName} ${lastName || ''} for ${phoneNumber}`);
    return { success: true, data, updated: true };
  } catch (error) {
    console.error('Error in updateContactName:', error);
    return { success: false, error };
  }
}

/**
 * Update contact's last communication info
 * @param {string} phoneNumber - Customer phone number
 * @param {string} contactType - Type of contact ('sms', 'ai_chat')
 * @returns {Object} Update result
 */
export async function updateContactLastCommunication(phoneNumber, contactType = 'sms') {
  try {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    const { data, error } = await supabase
      .from('contacts')
      .update({
        last_contacted_date: new Date().toISOString(),
        last_contact_type: contactType,
        messages_received_count: supabase.rpc('increment_counter', { 
          table_name: 'contacts', 
          counter_column: 'messages_received_count',
          match_column: 'phone',
          match_value: cleanPhone 
        })
      })
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null);

    return { success: !error, data, error };
  } catch (error) {
    console.error('Error updating contact communication:', error);
    return { success: false, error };
  }
}

/**
 * Extract lead information from conversation
 * @param {string} message - Customer message
 * @param {Object} context - Current customer context
 * @returns {Object} Extracted lead information
 */
/**
 * Extract name from message when someone introduces themselves
 * @param {string} message - The message content
 * @returns {Object|null} Object with firstName and lastName, or null
 */
export function extractNameFromMessage(message) {
  // Common name introduction patterns
  const namePatterns = [
    // "Hi this is Haywood Williams" or "Hey, this is Haywood Williams"
    /(?:hi|hey|hello)[,\s]+(?:this is|i'm|i am|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,|$|\s)/i,
    // "This is Haywood Williams" at start
    /^this is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?=[\s,]|$))/i,
    // "My name is Haywood Williams"
    /my name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?=[\s,]|$))/i,
    // "Hey, I'm Chris Anderson"
    /(?:hi|hey|hello)[,\s]+i'?m\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?=[\s,]|$))/i,
    // "I am Jennifer Lee"
    /(?:^|\.\s+)i\s+am\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?=[\s,]|$))/i,
    // "This is Haywood calling" - name before action verb
    /^this is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:calling|texting|reaching|contacting)/i,
    // "Michael Davis here" at the start
    /^([A-Z][a-z]+\s+[A-Z][a-z]+)\s+here/
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      let fullName = match[1].trim();
      
      // Remove trailing punctuation
      fullName = fullName.replace(/[,;:!?\.]$/, '');
      
      // Validate name (must be at least 2 chars, only letters and spaces)
      if (fullName.length < 2 || fullName.length > 50) continue;
      if (!/^[A-Za-z\s'-]+$/.test(fullName)) continue;
      
      // Filter out common words that aren't names
      const commonWords = [
        'calling', 'texting', 'reaching', 'contacting', 'interested', 'looking',
        'needing', 'asking', 'inquiring', 'wondering', 'hoping', 'wanting',
        'about', 'regarding', 'concerning', 'booking',
        'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'from', 'in', 'my'
      ];
      
      const lowerName = fullName.toLowerCase().trim();
      
      // Check if the entire name is a common word
      if (commonWords.includes(lowerName)) continue;
      
      // Split into first and last name
      const nameParts = fullName.trim().split(/\s+/);
      
      // Filter out parts that are definitely not names
      const validParts = nameParts.filter(part => {
        const lower = part.toLowerCase();
        // Keep parts that look like names (capitalized and not common words)
        return !['about', 'regarding', 'concerning'].includes(lower);
      });
      
      // Need at least one valid name part
      if (validParts.length === 0) continue;
      
      // Capitalize properly
      const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      
      if (validParts.length === 1) {
        return {
          firstName: capitalize(validParts[0]),
          lastName: null
        };
      } else {
        return {
          firstName: capitalize(validParts[0]),
          lastName: validParts.slice(1).map(capitalize).join(' ')
        };
      }
    }
  }
  
  return null;
}

export function extractLeadInfo(message, context) {
  const info = {};
  
  // Extract name if person introduces themselves
  const extractedName = extractNameFromMessage(message);
  if (extractedName) {
    info.firstName = extractedName.firstName;
    info.lastName = extractedName.lastName;
    info.nameDetected = true;
  }
  
  // Extract event types
  const eventTypes = {
    'wedding': ['wedding', 'marry', 'bride', 'groom', 'reception'],
    'corporate': ['corporate', 'company', 'business', 'office', 'work'],
    'birthday': ['birthday', 'bday', 'party', 'celebration'],
    'school': ['school', 'prom', 'homecoming', 'dance', 'graduation'],
    'holiday': ['holiday', 'christmas', 'thanksgiving', 'new year', 'halloween']
  };
  
  const lowerMessage = message.toLowerCase();
  
  for (const [type, keywords] of Object.entries(eventTypes)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      info.eventType = type;
      break;
    }
  }
  
  // Extract dates (basic pattern matching)
  const datePatterns = [
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/, // MM/DD/YYYY
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/, // YYYY/MM/DD
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})\b/i
  ];
  
  for (const pattern of datePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      info.possibleDate = match[0];
      break;
    }
  }
  
  // Extract guest count
  const guestMatch = lowerMessage.match(/(\d+)\s*(guest|people|person)/i);
  if (guestMatch) {
    info.guestCount = parseInt(guestMatch[1]);
  }
  
  return info;
}
