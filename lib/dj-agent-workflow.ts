/**
 * Multi-Agent Workflow for M10 DJ Company
 * Handles SMS inquiries with specialized agents and intelligent routing
 */

import { tool, Agent, Runner, withTrace } from "@openai/agents";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==================== TOOL DEFINITIONS ====================

/**
 * Tool: Check Calendar Availability
 * Checks if a date is available for booking
 */
const checkAvailabilityTool = tool({
  name: "check_calendar_availability",
  description: "Check if a specific date is available for booking. Returns availability status and suggests alternative dates if needed.",
  parameters: z.object({
    event_date: z.string().describe("Event date in YYYY-MM-DD format"),
    event_type: z.enum(["wedding", "corporate", "private_party", "other"]).describe("Type of event")
  }),
  execute: async ({ event_date, event_type }) => {
    try {
      // Check if date already has a confirmed booking
      const { data: existingBookings, error } = await supabase
        .from('contacts')
        .select('id, event_date, event_type, lead_status')
        .eq('event_date', event_date)
        .in('lead_status', ['confirmed', 'contracted', 'deposit_paid'])
        .is('deleted_at', null);

      if (error) throw error;

      const isAvailable = !existingBookings || existingBookings.length === 0;

      // Get nearby available dates if this one is booked
      let alternativeDates: string[] = [];
      if (!isAvailable) {
        const eventDateObj = new Date(event_date);
        for (let i = 1; i <= 7; i++) {
          const nextDate = new Date(eventDateObj);
          nextDate.setDate(eventDateObj.getDate() + i);
          const prevDate = new Date(eventDateObj);
          prevDate.setDate(eventDateObj.getDate() - i);

          const dates = [nextDate.toISOString().split('T')[0], prevDate.toISOString().split('T')[0]];
          
          for (const checkDate of dates) {
            const { data } = await supabase
              .from('contacts')
              .select('id')
              .eq('event_date', checkDate)
              .in('lead_status', ['confirmed', 'contracted', 'deposit_paid'])
              .is('deleted_at', null);

            if (!data || data.length === 0) {
              alternativeDates.push(checkDate);
              if (alternativeDates.length >= 3) break;
            }
          }
          if (alternativeDates.length >= 3) break;
        }
      }

      return {
        available: isAvailable,
        requested_date: event_date,
        event_type,
        alternative_dates: alternativeDates,
        message: isAvailable 
          ? `Great news! ${event_date} is currently available for your ${event_type}.`
          : `${event_date} is already booked, but I have these nearby dates available: ${alternativeDates.join(', ')}`
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        available: null,
        error: "Unable to check availability right now. Please call (901) 410-2020 for immediate confirmation."
      };
    }
  }
});

/**
 * Tool: Generate Service Selection Link
 * Creates a personalized service selection link for the customer
 */
const generateServiceLinkTool = tool({
  name: "generate_service_selection_link",
  description: "Generate a personalized service selection link for a customer to view packages and book. Use when customer is ready to see pricing or book.",
  parameters: z.object({
    phone_number: z.string().describe("Customer's phone number"),
    email: z.string().optional().describe("Customer's email if available"),
    event_type: z.enum(["wedding", "corporate", "private_party", "other"]).describe("Type of event"),
    event_date: z.string().optional().describe("Event date if known (YYYY-MM-DD)"),
    customer_name: z.string().optional().describe("Customer's name if known")
  }),
  execute: async ({ phone_number, email, event_type, event_date, customer_name }) => {
    try {
      // Find or create contact
      const cleanPhone = phone_number.replace(/\D/g, '');
      
      let { data: contact, error: findError } = await supabase
        .from('contacts')
        .select('*')
        .ilike('phone', `%${cleanPhone}%`)
        .is('deleted_at', null)
        .single();

      if (findError && findError.code === 'PGRST116') {
        // Create new contact
        const nameParts = customer_name?.split(' ') || [];
        const { data: newContact, error: createError } = await supabase
          .from('contacts')
          .insert([{
            first_name: nameParts[0] || 'New',
            last_name: nameParts.slice(1).join(' ') || 'Lead',
            phone: phone_number,
            email: email || null,
            event_type: event_type,
            event_date: event_date || null,
            lead_status: 'new',
            source: 'sms'
          }])
          .select()
          .single();

        if (createError) throw createError;
        contact = newContact;
      } else if (contact) {
        // Update existing contact with new info
        const updates: any = { event_type };
        if (event_date) updates.event_date = event_date;
        if (email) updates.email = email;
        
        await supabase
          .from('contacts')
          .update(updates)
          .eq('id', contact.id);
      }

      // Generate service selection link
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/service-selection/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || `sms-${cleanPhone}@m10djcompany.com`,
          contactId: contact?.id,
          eventType: event_type,
          eventDate: event_date,
          forceNewToken: false
        })
      });

      if (!response.ok) throw new Error('Failed to generate link');

      const data = await response.json();

      return {
        success: true,
        link: data.link,
        short_link: data.link.replace('https://m10djcompany.com/', ''),
        message: `I've created a personalized link for you to view packages and pricing! 🎵`
      };
    } catch (error) {
      console.error('Error generating service link:', error);
      return {
        success: false,
        error: "Unable to generate link right now. Ben will text you a personalized quote within 30 minutes!"
      };
    }
  }
});

