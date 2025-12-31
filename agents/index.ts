/**
 * LiveKit Agents Server
 * 
 * Real-time voice AI agent with RAG capabilities
 * Connects to LiveKit rooms and provides intelligent voice assistance
 */

import { defineAgent, JobContext, getJobContext } from '@livekit/agents';
import { voice, llm, stt, tts, vad, turnDetection } from '@livekit/agents';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { EmailAssistant } from '../lib/email/email-assistant';
import { createEmailTools } from '../lib/email/email-tools';

// Environment variables
const LIVEKIT_URL = process.env.LIVEKIT_URL || '';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || '';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * RAG Lookup Function
 * Searches voice conversations, contacts, and knowledge base for relevant context
 */
async function performRagLookup(query: string, sessionId?: string, contactId?: string): Promise<string> {
  try {
    const contextPieces: string[] = [];

    // 1. Search recent conversation history if sessionId provided
    if (sessionId) {
      const { data: conversations } = await supabase
        .from('voice_conversations')
        .select('messages, context')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('last_interaction_at', { ascending: false })
        .limit(1);

      if (conversations && conversations.length > 0) {
        const conv = conversations[0];
        const messages = conv.messages as Array<{ role: string; content: string }>;
        const recentMessages = messages.slice(-5); // Last 5 messages
        
        if (recentMessages.length > 0) {
          contextPieces.push('Recent conversation context:');
          recentMessages.forEach(msg => {
            contextPieces.push(`${msg.role}: ${msg.content}`);
          });
        }

        // Add conversation context
        if (conv.context) {
          const ctx = conv.context as Record<string, any>;
          if (Object.keys(ctx).length > 0) {
            contextPieces.push(`Conversation context: ${JSON.stringify(ctx)}`);
          }
        }
      }
    }

    // 2. Search contact information if contactId provided
    if (contactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (contact) {
        contextPieces.push('Contact information:');
        if (contact.first_name || contact.last_name) {
          contextPieces.push(`Name: ${contact.first_name || ''} ${contact.last_name || ''}`.trim());
        }
        if (contact.event_type) {
          contextPieces.push(`Event type: ${contact.event_type}`);
        }
        if (contact.event_date) {
          contextPieces.push(`Event date: ${contact.event_date}`);
        }
        if (contact.venue_name) {
          contextPieces.push(`Venue: ${contact.venue_name}`);
        }
        if (contact.guest_count) {
          contextPieces.push(`Guest count: ${contact.guest_count}`);
        }
        if (contact.music_genres && contact.music_genres.length > 0) {
          contextPieces.push(`Music preferences: ${contact.music_genres.join(', ')}`);
        }
        if (contact.special_requests) {
          contextPieces.push(`Special requests: ${contact.special_requests}`);
        }
        if (contact.lead_status) {
          contextPieces.push(`Lead status: ${contact.lead_status}`);
        }
      }
    }

    // 3. Search FAQs for relevant information
    const { data: faqs } = await supabase
      .from('faqs')
      .select('question, answer')
      .eq('is_active', true)
      .ilike('question', `%${query}%`)
      .limit(3);

    if (faqs && faqs.length > 0) {
      contextPieces.push('Relevant FAQs:');
      faqs.forEach(faq => {
        contextPieces.push(`Q: ${faq.question}\nA: ${faq.answer}`);
      });
    }

    // 4. Search testimonials for social proof
    const { data: testimonials } = await supabase
      .from('testimonials')
      .select('testimonial_text, event_type, rating')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(2);

    if (testimonials && testimonials.length > 0) {
      contextPieces.push('Customer testimonials:');
      testimonials.forEach(testimonial => {
        contextPieces.push(`${testimonial.testimonial_text} (${testimonial.rating}/5 stars)`);
      });
    }

    return contextPieces.length > 0 
      ? contextPieces.join('\n\n')
      : 'No additional context found.';
  } catch (error) {
    console.error('Error performing RAG lookup:', error);
    return 'Error retrieving context.';
  }
}

/**
 * Tool: Get Contact Information
 */
