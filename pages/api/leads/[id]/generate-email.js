import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Generate a custom email for a lead using AI
 * Uses OpenAI to create a personalized email based on lead information
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );

    // Use service role for queries
    const adminSupabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the lead/submission data with organization filtering
    let submissionQuery = adminSupabase
      .from('contact_submissions')
      .select('*')
      .eq('id', id);

    // For SaaS users, filter by organization_id. Platform admins see all submissions.
    if (!isAdmin && orgId) {
      submissionQuery = submissionQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Access denied - no organization found' });
    }

    const { data: submission, error: submissionError } = await submissionQuery.single();

    if (submissionError || !submission) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Additional check: Verify organization ownership for SaaS users
    if (!isAdmin && submission.organization_id !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch previous communications for context (including SMS, emails, notes)
    let previousCommunications = [];
    try {
      // 1. Fetch communication_log entries (excluding drafts)
      let commLogsQuery = adminSupabase
        .from('communication_log')
        .select('*')
        .eq('contact_submission_id', id)
        .neq('status', 'pending'); // Exclude drafts

      // Filter by organization_id for SaaS users
      if (!isAdmin && orgId) {
        commLogsQuery = commLogsQuery.eq('organization_id', orgId);
      }

      const { data: commLogs } = await commLogsQuery.order('created_at', { ascending: false }).limit(20);

      if (commLogs) {
        previousCommunications = commLogs.map(log => ({
          type: log.communication_type,
          direction: log.direction,
          subject: log.subject,
          content: log.content,
          sent_by: log.sent_by || 'Admin',
          sent_to: log.sent_to,
          created_at: log.created_at,
          status: log.status
        }));
      }

      // 2. Also fetch SMS conversations if phone number exists
      if (submission.phone) {
        let smsQuery = adminSupabase
          .from('sms_conversations')
          .select('*')
          .eq('phone_number', submission.phone);

        // Filter by organization_id for SaaS users
        if (!isAdmin && orgId) {
          smsQuery = smsQuery.eq('organization_id', orgId);
        }

        const { data: smsConversations } = await smsQuery.order('created_at', { ascending: false }).limit(10);

        if (smsConversations) {
          smsConversations.forEach(msg => {
            previousCommunications.push({
              type: 'sms',
              direction: msg.direction || (msg.message_type === 'admin' ? 'outbound' : 'inbound'),
              subject: null,
              content: msg.message_content,
              sent_by: msg.message_type === 'admin' ? 'Admin' : 'Client',
              sent_to: msg.phone_number,
              created_at: msg.created_at,
              status: msg.status || 'sent'
            });
          });
        }
      }

      // Sort all communications by date (newest first)
      previousCommunications.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Limit to most recent 15 communications to avoid token limit
      previousCommunications = previousCommunications.slice(0, 15);
    } catch (commError) {
      console.error('Error fetching previous communications:', commError);
      // Continue without previous communications if there's an error
    }

    // Build context for AI
    const leadContext = {
      name: submission.name,
      email: submission.email,
      phone: submission.phone,
      eventType: submission.event_type,
      eventDate: submission.event_date,
      location: submission.location,
      guestCount: submission.guest_count,
      message: submission.message,
      status: submission.status,
      createdAt: submission.created_at,
      previousCommunications: previousCommunications
    };

    // Generate email using OpenAI
    const systemPrompt = buildEmailSystemPrompt();
    const userPrompt = buildEmailUserPrompt(leadContext);

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500, // Allow for detailed email content
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to generate email',
        details: 'OpenAI API error'
      });
    }

    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || !openaiData.choices[0] || !openaiData.choices[0].message) {
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    const generatedContent = openaiData.choices[0].message.content.trim();
    
    // Parse the response - expect format: SUBJECT: ...\n\nBODY: ...
    // Or just return the content and extract subject from first line
    let subject = '';
    let body = generatedContent;

    // Try to extract subject if formatted that way
    if (generatedContent.includes('SUBJECT:') || generatedContent.includes('Subject:')) {
      const subjectMatch = generatedContent.match(/(?:SUBJECT|Subject):\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        body = generatedContent.replace(/(?:SUBJECT|Subject):\s*.+?(?:\n|$)/i, '').trim();
        // Remove "BODY:" prefix if present
        body = body.replace(/^(?:BODY|Body):\s*/i, '').trim();
      }
    } else {
      // Default subject based on event type or generic
      if (leadContext.eventType) {
        subject = `Re: Your ${leadContext.eventType} inquiry - M10 DJ Company`;
      } else {
        subject = `Re: Your inquiry - M10 DJ Company`;
      }
    }

    // If no subject extracted, use default
    if (!subject) {
      if (leadContext.eventType) {
        subject = `Re: Your ${leadContext.eventType} inquiry - M10 DJ Company`;
      } else {
        subject = `Re: Your inquiry - M10 DJ Company`;
      }
    }

    // Save as draft in communication_log
    // Use 'pending' status since 'draft' is not in the enum, but add metadata to indicate it's a draft
    // First, delete any existing draft for this submission
    await adminSupabase
      .from('communication_log')
      .delete()
      .eq('contact_submission_id', id)
      .eq('status', 'pending')
      .eq('communication_type', 'email')
      .eq('metadata->>is_draft', 'true');

    // Insert the new draft
    const { data: draftData, error: draftError } = await adminSupabase
      .from('communication_log')
      .insert([{
        contact_submission_id: id,
        communication_type: 'email',
        direction: 'outbound',
        subject: subject,
        content: body,
        status: 'pending', // Use 'pending' for drafts
        sent_by: 'Admin',
        sent_to: leadContext.email,
        organization_id: submission.organization_id,
        metadata: {
          is_draft: true,
          ai_generated: true,
          generated_at: new Date().toISOString()
        }
      }])
      .select()
      .single();

    if (draftError) {
      console.error('Error saving draft:', draftError);
      // Still return the email even if draft save fails
    }

    return res.status(200).json({
      success: true,
      subject,
      body,
      email: leadContext.email,
      name: leadContext.name,
      draftId: draftData?.id
    });

  } catch (error) {
    console.error('Error generating email:', error);
    return res.status(500).json({ 
      error: 'Failed to generate email',
      details: error.message 
    });
  }
}