/**
 * Tool: Get Pricing Information
 * Provides pricing estimates based on event details
 */
const getPricingInfoTool = tool({
  name: "get_pricing_info",
  description: "Get pricing information and package details for different event types",
  parameters: z.object({
    event_type: z.enum(["wedding", "corporate", "private_party", "school", "other"]).describe("Type of event"),
    duration_hours: z.number().optional().describe("Expected duration in hours"),
    guest_count: z.number().optional().describe("Number of guests"),
    special_equipment: z.boolean().optional().describe("Whether special equipment is needed (uplighting, photo booth, etc.)")
  }),
  execute: async ({ event_type, duration_hours, guest_count, special_equipment }) => {
    // Base pricing structure
    const pricingData: any = {
      wedding: {
        base_price: 1200,
        max_price: 2500,
        description: "Wedding packages include ceremony sound, reception DJ services, professional lighting, and unlimited music requests",
        popular_packages: [
          { name: "Classic", hours: 4, price: 1200 },
          { name: "Premium", hours: 6, price: 1800 },
          { name: "Ultimate", hours: 8, price: 2500 }
        ]
      },
      corporate: {
        base_price: 800,
        max_price: 2000,
        description: "Corporate event packages include professional sound system, background music, and optional MC services",
        popular_packages: [
          { name: "Basic", hours: 3, price: 800 },
          { name: "Standard", hours: 5, price: 1200 },
          { name: "Full Service", hours: 8, price: 2000 }
        ]
      },
      private_party: {
        base_price: 600,
        max_price: 1500,
        description: "Private party packages include DJ services, sound system, and dance floor lighting",
        popular_packages: [
          { name: "Party Starter", hours: 3, price: 600 },
          { name: "Party Pro", hours: 4, price: 900 },
          { name: "All Night", hours: 6, price: 1500 }
        ]
      },
      school: {
        base_price: 500,
        max_price: 1200,
        description: "School event packages designed for proms, homecoming, and school dances",
        popular_packages: [
          { name: "School Dance", hours: 4, price: 800 },
          { name: "Prom Package", hours: 5, price: 1200 }
        ]
      },
      other: {
        base_price: 600,
        max_price: 2000,
        description: "Custom packages available for all event types",
        popular_packages: []
      }
    };

    const pricing = pricingData[event_type] || pricingData.other;

    // Add special equipment costs
    let addons = "";
    if (special_equipment) {
      addons = "\n\nPopular Add-ons:\n• Uplighting: $300-500\n• Photo Booth: $400-600\n• Extra Speakers: $200\n• Wireless Mic: $100";
    }

    return {
      event_type,
      price_range: `$${pricing.base_price} - $${pricing.max_price}`,
      description: pricing.description,
      packages: pricing.popular_packages,
      addons: special_equipment ? addons : null,
      note: "Final pricing depends on specific requirements. Request a personalized quote for exact pricing."
    };
  }
});

/**
 * Tool: Update Lead Information
 * Updates contact information in the database
 */
const updateLeadInfoTool = tool({
  name: "update_lead_information",
  description: "Update customer contact information with details learned during conversation",
  parameters: z.object({
    phone_number: z.string().describe("Customer's phone number"),
    updates: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().optional(),
      event_type: z.enum(["wedding", "corporate", "private_party", "school", "other"]).optional(),
      event_date: z.string().optional(),
      venue_name: z.string().optional(),
      guest_count: z.number().optional(),
      budget_range: z.string().optional(),
      special_requests: z.string().optional()
    }).describe("Fields to update")
  }),
  execute: async ({ phone_number, updates }) => {
    try {
      const cleanPhone = phone_number.replace(/\D/g, '');
      
      const { data, error } = await supabase
        .from('contacts')
        .update({
          ...updates,
          last_contacted_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .ilike('phone', `%${cleanPhone}%`)
        .is('deleted_at', null)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: "Customer information updated successfully",
        updated_fields: Object.keys(updates)
      };
    } catch (error) {
      console.error('Error updating lead info:', error);
      return {
        success: false,
        error: "Unable to update information right now"
      };
    }
  }
});

