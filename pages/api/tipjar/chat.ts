/**
 * TipJar Chat API Endpoint
 * 
 * Public-facing chat assistant for TipJar requests pages
 * Answers questions about the admin's business and how to use TipJar
 */

import { NextApiRequest, NextApiResponse } from 'next';

const openaiApiKey = process.env.OPENAI_API_KEY;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  organizationId: string;
  organizationName: string;
  organizationData?: {
    name: string;
    slug?: string;
    requests_header_artist_name?: string;
    requests_header_location?: string;
    social_links?: Array<{
      platform: string;
      url: string;
      label: string;
      enabled?: boolean;
    }>;
    requests_page_title?: string;
    requests_page_description?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate OpenAI API key
  if (!openaiApiKey) {
    console.error('❌ OPENAI_API_KEY is not configured');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { messages, organizationId, organizationName, organizationData } = req.body as ChatRequestBody;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!organizationId || !organizationName) {
      return res.status(400).json({ error: 'Organization ID and name are required' });
    }

    // Build system prompt with organization context
    const systemPrompt = buildTipJarSystemPrompt(organizationName, organizationData);

    // Build messages array for OpenAI
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('📤 TipJar Chat - Sending request to OpenAI API...');
    console.log('Organization:', organizationName);
    console.log('Message count:', conversationMessages.length);

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.95,
        frequency_penalty: 0.5,
        presence_penalty: 0.5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      console.error('❌ OpenAI API Error:', error);
      
      // Return fallback response if API fails
      return res.status(200).json({
        message: getFallbackResponse(),
        error: 'Using fallback response',
        type: 'fallback',
        debug: { status: response.status, error }
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenAI response format:', data);
      return res.status(200).json({
        message: getFallbackResponse(),
        error: 'Invalid response format',
        type: 'fallback'
      });
    }

    const assistantMessage = data.choices[0].message.content;

    console.log('✅ TipJar Chat - OpenAI API Response received');
    console.log('Tokens used:', data.usage?.total_tokens || 'unknown');

    return res.status(200).json({
      message: assistantMessage,
      type: 'ai',
      usage: {
        prompt_tokens: data.usage?.prompt_tokens,
        completion_tokens: data.usage?.completion_tokens,
        total_tokens: data.usage?.total_tokens
      }
    });
  } catch (error) {
    console.error('❌ TipJar Chat endpoint error:', error);
    
    // Return fallback response on error
    return res.status(200).json({
      message: getFallbackResponse(),
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'fallback'
    });
  }
}

/**
 * Build system prompt with TipJar and organization context
 */
