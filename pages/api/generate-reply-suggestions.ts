// API endpoint to generate intelligent reply suggestions using OpenAI
import { NextApiRequest, NextApiResponse } from 'next';

interface Message {
  role: 'customer' | 'business';
  content: string;
}

interface LeadData {
  eventType?: string;
  hasDate: boolean;
  hasVenue: boolean;
  hasBudget: boolean;
  hasGuestCount: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lastMessage, conversationHistory, leadData } = req.body as {
      lastMessage: string;
      conversationHistory: Message[];
      leadData: LeadData;
    };

    if (!lastMessage) {
      return res.status(400).json({ error: 'Missing required field: lastMessage' });
    }

    // Build context for OpenAI
    const conversationContext = conversationHistory
      .map(m => `${m.role === 'customer' ? 'Customer' : 'You'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a professional DJ service business owner. Generate 3 quick reply suggestions for the latest customer message.

Context about the conversation:
- Event Type: ${leadData.eventType || 'Not specified'}
- Date Provided: ${leadData.hasDate ? 'Yes' : 'No'}
- Venue Provided: ${leadData.hasVenue ? 'Yes' : 'No'}
- Budget Discussed: ${leadData.hasBudget ? 'Yes' : 'No'}
- Guest Count Provided: ${leadData.hasGuestCount ? 'Yes' : 'No'}

Guidelines:
1. Be friendly, professional, and enthusiastic
2. Don't ask for information already provided in the conversation
3. Move the conversation forward toward booking
4. Keep responses under 160 characters each
5. Focus on next steps: pricing details, availability check, package options, or scheduling a call
6. Match the customer's tone (formal or casual)

Conversation so far:
${conversationContext}

Customer's latest message: ${lastMessage}

Generate exactly 3 short, actionable reply options. You must respond with valid JSON in this exact format:
{
  "suggestions": ["first reply", "second reply", "third reply"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt }
        ],
        max_tokens: 250,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    // Parse the JSON response
    let suggestions: string[];
    try {
      const parsed = JSON.parse(aiResponse);
      // Handle different possible response formats
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || parsed.replies || [];
    } catch (parseError) {
      console.error('Error parsing AI response:', aiResponse);
      // Fallback to basic suggestions
      suggestions = [
        "That sounds perfect! I'd love to discuss the details.",
        "Great! Let me check my availability and get back to you.",
        "I'm excited to work with you on this! Should I send over pricing?"
      ];
    }

    // Ensure we have exactly 3 suggestions
    if (suggestions.length < 3) {
      suggestions.push(
        "I'd be happy to discuss this further. When's a good time to chat?",
        "Let me put together a custom package for you!",
        "That sounds amazing! I'd love to be part of your event."
      );
    }

    return res.status(200).json({ 
      suggestions: suggestions.slice(0, 3) 
    });

  } catch (error) {
    console.error('Error generating reply suggestions:', error);
    
    // Return fallback suggestions instead of error
    return res.status(200).json({
      suggestions: [
        "That sounds perfect! I'd love to discuss the details further.",
        "Great! Let me check my availability and send you a custom quote.",
        "I'm excited to work with you on this! When would be a good time to chat?"
      ]
    });
  }
}