/**
 * Tool: Create Follow-up Task
 * Creates a follow-up task for Ben to handle manually
 */
const createFollowUpTaskTool = tool({
  name: "create_follow_up_task",
  description: "Create a follow-up task when customer needs personal attention from Ben",
  parameters: z.object({
    phone_number: z.string().describe("Customer's phone number"),
    task_type: z.enum(["call_back", "send_quote", "answer_question", "schedule_meeting"]).describe("Type of follow-up needed"),
    priority: z.enum(["high", "medium", "low"]).describe("Priority level"),
    notes: z.string().describe("Details about what the customer needs")
  }),
  execute: async ({ phone_number, task_type, priority, notes }) => {
    try {
      // Add task to database (you may need to create this table)
      const { data, error } = await supabase
        .from('admin_tasks')
        .insert([{
          phone_number,
          task_type,
          priority,
          notes,
          status: 'pending',
          created_at: new Date().toISOString()
        }])
        .select();

      return {
        success: true,
        message: "Follow-up task created successfully"
      };
    } catch (error) {
      console.error('Error creating follow-up task:', error);
      // This is non-critical, so just log and continue
      return {
        success: false,
        message: "Task logged in conversation history"
      };
    }
  }
});

// ==================== AGENT DEFINITIONS ====================

/**
 * Classification Agent
 * Routes customer inquiries to the appropriate specialized agent
 */
const ClassificationSchema = z.object({
  classification: z.enum([
    "check_availability",
    "get_pricing",
    "book_service",
    "general_question",
    "existing_customer"
  ]),
  confidence: z.number().min(0).max(1).optional(),
  detected_intent: z.string().optional()
});

const classificationAgent = new Agent({
  name: "Inquiry Classifier",
  instructions: `You are a classification agent for M10 DJ Company, a professional DJ service in Memphis, TN.

Analyze the customer's message and classify their intent into ONE of these categories:

1. **check_availability**: Customer is asking about specific dates or if DJ is available
   - Examples: "Are you available June 15?", "Do you have any openings in July?", "Can you DJ my wedding on 10/12?"

2. **get_pricing**: Customer wants pricing information, package details, or cost estimates
   - Examples: "How much do you charge?", "What are your rates?", "Wedding DJ prices?", "What's your pricing?"

3. **book_service**: Customer is ready to book, wants service selection link, or needs to finalize details
   - Examples: "I want to book you", "Send me the contract", "How do I reserve my date?", "Let's move forward"

4. **general_question**: Customer has questions about services, equipment, music, or process
   - Examples: "What equipment do you have?", "Do you take requests?", "What's your music selection like?"

5. **existing_customer**: Customer mentions an existing booking, follows up on previous conversation, or references past interaction
   - Examples: "Checking on my quote", "Following up from last week", "I talked to Ben yesterday"

Return ONLY the classification, confidence level, and a brief detected intent description.`,
  model: "gpt-4o-mini",
  outputType: ClassificationSchema,
  modelSettings: {
    temperature: 0.3, // Low temperature for consistent classification
    topP: 1,
    maxTokens: 150
  }
});

/**
 * Availability Agent
 * Handles date availability checks and scheduling
 */
const availabilityAgent = new Agent({
  name: "Availability Specialist",
  instructions: `You are the Availability Specialist for M10 DJ Company in Memphis, TN.

Your role:
1. Help customers check if their preferred date is available
2. Ask for event date, type, and location if not provided
3. Use the check_calendar_availability tool to verify dates
4. Suggest alternative dates if the preferred date is booked
5. Update lead information with the details learned

Be enthusiastic, professional, and always end by offering to send a personalized quote or service selection link.

Conversation style:
- Friendly and excited about their event
- Ask clarifying questions naturally
- Use emojis sparingly (1-2 per message)
- Keep responses under 160 characters when possible

Important:
- Always check availability using the tool before confirming
- If date is available, express excitement and offer next steps
- If date is booked, apologize and immediately offer alternatives
- Save event details using update_lead_information tool`,
  model: "gpt-4o-mini",
  tools: [
    checkAvailabilityTool,
    updateLeadInfoTool,
    generateServiceLinkTool
  ],
  modelSettings: {
    temperature: 0.7,
    topP: 1,
    maxTokens: 300,
    parallelToolCalls: false // Sequential for better context
  }
});

