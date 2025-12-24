import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/utils/env-validator';
import { createClient } from '@supabase/supabase-js';
import {
  getOrCreateConversation,
  addMessageToConversation,
  getConversationHistory,
  updateConversationContext,
  linkConversationToContact,
} from '@/utils/voice-conversations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Public Voice Assistant Chat API
 * 
 * Handles voice interactions from website visitors
 * Uses same function calling system as admin assistant
 * but with public-safe functions only
 */
export async function POST(request: NextRequest) {
  try {
    const env = getEnv();
    const openaiApiKey = env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, sessionId, conversationHistory = [], contactId, phoneNumber, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(
      sessionId,
      'website',
      contactId,
      phoneNumber,
      context
    );

    // Update context if provided
    if (context) {
      await updateConversationContext(conversation.id, context);
    }

    // Link to contact if available
    if (contactId) {
      await linkConversationToContact(conversation.id, contactId);
    }

    // Get conversation history (use provided or fetch from DB)
    let history = conversationHistory;
    if (history.length === 0) {
      const dbHistory = await getConversationHistory(sessionId, 'website');
      history = dbHistory;
    }

    // Add user message to conversation
    await addMessageToConversation(conversation.id, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Get public-safe function definitions
    const functionsModule = await import('../../../../utils/admin-assistant/functions.js');
    const publicSafeFunctions = functionsModule.getPublicFunctionDefinitions
      ? functionsModule.getPublicFunctionDefinitions()
      : [];

    // Build messages for OpenAI
    const systemPrompt = `You are a friendly AI assistant for M10 DJ Company. You help potential customers with:
- Booking consultations
- Getting quotes for events
- Learning about services
- Music recommendations
- Answering questions about events

Be conversational, helpful, and professional. When customers provide information, use the available functions to help them.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    // Call OpenAI with function calling
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages as any,
      functions: publicSafeFunctions,
      function_call: 'auto',
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0].message;
    let responseText = assistantMessage.content || '';
    let functionCalls: Array<{ name: string; arguments: any; result?: any }> = [];

    // Handle function calls
    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments || '{}');

      // Execute function
      const functionExecutor = await import('../../../../utils/admin-assistant/function-executor.js');
      const supabaseClient = supabase;
      const result = await functionExecutor.executeFunction(
        functionName,
        functionArgs,
        supabaseClient,
        null // userId (null for public)
      );

      functionCalls.push({
        name: functionName,
        arguments: functionArgs,
        result,
      });

      // Get response from function result
      if (result && typeof result === 'object') {
        if ('message' in result && result.message) {
          responseText = result.message as string;
        } else if ('success' in result && result.success) {
          responseText = String(result.success);
        }
      }
    }

    // Add assistant response to conversation
    await addMessageToConversation(conversation.id, {
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString(),
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    });

    return NextResponse.json({
      response: responseText,
      conversationId: conversation.id,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    });
  } catch (error) {
    console.error('Error in voice assistant chat:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

