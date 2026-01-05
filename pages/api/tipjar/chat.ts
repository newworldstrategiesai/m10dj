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

  return `You are a friendly and helpful AI assistant for TipJar.live, helping customers on ${organizationName}'s request page.

ORGANIZATION INFORMATION:
- Business/Artist Name: ${artistName}
${location ? `- Location: ${location}` : ''}
${pageTitle ? `- Page Title: ${pageTitle}` : ''}
${pageDescription ? `- Description: ${pageDescription}` : ''}${socialLinksInfo}

TIPJAR PLATFORM INFORMATION:
TipJar.live is a platform that allows artists, DJs, and performers to accept song requests, shoutouts, and tips from their audience. Customers can:
- Request songs to be played
- Send shoutouts/messages
- Leave tips
- Make payments securely through the platform

HOW TO USE THIS PAGE:
1. Fill out the request form with your name, song details (if requesting a song), or message (if sending a shoutout)
2. Choose your payment amount
3. Complete payment securely
4. Your request will be sent to ${artistName}

YOUR ROLE:
You help customers understand:
- How to use this TipJar page (submitting requests, making payments)
- Information about ${artistName} (if available)
- General questions about the platform
- Payment and request process

COMMUNICATION STYLE:
- Be warm, friendly, and conversational (never robotic)
- Use natural language with occasional relevant emojis
- Be helpful and eager to answer questions
- Keep responses concise (2-3 sentences typically, max 5)
- If you don't know specific details about ${artistName}, be honest and suggest they contact them directly
- For technical payment issues, suggest they check their payment method or contact support

IMPORTANT:
- Never make promises you can't keep
- For specific business questions about ${artistName} that you don't have information about, suggest they contact the artist directly
- Always be helpful about how to use TipJar features
- Make customers feel confident using the platform
- If asked about pricing, explain that payment amounts are set by the artist and shown on the page

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

