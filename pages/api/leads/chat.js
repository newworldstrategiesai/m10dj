import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, leadData } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Check if user is asking about packages
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const isPackageQuestion = /package|pricing|price|cost|how much|quote|service|option/i.test(lastUserMessage);
    
    // Get quote ID from leadData or submissionId
    const quoteId = leadData?.submissionId || leadData?.quoteId || leadData?.contactId;
    const hasValidQuoteId = quoteId && quoteId !== 'null' && quoteId !== 'undefined' && quoteId.trim() !== '';

    // Build system prompt
    const systemPrompt = `You are a friendly and helpful assistant for M10 DJ Company, a professional DJ service in Memphis, Tennessee. 

Your role is to:
- Answer questions about DJ services, packages, and pricing
- Help customers understand their options
- Guide them through the booking process
- Be warm, professional, and enthusiastic

IMPORTANT: When customers ask about packages, pricing, or services, you should provide helpful information AND include a link to their personalized package selection page if available.

${hasValidQuoteId ? `The customer has a personalized quote page available at: /quote/${quoteId}` : ''}

When responding about packages:
1. Provide helpful information about the packages
2. ${hasValidQuoteId ? 'Include a link to their personalized package selection page' : 'Let them know they can view packages on their quote page'}
3. Be enthusiastic and helpful

Keep responses conversational, friendly, and helpful.`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} ${errorText}`);
    }

    const data = await openaiResponse.json();
    let assistantMessage = data.choices[0].message.content.trim();

    // If it's a package question and we have a valid quote ID, enhance the response
    if (isPackageQuestion && hasValidQuoteId) {
      // Check if the response already mentions a link
      if (!assistantMessage.includes('/quote/') && !assistantMessage.includes('package selection')) {
        assistantMessage += `\n\nI've prepared a personalized package selection page just for you! [View Your Packages](/quote/${quoteId})`;
      }
    }

    return res.status(200).json({
      message: assistantMessage,
      hasLink: isPackageQuestion && hasValidQuoteId,
      link: hasValidQuoteId ? `/quote/${quoteId}` : null,
      usage: data.usage
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ 
      error: 'Failed to generate response',
      message: "I'm here to help! Could you tell me more about what you're looking for?"
    });
  }
}