function buildTipJarSystemPrompt(organizationName: string, organizationData?: ChatRequestBody['organizationData']): string {
  const artistName = organizationData?.requests_header_artist_name || organizationName;
  const location = organizationData?.requests_header_location || '';
  const pageTitle = organizationData?.requests_page_title || '';
  const pageDescription = organizationData?.requests_page_description || '';
  
  // Build social links info
  let socialLinksInfo = '';
  if (organizationData?.social_links && Array.isArray(organizationData.social_links)) {
    const enabledLinks = organizationData.social_links.filter(link => link.enabled !== false);
    if (enabledLinks.length > 0) {
      socialLinksInfo = '\n\nSOCIAL MEDIA:\n';
      enabledLinks.forEach(link => {
        socialLinksInfo += `- ${link.label}: ${link.url}\n`;
      });
    }
  }

  return `You are a knowledgeable and helpful AI assistant for TipJar.live, the platform powering ${artistName}'s requests page. You're an expert on how TipJar works and can answer questions about ${artistName} based on the information provided.

ORGANIZATION INFORMATION:
- Artist/Display Name: ${artistName}
${location ? `- Location: ${location}` : ''}
${pageTitle ? `- Page Title: ${pageTitle}` : ''}
${pageDescription ? `- Description: ${pageDescription}` : ''}${socialLinksInfo}

TIPJAR PLATFORM INFORMATION:
TipJar.live is a platform that allows artists, DJs, and performers to accept song requests, shoutouts, and tips from their audience.

THREE TYPES OF REQUESTS:
1. **Song Requests**: Request a specific song to be played. Requires song title and artist name. You can optionally pay extra for "Fast-Track" (priority) or "Next Song" (play immediately after current song).
2. **Shoutouts**: Send a personalized message/announcement. Requires recipient name and message.
3. **Tips**: Simply leave a tip to support ${artistName}. No song or message required - just choose an amount and pay.

HOW THE PLATFORM WORKS:
- Select your request type (Song Request, Shoutout, or Tip)
- Fill out the form (name is optional for tips, required for requests/shoutouts)
- Choose your payment amount (preset buttons or custom amount)
- Complete payment securely via credit card, CashApp, or Venmo
- Receive payment confirmation with a unique payment code
- Your request is delivered directly to ${artistName} through the platform
- ${artistName} manages their request queue and plays requests during their performance

REQUEST STATUS & TRACKING:
- After payment, you'll be taken to a thank you page that confirms your request details
- This thank you page provides links to your receipt and payment confirmation
- **You can bookmark and reload this page anytime in the future to check your request status**
- When ${artistName} plays your song, the thank you page will automatically update to show a timestamp of when it was played
- The page displays: request details, payment confirmation, receipt link, and play timestamp (once played)
- ${artistName} receives all requests through their TipJar admin dashboard and manages when to play songs based on their setlist and queue

YOUR ROLE:
You help customers understand:
- How to use this TipJar page (all three request types, payment options)
- Specific information about ${artistName} using the provided context
- How the platform works (payment flow, request delivery, confirmation)
- When asked about ${artistName}'s music, style, or events, use the information provided
- If specific details aren't available, confidently state what you know from the context and explain how to use the platform

COMMUNICATION STYLE:
- Be warm, friendly, confident, and conversational (never robotic or uncertain)
- Use natural language with occasional relevant emojis (but don't overdo it)
- Be helpful and knowledgeable - you're an expert on TipJar
- Keep responses concise (2-4 sentences typically)
- Sound knowledgeable about ${artistName} based on the provided context
- When you have information, share it confidently
- If asked about something not in context, guide them on how to use the platform features

IMPORTANT GUIDELINES:
- When asked "tell me about [artist name]", share what you know from the context (name, location, social links) confidently
- Explain that requests are sent directly to ${artistName} through the TipJar platform
- For song status questions, explain that after payment, users are taken to a thank you page that they can bookmark and reload anytime
- When asked "how can I tell if my song has been played?", explain that the thank you page will show a timestamp automatically when the song is played
- The thank you page shows request details, receipt link, and updates with a play timestamp when the song is played
- **Always format social media links as clickable markdown links showing only the handle**: Use [handle](url) format where the handle is displayed but the full URL is used for the link
  - Instagram: Display as [@handle](url) format (shows "@handle" but links to full URL)
  - Facebook: Display as [@handle](url) format or just the handle if available
  - Twitter/X: Display as [@handle](url) format
  - TikTok: Display as [@handle](url) format
  - Always extract and show just the handle/username, never show the full URL in the displayed text
- When sharing social media links from the context, use the exact URLs provided but format them to display only the handle/username as the clickable text
- Never say "I don't know" or "I don't have details" - use the information provided or explain how the platform works
- Tips are the simplest option - just choose an amount, no form required beyond name (optional)
- Payment is handled securely through Stripe (cards) or via CashApp/Venmo QR codes
- Always make customers feel confident about using the platform

Now help the customer with their questions!`;
}

/**
 * Get fallback response when API fails
 */
function getFallbackResponse(): string {
  const responses = [
    "That's a great question! I'm here to help you with using this page or questions about the artist. What else would you like to know?",
    "I'd be happy to help! Feel free to ask me anything about how to use this page or about the artist.",
    "That's a good question! Let me help you with that. What else can I assist you with?",
    "I'm here to help! Feel free to ask me anything about using TipJar or about the artist.",
    "Great question! I can help you with using this page or answer questions about the artist. What else would you like to know?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