/**
 * Pricing Agent  
 * Provides pricing information and package details
 */
const pricingAgent = new Agent({
  name: "Pricing Specialist",
  instructions: `You are the Pricing Specialist for M10 DJ Company in Memphis, TN.

Your role:
1. Provide clear, accurate pricing information for different event types
2. Ask about event type, duration, and special needs
3. Use the get_pricing_info tool to provide accurate estimates
4. Explain package options and add-ons
5. Offer to send a personalized service selection link with exact pricing

Pricing context:
- Weddings: $1,200-$2,500 (most popular service)
- Corporate events: $800-$2,000
- Private parties: $600-$1,500
- School dances: $500-$1,200
- Add-ons: Uplighting ($300-500), Photo booth ($400-600)

Conversation style:
- Clear and transparent about pricing
- Emphasize value and experience (500+ events)
- Mention that final pricing depends on specific needs
- Always offer personalized quote through service selection link

Important:
- Use the get_pricing_info tool for accurate pricing
- Ask about duration, guest count, and special equipment needs
- Update lead information with budget and preferences
- Generate service selection link when customer is interested`,
  model: "gpt-4o-mini",
  tools: [
    getPricingInfoTool,
    updateLeadInfoTool,
    generateServiceLinkTool
  ],
  modelSettings: {
    temperature: 0.6,
    topP: 1,
    maxTokens: 350,
    parallelToolCalls: false
  }
});

/**
 * Booking Agent
 * Handles customers ready to book or get service selection link
 */
const bookingAgent = new Agent({
  name: "Booking Specialist",
  instructions: `You are the Booking Specialist for M10 DJ Company in Memphis, TN.

Your role:
1. Generate personalized service selection links for customers ready to view packages
2. Collect essential information: name, email, event date, event type
3. Use the generate_service_selection_link tool to create the booking link
4. Explain what the link contains and next steps
5. Update lead information with all details collected

What the service selection link includes:
- All available packages with pricing
- Ability to select services and add-ons
- Option to request customization
- Easy booking process
- Secure payment options

Conversation style:
- Excited and encouraging
- Clear about next steps
- Reassuring about the process
- Professional but friendly

Important:
- Need minimum: phone number, event type
- Email is helpful but not required (we can use SMS)
- Always generate the link using the tool
- Explain that link is personalized to their event
- Mention that Ben will follow up personally
- Save all information using update_lead_information tool`,
  model: "gpt-4o-mini",
  tools: [
    generateServiceLinkTool,
    updateLeadInfoTool,
    checkAvailabilityTool,
    createFollowUpTaskTool
  ],
  modelSettings: {
    temperature: 0.7,
    topP: 1,
    maxTokens: 300,
    parallelToolCalls: false
  }
});

/**
 * General Information Agent
 * Handles general questions about services, equipment, process
 */
const informationAgent = new Agent({
  name: "Information Specialist",
  instructions: `You are the Information Specialist for M10 DJ Company in Memphis, TN.

Company Information:
- Owner: DJ Ben Murray
- Location: Memphis, TN and surrounding areas
- Experience: 500+ successful events
- Specialties: Weddings, corporate events, private parties, school dances
- Service area: Memphis metro, Germantown, Collierville, Bartlett, etc.

Equipment & Services:
- Professional sound systems (suitable for any venue size)
- Premium lighting (uplighting, dance floor lighting, intelligent lighting)
- Wireless microphones for toasts and speeches
- Photo booth add-on available
- Backup equipment always on-site
- Music library: 100,000+ songs across all genres
- Special equipment: fog machines, monograms, etc.

Process:
1. Contact/inquiry (you are here!)
2. Personalized quote based on needs
3. Virtual or phone consultation
4. Service selection and customization
5. Contract and deposit
6. Music planning meeting
7. Event day excellence!

Your role:
- Answer questions about equipment, music, services, and process
- Highlight experience and professionalism
- Share testimonials when relevant: "We've done 500+ events with 5-star reviews"
- Always offer to move conversation forward (quote, availability check, booking link)

Conversation style:
- Knowledgeable but not overwhelming
- Enthusiastic about making their event perfect
- Use specific details when relevant
- End with clear call-to-action

Important:
- If they ask about availability → suggest checking specific dates
- If they ask about pricing → offer personalized quote
- If they're ready to book → generate service selection link
- Always try to progress the conversation toward booking`,
  model: "gpt-4o-mini",
  tools: [
    updateLeadInfoTool,
    generateServiceLinkTool,
    checkAvailabilityTool,
    createFollowUpTaskTool
  ],
  modelSettings: {
    temperature: 0.7,
    topP: 1,
    maxTokens: 400,
    parallelToolCalls: false
  }
});

