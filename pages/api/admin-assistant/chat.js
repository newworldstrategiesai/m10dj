/**
 * Admin Assistant Chat API
 * 
 * Handles natural language commands from admin users and executes operations
 * using OpenAI Function Calling
 */

import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { getFunctionDefinitions } from '../../../utils/admin-assistant/functions';
import { executeFunction } from '../../../utils/admin-assistant/function-executor';
import { formatResponseWithUI } from '../../../utils/admin-assistant/format-response';

const openaiApiKey = process.env.OPENAI_API_KEY;

// Admin emails for authentication
const adminEmails = [
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify admin authentication
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized - Please sign in' });
    }

    const isAdmin = adminEmails.includes(session.user.email || '');
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied - Admin only' });
    }

    // 2. Validate OpenAI API key
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY is not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // 3. Parse request
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🤖 Admin Assistant Request:', {
      user: session.user.email,
      message: message.substring(0, 100) + '...',
      historyLength: conversationHistory.length
    });

    // 4. Get function definitions
    const functionDefinitions = getFunctionDefinitions();

    // 5. Build conversation messages
    const systemPrompt = `You are an AI assistant for M10 DJ Company's admin dashboard. You help admins manage contacts, quotes, invoices, contracts, and other business operations through natural language commands.

Your capabilities:
- Search and view contacts, quotes, invoices, contracts
- Create and update records
- Generate reports and analytics
- Send communications (SMS, email)
- Manage projects and events

Guidelines:
- Be concise and helpful
- Always confirm before executing destructive operations
- Format results clearly (use tables, lists, etc.)
- Ask for clarification if the request is ambiguous
- Provide actionable next steps when appropriate
- When returning function results, provide clear summaries that will be enhanced with clickable cards and buttons

IMPORTANT: When function results contain data (contacts, quotes, invoices, etc.), the system will automatically format them as clickable cards and buttons. Your text response should provide context and summary. The UI elements will handle navigation and actions.

Current user: ${session.user.email}
Current time: ${new Date().toLocaleString()}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    // 6. Call OpenAI with function calling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use GPT-4o for better function calling
        messages: messages,
        tools: functionDefinitions.map(def => ({
          type: 'function',
          function: def
        })),
        tool_choice: 'auto', // Let the model decide when to use functions
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API Error:', errorText);
      return res.status(500).json({
        error: 'AI service error',
        message: 'Failed to process your request. Please try again.'
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // 7. Handle function calls if any
    let functionResults = [];
    let finalResponse = assistantMessage.content || '';

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`🔧 Executing ${assistantMessage.tool_calls.length} function call(s)...`);

      // Execute all function calls
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        let functionArgs;
        
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (parseError) {
          console.error('❌ Error parsing function arguments:', parseError);
          functionResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify({ error: 'Invalid function arguments' })
          });
          continue;
        }

        console.log(`  📞 Calling: ${functionName}`, functionArgs);

        try {
          // Execute the function
          const result = await executeFunction(
            functionName,
            functionArgs,
            supabase,
            session.user.id
          );

          functionResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(result)
          });

          console.log(`  ✅ ${functionName} completed successfully`);
        } catch (functionError) {
          console.error(`  ❌ ${functionName} failed:`, functionError);
          functionResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify({
              error: functionError.message || 'Function execution failed',
              success: false
            })
          });
        }
      }

      // 8. Get final response from OpenAI with function results
      const finalMessages = [
        ...messages,
        assistantMessage,
        ...functionResults
      ];

      const finalResponseData = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: finalMessages,
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (finalResponseData.ok) {
        const finalData = await finalResponseData.json();
        finalResponse = finalData.choices[0].message.content;
      }
    }

    // Format response with UI elements (buttons/cards) based on function results
    let structuredContent = null;
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Get the first function result to format (most common case)
      const firstToolCall = assistantMessage.tool_calls[0];
      const firstResult = functionResults.find(fr => fr.tool_call_id === firstToolCall.id);
      
      if (firstResult) {
        try {
          const resultData = JSON.parse(firstResult.content);
          structuredContent = formatResponseWithUI(
            firstToolCall.function.name,
            resultData,
            JSON.parse(firstToolCall.function.arguments)
          );
        } catch (e) {
          console.warn('Failed to parse function result for UI formatting:', e);
        }
      }
    }

    // Combine text response with structured content if available
    if (structuredContent) {
      finalResponse = JSON.stringify({
        text: finalResponse,
        ...structuredContent
      });
    }

    // 9. Log the operation
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabaseAdmin.from('admin_assistant_logs').insert({
        user_id: session.user.id,
        user_email: session.user.email,
        message: message,
        response: finalResponse,
        functions_called: assistantMessage.tool_calls?.map(tc => tc.function.name) || [],
        created_at: new Date().toISOString()
      });
    } catch (logError) {
      console.warn('⚠️ Failed to log assistant interaction:', logError);
      // Don't fail the request if logging fails
    }

    // 10. Return response
    return res.status(200).json({
      message: finalResponse,
      functions_called: assistantMessage.tool_calls?.map(tc => ({
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })) || [],
      usage: data.usage
    });

  } catch (error) {
    console.error('❌ Admin assistant error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