const getContactInfo = llm.tool({
  description: 'Get detailed information about a contact or customer',
  parameters: z.object({
    contactId: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),
  }),
  execute: async ({ contactId, phoneNumber, email }, { ctx }) => {
    try {
      let query = supabase.from('contacts').select('*');

      if (contactId) {
        query = query.eq('id', contactId);
      } else if (phoneNumber) {
        query = query.eq('phone', phoneNumber);
      } else if (email) {
        query = query.eq('email_address', email);
      } else {
        return { error: 'Must provide contactId, phoneNumber, or email' };
      }

      const { data: contact, error } = await query.single();

      if (error || !contact) {
        return { error: 'Contact not found' };
      }

      return {
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        email: contact.email_address,
        phone: contact.phone,
        eventType: contact.event_type,
        eventDate: contact.event_date,
        venue: contact.venue_name,
        guestCount: contact.guest_count,
        leadStatus: contact.lead_status,
        budget: contact.budget_range,
        musicGenres: contact.music_genres,
        specialRequests: contact.special_requests,
      };
    } catch (error) {
      console.error('Error getting contact info:', error);
      return { error: 'Failed to retrieve contact information' };
    }
  },
});

/**
 * Tool: Search Knowledge Base
 */
const searchKnowledgeBase = llm.tool({
  description: 'Search the knowledge base for information about services, pricing, or FAQs',
  parameters: z.object({
    query: z.string().describe('Search query'),
  }),
  execute: async ({ query }, { ctx }) => {
    try {
      const ragResult = await performRagLookup(query);
      return { result: ragResult };
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return { error: 'Failed to search knowledge base' };
    }
  },
});

/**
 * Custom Agent with RAG Support and Email Capabilities
 */
class RagAgent extends voice.Agent {
  private sessionId?: string;
  private contactId?: string;
  private emailAssistant?: EmailAssistant;

  constructor(
    chatCtx: llm.ChatContext, 
    sessionId?: string, 
    contactId?: string,
    emailAssistant?: EmailAssistant
  ) {
    // Build tools array
    const tools = [getContactInfo, searchKnowledgeBase];
    
    // Add email tools if EmailAssistant is provided
    if (emailAssistant) {
      const emailTools = createEmailTools(emailAssistant);
      tools.push(...emailTools);
    }

    super({
      chatCtx,
      instructions: `You are a helpful voice AI assistant for M10 DJ Company. You help potential customers with:
- Booking consultations
- Getting quotes for events
- Learning about services
- Music recommendations
- Answering questions about events
${emailAssistant ? '- Sending and reading emails\n- Managing email communications' : ''}

Be conversational, helpful, and professional. Use the available tools to get accurate information about customers and services.${emailAssistant ? ' You can send and receive emails on behalf of the user.' : ''}`,
      tools,
    });

    this.sessionId = sessionId;
    this.contactId = contactId;
    this.emailAssistant = emailAssistant;
  }

  /**
   * RAG lookup on user turn completion
   * Adds relevant context before LLM generates response
   */
  async onUserTurnCompleted(
    turnCtx: llm.ChatContext,
    newMessage: llm.ChatMessage,
  ): Promise<void> {
    try {
      // Perform RAG lookup based on user's message
      const ragContent = await performRagLookup(
        newMessage.textContent,
        this.sessionId,
        this.contactId
      );

      // Add RAG context to chat context
      if (ragContent && ragContent !== 'No additional context found.') {
        turnCtx.addMessage({
          role: 'assistant',
          content: `Additional information relevant to the user's query:\n\n${ragContent}`,
        });
      }
    } catch (error) {
      console.error('Error in onUserTurnCompleted:', error);
      // Don't fail the turn if RAG lookup fails
    }
  }
}

/**
 * Agent Entry Point
 * 
 * The agent server connects to LiveKit and listens for agent jobs.
 * Jobs are created automatically when rooms are created with agent participants,
 * or manually via the LiveKit API.
 */
