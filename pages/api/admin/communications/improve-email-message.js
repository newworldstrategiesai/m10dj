import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/utils/auth-helpers/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: Require admin authentication to use AI features
  try {
    await requireAdmin(req, res);
  } catch (error) {
    if (res.headersSent) return;
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message, contactName, eventType, eventDate } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    // Build context for AI
    const context = [];
    if (contactName) context.push(`Contact name: ${contactName}`);
    if (eventType) context.push(`Event type: ${eventType}`);
    if (eventDate) context.push(`Event date: ${eventDate}`);

    const systemPrompt = `You are a helpful assistant that improves email messages to make them more natural, casual, and friendly while maintaining professionalism. 

Your task is to:
- Make the tone more conversational and less formal
- Keep the same key information and intent
- Make it sound like a real person wrote it, not a template
- Preserve any links or important details exactly as they are
- Keep the same length or slightly shorter
- Make it feel warm and personal

Return only the improved message text, nothing else.`;

    const userPrompt = `Improve this email message to make it more natural and casual:

${message}

${context.length > 0 ? `\nContext:\n${context.join('\n')}` : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid OpenAI API response structure');
    }
    
    const improvedMessage = data.choices[0].message.content.trim();

    return res.status(200).json({ improvedMessage });
  } catch (error) {
    console.error('Error improving email message:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to improve email message' 
    });
  }
}