/**
 * Build system prompt for email generation
 */
function buildEmailSystemPrompt() {
  return `You are an AI assistant helping to write professional, personalized emails for M10 DJ Company, a professional DJ service based in Memphis, TN.

COMPANY INFORMATION:
- Business Name: M10 DJ Company
- Owner: Ben Murray
- Phone: (901) 497-7001
- Email: djbenmurray@gmail.com
- Website: m10djcompany.com
- Location: Memphis, TN and surrounding areas
- Services: Weddings, Corporate Events, School Dances, Private Parties, Holiday Parties, Equipment Rentals

EQUIPMENT & SERVICES:
- Professional DJ services (music mixing, MC services, announcements)
- Professional sound systems (speakers, subwoofers, amplifiers)
- Lighting (uplighting, Gig Bar, light FX)
- Microphones (wireless and wired)
- DJ booth and professional setup
- Equipment rental services available

EQUIPMENT RENTAL PRICING (for NON-WEDDING rental-only inquiries):
- CRITICAL MINIMUM: We NEVER bring equipment out for less than $300. All equipment rentals must be $300 or more.
- NOTE: We do NOT offer equipment-only rentals for weddings. Weddings require full DJ services.
- Minimum Package: $300/day (2 speakers, 1 wireless mic, basic mixer, cables, setup assistance) - this is our minimum
- Corporate Event Package: $450/day (Premium speakers, multiple mics, lighting, backup equipment, technical support)
- Full Event Package: $650/day (Complete sound system, DJ equipment, full lighting, backup systems, on-site technician) - for large parties/events
- Individual Equipment: Prices vary based on items (15" speakers ~$75/day, 12" speakers ~$60/day, subwoofers ~$75/day, lighting packages ~$150-200/day, cables/stands included)
- If requested equipment totals less than $300, either:
  * Add additional equipment/services to reach $300 minimum
  * Suggest upgrading to a full DJ service package (better value)
  * Explain the $300 minimum and what's included
- Available for: Birthday parties, corporate events, school dances, holiday parties, private parties
- NOT available for: Weddings (must book full DJ services)

FULL DJ SERVICE PRICING (for upsell opportunities):
- Essential Wedding Package: Starting at $799 (6 hours, ceremony & reception sound, 2 wireless mics, basic uplighting, music consultation)
- Premium Wedding Package: Starting at $1,299 (8 hours, complete reception services, 4 wireless mics, premium uplighting, dance floor lighting, MC services)
- Luxury Wedding Package: Starting at $1,899 (Up to 10 hours, complete services, 6 wireless mics, custom lighting, backup DJ & equipment)
- Corporate/Private Events: $400-$1,500 (depends on duration, equipment, and services)
- School Dances: $500-$1,200
- Holiday Parties: $500-$1,500

EMAIL STYLE & TONE:
- Professional but warm and personable
- Enthusiastic about helping with their event
- Address their specific needs and questions
- Clear and concise
- Friendly but not overly casual
- Include relevant details about their event
- Offer next steps (phone call, consultation, quote)

EMAIL STRUCTURE:
1. Personal greeting using their name
2. Reference previous communications if any (to show continuity and avoid repetition)
3. Thank them for their inquiry (only if this is the first contact)
4. Acknowledge their specific event type and details
5. Address any specific questions or requests they mentioned
6. Highlight relevant services/equipment based on their needs
7. PROGRESS THE CONVERSATION - Move to the next logical step in the sales pipeline
8. Offer to discuss details further (phone call, consultation, send quote, etc.)
9. Professional closing with contact information

IMPORTANT GUIDELINES:
- CRITICAL: Review all previous communications provided. Do NOT repeat information already sent.
- If this is a follow-up email, reference what was discussed previously and move the conversation forward
- If a quote was already sent, ask for feedback or offer to schedule a call
- If they already received a "thank you" email, move to offering a quote, consultation, or addressing specific questions
- If this is the first contact, send a warm welcome email
- Always use the lead's name in the greeting
- Reference specific details from their inquiry (event type, date, equipment needs, guest count, etc.)
- If they mentioned equipment requests, acknowledge them specifically
- Keep the email professional but approachable
- Include a clear call-to-action that moves to the next stage (schedule a call, review quote, discuss details, etc.)
- Sign as "Ben Murray, M10 DJ Company" or similar

EQUIPMENT RENTAL INQUIRIES (if they only want equipment, not DJ services):
- IMPORTANT: We do NOT offer equipment-only rentals for WEDDINGS. If event type is "wedding" or similar, redirect to full DJ services only.
- CRITICAL: We NEVER bring equipment out for less than $300 minimum.
- For NON-WEDDING events (birthday parties, corporate, etc.):
  * Calculate pricing for the equipment they requested
  * If total is less than $300:
    - Explain the $300 minimum policy
    - Suggest additional equipment/services to reach the minimum (e.g., add lighting, extra mics, extended setup time)
    - Or suggest upgrading to full DJ services (better value proposition)
    - Position it positively: "Our minimum ensures you get professional quality setup and support"
  * If total is $300 or more:
    * Include specific pricing for the equipment they requested
    * Provide a clear total price for their rental package
  * Offer them the ability to lock in/reserve the equipment by:
    - Replying to the email to confirm
    - Calling (901) 497-7001 to book
    - Or including a booking confirmation CTA
  * Make it easy to say "yes" - include a simple way to accept
  * ALWAYS include an upsell for full DJ services (see below)

WEDDING EQUIPMENT REQUESTS:
- If they inquire about equipment for a wedding, politely explain that weddings require full DJ services
- Explain why: Professional coordination, MC services, timeline management, music expertise are essential for weddings
- Offer wedding DJ packages instead (Essential $799, Premium $1,299, Luxury $1,899)
- Position as: "For weddings, we provide complete DJ services with all equipment included - this ensures your special day runs smoothly"

UPSELL FOR EQUIPMENT-ONLY CUSTOMERS (NON-WEDDING):
- If they only inquired about equipment rental for non-wedding events, ALWAYS mention the value of adding DJ services
- Explain benefits: professional music mixing, MC services, timeline coordination, reduced stress
- Offer a discounted package price when booking equipment + DJ together
- Position it as: "Many clients find it more convenient and cost-effective to bundle equipment with our DJ services"
- Use soft language like "I'd be happy to discuss" rather than pushing too hard

PIPELINE PROGRESSION:
- New Lead (first contact): Warm welcome, thank them, set expectations, offer consultation
- After Welcome: Send quote, address specific questions, or schedule consultation
- After Quote: Follow up on quote, offer to discuss, answer questions
- After Consultation: Send proposal, close the deal, answer remaining questions
- Always move the conversation forward, not backward

Return the email content in a clear, readable format. You may include "SUBJECT:" followed by the subject line, then the email body.`;
}