export default defineAgent({
  entry: async (ctx: JobContext) => {
    console.log('🎙️ Agent session started:', ctx.job.id);
    console.log('Room:', ctx.room.name);

    // Parse job metadata for initial context
    let metadata: Record<string, any> = {};
    let sessionId: string | undefined;
    let contactId: string | undefined;
    let userName: string | undefined;

    try {
      if (ctx.job.metadata) {
        metadata = JSON.parse(ctx.job.metadata);
        sessionId = metadata.sessionId;
        contactId = metadata.contactId;
        userName = metadata.userName || metadata.user_name;
      }
    } catch (error) {
      console.error('Error parsing job metadata:', error);
    }

    // Create initial chat context with user information
    const initialCtx = llm.ChatContext.empty();
    
    if (userName) {
      initialCtx.addMessage({
        role: 'assistant',
        content: `The user's name is ${userName}.`,
      });
    }

    // Load contact context if available
    let organizationId: string | undefined;
    let productId: string | undefined;
    
    if (contactId) {
      try {
        const { data: contact } = await supabase
          .from('contacts')
          .select('first_name, last_name, event_type, event_date, organization_id')
          .eq('id', contactId)
          .single();

        if (contact) {
          organizationId = contact.organization_id;
          const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
          if (name) {
            initialCtx.addMessage({
              role: 'assistant',
              content: `The customer's name is ${name}.`,
            });
          }
          if (contact.event_type) {
            initialCtx.addMessage({
              role: 'assistant',
              content: `They are planning a ${contact.event_type} event.`,
            });
          }
          if (contact.event_date) {
            initialCtx.addMessage({
              role: 'assistant',
              content: `Their event date is ${contact.event_date}.`,
            });
          }
        }
      } catch (error) {
        console.error('Error loading contact context:', error);
      }
    }

    // Get organization and product info from metadata or contact
    if (!organizationId && metadata.organizationId) {
      organizationId = metadata.organizationId;
    }
    productId = metadata.productId || 'm10dj'; // Default to m10dj

    // Initialize EmailAssistant if organization is available
    let emailAssistant: EmailAssistant | undefined;
    if (organizationId) {
      try {
        // Get or create email address for this organization
        const emailAddress = metadata.emailAddress || `assistant-${organizationId}@m10djcompany.com`;
        
        emailAssistant = new EmailAssistant({
          organizationId,
          productId,
          emailAddress,
          contactId,
        });

        await emailAssistant.initialize();

        // Set up email notification callback
        emailAssistant.onEmailReceived((email) => {
          console.log(`📧 New email received during voice session: ${email.subject}`);
          // Could trigger voice notification here if needed
        });

        console.log(`✅ EmailAssistant initialized for ${emailAddress}`);
      } catch (error) {
        console.error('Error initializing EmailAssistant:', error);
        // Continue without email capabilities
      }
    }

    // Create agent session
    const session = new voice.AgentSession({
      stt: stt.STTManager.create({
        provider: 'deepgram',
        apiKey: process.env.DEEPGRAM_API_KEY,
      }),
      llm: llm.LLMManager.create({
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: OPENAI_API_KEY,
      }),
      tts: tts.TTSManager.create({
        provider: 'elevenlabs',
        apiKey: process.env.ELEVENLABS_API_KEY,
        voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // Default voice
      }),
      vad: vad.VADManager.create({
        provider: 'silero',
      }),
      turnDetection: turnDetection.TurnDetectionManager.create({
        provider: 'turn-detection',
      }),
    });

    // Create agent instance with EmailAssistant
    const agent = new RagAgent(initialCtx, sessionId, contactId, emailAssistant);

    // Start session
    await session.start({
      room: ctx.room,
      agent,
      inputOptions: {
        noiseCancellation: true,
      },
    });

    // Generate initial greeting
    await session.generateReply({
      instructions: userName
        ? `Greet the user by name (${userName}) and offer your assistance. Be warm and professional.`
        : 'Greet the user warmly and offer your assistance. Be professional and helpful.',
      allowInterruptions: false,
    });

    // Wait for session to end
    await ctx.waitForDisconnect();
    
    // Cleanup EmailAssistant
    if (emailAssistant) {
      await emailAssistant.cleanup();
    }
    
    console.log('✅ Agent session ended:', ctx.job.id);
  },
});

// The agent server will automatically connect to LiveKit when started
// Make sure LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are set