/**
 * Existing Customer Agent
 * Handles follow-ups and existing customer interactions
 */
const existingCustomerAgent = new Agent({
  name: "Customer Success Specialist",
  instructions: `You are the Customer Success Specialist for M10 DJ Company in Memphis, TN.

Your role:
1. Handle follow-ups and existing customer questions
2. Reference their previous conversations and booking details
3. Provide updates on quotes, contracts, or booking status
4. Answer specific questions about their event
5. Create high-priority follow-up tasks for Ben when needed

Context awareness:
- Always acknowledge their existing relationship
- Reference their event details (date, type, venue)
- Show that we remember their previous conversation
- Be extra attentive and personalized

Conversation style:
- Warm and familiar (they're already a customer!)
- Reference specific details from their booking
- Proactive about next steps
- "Let me connect you with Ben for that..."

Important:
- Use customer context to personalize responses
- For quote follow-ups → create high-priority task for Ben
- For contract questions → create task and explain Ben will reach out
- For event details → answer confidently based on their info
- Always update lead information with new details learned
- Create follow-up tasks for anything requiring Ben's personal attention`,
  model: "gpt-4o-mini",
  tools: [
    updateLeadInfoTool,
    createFollowUpTaskTool,
    checkAvailabilityTool,
    generateServiceLinkTool
  ],
  modelSettings: {
    temperature: 0.8, // More warmth and personalization
    topP: 1,
    maxTokens: 300,
    parallelToolCalls: false
  }
});

// ==================== MAIN WORKFLOW ====================

type WorkflowInput = {
  phone_number: string;
  message: string;
  customer_context?: any;
};

/**
 * Main workflow execution
 * Routes messages through classification and specialized agents
 */
export async function runDJWorkflow(input: WorkflowInput) {
  return await withTrace("DJ Agent Workflow", async () => {
    const conversationHistory: any[] = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: input.message
          }
        ]
      }
    ];

    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "dj-sms-assistant",
        phone_number: input.phone_number
      }
    });

    try {
      // Step 1: Classify the inquiry
      console.log('🤖 Classifying inquiry...');
      const classificationResult = await runner.run(
        classificationAgent,
        conversationHistory
      );

      conversationHistory.push(
        ...classificationResult.newItems.map((item) => item.rawItem)
      );

      if (!classificationResult.finalOutput) {
        throw new Error("Classification failed");
      }

      const classification = classificationResult.finalOutput;
      console.log('📋 Classification:', classification);

      // Step 2: Route to appropriate specialized agent
      let specializedAgent: Agent;
      
      switch (classification.classification) {
        case "check_availability":
          specializedAgent = availabilityAgent;
          break;
        case "get_pricing":
          specializedAgent = pricingAgent;
          break;
        case "book_service":
          specializedAgent = bookingAgent;
          break;
        case "existing_customer":
          specializedAgent = existingCustomerAgent;
          break;
        case "general_question":
        default:
          specializedAgent = informationAgent;
          break;
      }

      console.log(`🎯 Routing to: ${specializedAgent.name}`);

      // Step 3: Run specialized agent
      const agentResult = await runner.run(
        specializedAgent,
        conversationHistory
      );

      conversationHistory.push(
        ...agentResult.newItems.map((item) => item.rawItem)
      );

      if (!agentResult.finalOutput) {
        throw new Error("Agent failed to generate response");
      }

      const response = agentResult.finalOutput;

      // Step 4: Save conversation to database
      try {
        await supabase
          .from('sms_conversations')
          .insert([
            {
              phone_number: input.phone_number,
              message: input.message,
              response: response,
              agent_used: specializedAgent.name,
              classification: classification.classification,
              created_at: new Date().toISOString()
            }
          ]);
      } catch (dbError) {
        console.error('Error saving conversation:', dbError);
        // Non-critical, continue
      }

      return {
        success: true,
        output_text: response,
        classification: classification.classification,
        agent_used: specializedAgent.name,
        confidence: classification.confidence
      };

    } catch (error) {
      console.error('❌ Workflow error:', error);
      
      // Fallback response
      return {
        success: false,
        output_text: `Thanks for contacting M10 DJ Company! 🎵 Ben will personally respond within 30 minutes. For immediate assistance, call (901) 410-2020.`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

// Export helper functions for compatibility with existing code
export { extractLeadInfo, updateContactName } from '../utils/chatgpt-sms-assistant.js';