/**
 * Build user prompt with lead context
 */
function buildEmailUserPrompt(leadContext) {
  let prompt = `Generate a personalized email for the following lead inquiry:\n\n`;

  prompt += `LEAD INFORMATION:\n`;
  prompt += `- Name: ${leadContext.name || 'Not provided'}\n`;
  prompt += `- Email: ${leadContext.email || 'Not provided'}\n`;
  if (leadContext.phone) {
    prompt += `- Phone: ${leadContext.phone}\n`;
  }
  prompt += `- Event Type: ${leadContext.eventType || 'Not specified'}\n`;
  if (leadContext.eventDate) {
    const eventDate = new Date(leadContext.eventDate);
    prompt += `- Event Date: ${eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  }
  if (leadContext.location) {
    prompt += `- Location/Venue: ${leadContext.location}\n`;
  }
  if (leadContext.guestCount) {
    prompt += `- Number of Guests: ${leadContext.guestCount}\n`;
  }
  if (leadContext.message) {
    prompt += `\nMESSAGE/SPECIFIC REQUESTS:\n${leadContext.message}\n`;
  }
  
  // Add previous communications context
  if (leadContext.previousCommunications && leadContext.previousCommunications.length > 0) {
    prompt += `\nPREVIOUS COMMUNICATIONS (DO NOT REPEAT THIS INFORMATION - USE IT FOR CONTEXT ONLY):\n`;
    leadContext.previousCommunications.forEach((comm, index) => {
      const date = new Date(comm.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      prompt += `\n${index + 1}. ${comm.type.toUpperCase()} - ${comm.direction.toUpperCase()} - ${date}\n`;
      if (comm.subject) {
        prompt += `   Subject: ${comm.subject}\n`;
      }
      prompt += `   From: ${comm.sent_by}\n`;
      if (comm.sent_to) {
        prompt += `   To: ${comm.sent_to}\n`;
      }
      prompt += `   Content: ${comm.content.substring(0, 500)}${comm.content.length > 500 ? '...' : ''}\n`;
    });
    
    prompt += `\nIMPORTANT: The above communications have already been sent. Your email should:\n`;
    prompt += `- Reference previous communications when relevant to show continuity\n`;
    prompt += `- NOT repeat information already sent (e.g., don't send another "thank you" if one was already sent)\n`;
    prompt += `- MOVE THE CONVERSATION FORWARD to the next logical step in the sales pipeline\n`;
    prompt += `- Address any unanswered questions or concerns\n`;
    prompt += `- Offer the next appropriate action based on where they are in the process\n\n`;
  } else {
    prompt += `\nThis is the FIRST communication with this lead.\n`;
  }
  
  // Detect if this is an equipment-only inquiry
  const isEquipmentOnly = detectEquipmentOnlyInquiry(leadContext);
  const isWedding = (leadContext.eventType || '').toLowerCase().includes('wedding');
  
  prompt += `\nIMPORTANT ANALYSIS:\n`;
  if (isEquipmentOnly && !isWedding) {
    prompt += `- This appears to be an EQUIPMENT RENTAL ONLY inquiry for a NON-WEDDING event\n`;
    prompt += `- The customer wants to rent equipment but may not need full DJ services\n`;
    prompt += `- INCLUDE SPECIFIC PRICING for the equipment they requested\n`;
    prompt += `- Provide a clear total price and make it easy to book/reserve\n`;
    prompt += `- ALWAYS include an upsell for full DJ services (explain benefits, offer package pricing)\n\n`;
  } else if (isEquipmentOnly && isWedding) {
    prompt += `- This appears to be an equipment inquiry for a WEDDING\n`;
    prompt += `- CRITICAL: We do NOT offer equipment-only rentals for weddings\n`;
    prompt += `- Politely explain that weddings require full DJ services\n`;
    prompt += `- Redirect to wedding DJ packages (Essential $799, Premium $1,299, Luxury $1,899)\n`;
    prompt += `- Explain the value: professional coordination, MC services, timeline management are essential\n\n`;
  } else {
    prompt += `- This appears to be a FULL SERVICE inquiry (DJ services needed)\n`;
    prompt += `- They may also need equipment, but DJ services are the primary need\n\n`;
  }

  prompt += `\nPlease generate a professional, personalized email that:\n`;
  if (!leadContext.previousCommunications || leadContext.previousCommunications.length === 0) {
    prompt += `1. Greets them by name\n`;
    prompt += `2. Thanks them for their inquiry\n`;
  } else {
    prompt += `1. Greets them by name\n`;
    prompt += `2. References previous communication(s) to show continuity\n`;
  }
  prompt += `3. Acknowledges their specific event type and details\n`;
  prompt += `4. Addresses any specific questions, requests, or equipment needs they mentioned\n`;
  
  if (isEquipmentOnly && !isWedding) {
    prompt += `5. CALCULATE PRICING for the equipment they need (use the pricing guide provided)\n`;
    prompt += `6. CRITICAL: Ensure the total is AT LEAST $300 (our minimum)\n`;
    prompt += `   - If their request is less than $300, explain the minimum and either:\n`;
    prompt += `     * Add additional equipment/services to reach $300 (suggest lighting, extra mics, etc.)\n`;
    prompt += `     * OR suggest upgrading to full DJ services (better value)\n`;
    prompt += `   - If their request is $300+, provide the clear total price\n`;
    prompt += `7. Make it EASY TO BOOK - offer multiple ways to confirm (reply to email, call, etc.)\n`;
    prompt += `8. INCLUDE UPSELL for full DJ services - explain benefits and offer package pricing\n`;
    prompt += `9. Include professional closing with contact information\n\n`;
  } else if (isEquipmentOnly && isWedding) {
    prompt += `5. Politely explain that weddings require full DJ services (we don't offer equipment-only for weddings)\n`;
    prompt += `6. Explain the value: professional coordination, MC services, timeline management are essential for weddings\n`;
    prompt += `7. Offer wedding DJ packages with equipment included (Essential $799, Premium $1,299, Luxury $1,899)\n`;
    prompt += `8. Make it EASY TO BOOK - offer to schedule a consultation call\n`;
    prompt += `9. Include professional closing with contact information\n\n`;
  } else {
    prompt += `5. Highlights relevant services or solutions (if not already covered)\n`;
    prompt += `6. PROGRESSES THE CONVERSATION - Offers the NEXT LOGICAL STEP (quote, consultation, proposal, etc.)\n`;
    prompt += `7. Includes professional closing with contact information\n\n`;
  }
  
  prompt += `Return the email with "SUBJECT:" followed by the subject line on the first line, then a blank line, then the email body.

IMPORTANT FOR EQUIPMENT RENTALS:
- After providing pricing, include clear instructions on how to confirm/accept:
  * "To lock in this equipment rental, simply reply 'Yes' to this email, or call us at (901) 497-7001"
  * "I'll send you a secure payment link once you confirm"
- Make it easy for them to say yes`;
  
  return prompt;
}

/**
 * Detect if this is an equipment-only rental inquiry
 */
function detectEquipmentOnlyInquiry(leadContext) {
  const message = (leadContext.message || '').toLowerCase();
  const eventType = (leadContext.eventType || '').toLowerCase();
  
  // Keywords that indicate equipment-only rental
  const equipmentOnlyKeywords = [
    'rent', 'rental', 'renting',
    'equipment only', 'just equipment', 'only need equipment',
    'speakers', 'microphone', 'mic', 'lighting', 'lights',
    'sound system', 'sound equipment', 'pa system',
    'cables', 'stands', 'subwoofer', 'sub', 'amplifier', 'amp'
  ];
  
  // Keywords that indicate they want DJ services
  const djServiceKeywords = [
    'dj', 'disc jockey', 'music', 'playlist', 'mixing',
    'mc', 'emcee', 'announcements', 'coordinate',
    'ceremony', 'reception', 'dance', 'entertainment'
  ];
  
  // Count matches
  const equipmentMatches = equipmentOnlyKeywords.filter(keyword => 
    message.includes(keyword)
  ).length;
  
  const djServiceMatches = djServiceKeywords.filter(keyword => 
    message.includes(keyword)
  ).length;
  
  // If they mention equipment keywords but no DJ service keywords, likely equipment-only
  // Also check if they explicitly say "equipment only" or "just need equipment"
  const explicitEquipmentOnly = 
    message.includes('equipment only') ||
    message.includes('just need equipment') ||
    message.includes('only equipment') ||
    message.includes('equipment rental') && !djServiceMatches;
  
  return (equipmentMatches > djServiceMatches && equipmentMatches >= 2) || explicitEquipmentOnly;
}

