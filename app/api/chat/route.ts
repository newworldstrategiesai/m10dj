import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Force dynamic rendering to prevent build-time static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const BASE_PROMPT = `
You are the AI operations assistant for M10DJ, a premium DJ and event production company.
You sit inside the internal admin console that manages contacts, leads, contracts, invoices, automations, SMS, and Supabase data.

When you answer:
- Be proactive, actionable, and concise. Offer follow-up ideas and call out next steps.
- Reference the correct admin destinations (e.g. /admin/contacts, /admin/automation, /chat/sms) when helpful.
- When outlining work, break instructions into ordered steps or bullet checklists.
- When drafting copy (SMS/email), keep it warm, polished, and brand-aligned with Southern hospitality.
- If data access is needed, describe how to obtain it via Supabase tables or existing API endpoints rather than fabricating numbers.
- If you are unsure, say so and suggest what information is required.
`.trim();

const ACTION_HINTS: Record<string, string> = {
  'daily-brief':
    'Deliver a structured daily operations briefing. Include sections for Leads, Automations, Contracts, Invoices, and Follow-ups. Provide quick bullet lists with recommended owner actions.',
  'sms-reply':
    'Draft a single outbound SMS reply under 320 characters. Maintain a friendly, confident tone, include a clear call-to-action, and provide a placeholder for the contact name if missing.',
  'service-selection':
    'Lay out a step-by-step execution plan to move a lead from demo request to signed contract. Reference relevant admin pages or automations and highlight dependencies or data needed.',
  manual:
    'Answer the operator question directly. Suggest how to execute the task using available tools and note any prerequisites or checks.'
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured in the environment.' },
      { status: 500 }
    );
  }

  try {
    const { messages = [], context } = await request.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages payload.' }, { status: 400 });
    }

    const sanitizedMessages: ChatCompletionMessageParam[] = messages
      .filter(
        (message: any) =>
          message &&
          typeof message.role === 'string' &&
          typeof message.content !== 'undefined' &&
          ['assistant', 'user', 'system'].includes(message.role)
      )
      .map((message: any) => {
        const role: ChatCompletionMessageParam['role'] =
          message.role === 'assistant' ? 'assistant' : message.role === 'system' ? 'system' : 'user';

        const content =
          typeof message.content === 'string'
            ? message.content
            : Array.isArray(message.content)
            ? message.content
                .map((part: unknown) => (typeof part === 'string' ? part : JSON.stringify(part)))
                .join('\n')
            : JSON.stringify(message.content);

        return {
          role,
          content
        };
      });

    const triggerId = typeof context?.trigger === 'string' ? context.trigger : 'manual';
    const focusHint = ACTION_HINTS[triggerId] || ACTION_HINTS.manual;

    const systemMessage = `${BASE_PROMPT}\n\nFocus:\n${focusHint}`;

    const response = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.25,
      max_tokens: 900,
      messages: [
        { role: 'system', content: systemMessage },
        ...sanitizedMessages
      ]
    });

    const completion = response.choices?.[0]?.message?.content ?? '';

    return NextResponse.json({ message: completion });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'The assistant failed to generate a response. Please try again shortly.'
      },
      { status: 500 }
    );
  }
}

