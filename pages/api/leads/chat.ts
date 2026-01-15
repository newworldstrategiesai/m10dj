/**
 * Lead Assistant Chat Endpoint
 * Uses OpenAI GPT to engage with leads naturally
 */

import { NextApiRequest, NextApiResponse } from 'next';

const openaiApiKey = process.env.OPENAI_API_KEY;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  leadData?: {
    name: string;
    email: string;
    phone: string;
    eventType: string;
    eventDate: string;
    venue?: string;
    guests?: string;
    message?: string;
  };
  paymentContext?: {
    pageType: 'payment';
    invoice?: {
      id: string;
      invoice_number: string;
      total_amount: number;
      status: string;
      due_date?: string;
      contact?: {
        name: string;
        email: string;
        phone?: string;
      };
      contract?: {
        id: string;
        contract_number: string;
        status: string;
        signing_url?: string;
      };
    };
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
    const { messages, leadData, paymentContext } = req.body as ChatRequestBody;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Build system prompt with context
    const systemPrompt = paymentContext?.pageType === 'payment' && paymentContext?.invoice
      ? buildPaymentPageSystemPrompt(paymentContext.invoice, leadData)
      : buildSystemPrompt(leadData || { name: 'Guest', email: '', phone: '', eventType: '', eventDate: '' });

    // Build messages array for OpenAI
    const conversationMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    console.log('📤 Sending request to OpenAI API...');
    console.log('Lead:', leadData?.name || paymentContext?.invoice?.contact?.name || 'Guest');
    console.log('Message count:', conversationMessages.length);

    // Call OpenAI API with latest model
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
      console.error('❌ OpenAI API Error:');
      console.error('Status:', response.status);
      console.error('Error:', JSON.stringify(error, null, 2));
      
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

    console.log('✅ OpenAI API Response received');
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
    console.error('❌ Chat endpoint error:', error);
    
    // Return fallback response on error
    return res.status(200).json({
      message: getFallbackResponse(),
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'fallback'
    });
  }
}

/**
 * Build system prompt for payment page context
 */
function buildPaymentPageSystemPrompt(invoice: any, leadData?: any): string {
  const customerName = invoice.contact?.name || leadData?.name || 'there';
  const invoiceNumber = invoice.invoice_number;
  const totalAmount = invoice.total_amount?.toFixed(2) || '0.00';
  const invoiceStatus = invoice.status;
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'Not specified';
  const contractStatus = invoice.contract?.status;
  const contractNumber = invoice.contract?.contract_number;
  const hasContract = !!invoice.contract;

  const promptParts = [
    'You are a friendly and helpful payment assistant for M10 DJ Company, a premium DJ service based in Memphis, Tennessee.',
    '',
    'COMPANY INFORMATION:',
    '- Business: DJ services for weddings, corporate events, parties, and celebrations',
    '- Location: Memphis, Tennessee & Surrounding Areas',
    '- Phone: (901) 410-2020',
    '- Email: djbenmurray@gmail.com',
    '- Website: m10djcompany.com',
    '- Owner: Ben Murray',
    '',
    'CURRENT CONTEXT - PAYMENT PAGE:',
    'You are helping a customer who is currently on the payment page. They have an invoice they need to pay.',
    '',
    'INVOICE DETAILS:',
    `- Invoice Number: ${invoiceNumber}`,
    `- Total Amount: $${totalAmount}`,
    `- Status: ${invoiceStatus}`,
    `- Due Date: ${dueDate}`,
    ...(hasContract ? [`- Contract Number: ${contractNumber || 'N/A'}`] : []),
    ...(hasContract ? [`- Contract Status: ${contractStatus || 'N/A'}`] : []),
    ...(invoice.contact?.email ? [`- Customer Email: ${invoice.contact.email}`] : []),
    ...(invoice.contact?.phone ? [`- Customer Phone: ${invoice.contact.phone}`] : []),
    '',
    'YOUR ROLE:',
    `You are helping ${customerName} complete their payment. Be helpful, reassuring, and professional.`,
    '',
    'COMMON QUESTIONS YOU CAN HELP WITH:',
    '- Payment questions: How to pay, payment methods accepted, payment security',
    '- Invoice questions: What is included, line items, due dates',
    '- Contract questions: Whether contract needs to be signed before payment, contract status',
    '- Technical issues: Payment page not loading, payment errors, confirmation questions',
    '- General questions: What happens after payment, when they will receive confirmation, refund policies',
    '',
    'COMMUNICATION STYLE:',
    '- Be warm, friendly, and reassuring (this is about money, so be empathetic)',
    '- Use natural language with occasional relevant emojis',
    '- Address them by name when appropriate',
    '- Be clear and concise (2-3 sentences typically, max 5)',
    '- Show that you understand payment can be stressful',
    '- Reassure them about payment security',
    '- Provide specific, actionable answers',
    '',
    'PAYMENT SECURITY REASSURANCE:',
    '- All payments are processed securely through Stripe',
    '- Your payment information is encrypted (256-bit SSL)',
    '- We are PCI compliant',
    '- You can verify the payment amount and details before completing',
    '',
    'IMPORTANT GUIDELINES:',
    `- If they ask about payment amount, confirm: $${totalAmount}`,
    `- If they ask about due date, mention: ${dueDate}`,
    '- If payment seems stuck or there is an error, suggest: "Please try refreshing the page or using a different payment method. If the issue persists, you can call us at (901) 410-2020."',
    '- If they ask "what happens after payment": "After your payment is processed, you will receive a confirmation email. Your invoice status will be updated to \'Paid\', and Ben will be notified."',
    '- If they ask about refunds: "Refund policies are outlined in your contract. If you have questions about refunds, please contact Ben directly at (901) 410-2020 or djbenmurray@gmail.com."',
    '- If they are concerned about security: "Your payment is processed securely through Stripe, which is used by millions of businesses worldwide. Your payment information is encrypted and we never see your full card details."',
    ...(hasContract && contractStatus !== 'signed' 
      ? [`- Contract Status: The customer's contract is ${contractStatus}. ${contractStatus === 'pending' ? 'They can sign the contract using the link on the payment page before or after payment.' : 'They should sign the contract before completing payment.'}`]
      : []),
    ...(hasContract && contractStatus === 'signed' 
      ? ['- Contract Status: Their contract has been signed, so they are all set to complete payment.']
      : []),
    '',
    'For questions outside payment/invoice scope, you can still help but keep focus on completing their payment successfully.',
    '',
    `Now help ${customerName} complete their payment!`
  ];
  
  return promptParts.join('\n');
}

/**
 * Build system prompt with lead context
 */
function buildSystemPrompt(leadData: any): string {
  const prompt = [
    'You are a friendly and professional lead assistant for M10 DJ Company, a premium DJ service based in Memphis, Tennessee.',
    '',
    'COMPANY INFORMATION:',
    '- Business: DJ services for weddings, corporate events, parties, and celebrations',
    '- Location: Memphis, Tennessee & Surrounding Areas',
    '- Phone: (901) 410-2020',
    '- Email: djbenmurray@gmail.com',
    '- Website: m10djcompany.com',
    '- Owner: Ben Murray (will personally follow up with leads)',
    '',
    'PACKAGES OFFERED:',
    '- Package 1: Reception Only - $2,000 (DJ/MC, speakers, dance floor lighting, uplighting, additional speaker)',
    '- Package 2: Reception Only - $2,500 (Includes ceremony audio & uplighting) - Most Popular',
    '- Package 3: Ceremony & Reception - $3,000 (Full service with dancing on the clouds effect)',
    '',
    'ADD-ONS:',
    '- Additional Hour(s): $300',
    '- Additional Speaker: $250',
    '- Dancing on the Clouds Effect: $500',
    '- Cold Spark Fountain Effect: $600',
    '- Monogram Projection: $350',
    '- Uplighting Add-on: $300',
    '',
    'CURRENT LEAD INFORMATION:',
    `- Name: ${leadData.name}`,
    `- Email: ${leadData.email}`,
    `- Phone: ${leadData.phone}`,
    `- Event Type: ${leadData.eventType}`,
    `- Event Date: ${leadData.eventDate}`,
    `- Venue: ${leadData.venue || 'Not specified'}`,
    `- Guest Count: ${leadData.guests || 'Not specified'}`,
    `- Additional Details: ${leadData.message || 'None provided'}`,
    '',
    'YOUR ROLE:',
    'You are engaging with a lead who just submitted their contact information. Be warm, genuine, and helpful. This is a real person planning an important event.',
    '',
    'COMMUNICATION STYLE:',
    '- Be warm, friendly, and conversational (never robotic)',
    '- Use natural language with occasional relevant emojis',
    '- Address them by their name sometimes',
    '- Show genuine enthusiasm about their event',
    '- Be helpful and eager to answer questions',
    '- Share relevant knowledge',
    '- Be honest about pricing',
    '- Mention Ben will follow up personally within 24 hours',
    '- Keep responses concise (2-3 sentences typically, max 5)',
    '- Ask follow-up questions to understand their needs',
    '',
    'IMPORTANT:',
    '- Never make promises Ben cannot keep',
    '- For complex issues, say Ben will discuss in detail',
    '- Always mention they will get an email with documents',
    '- Encourage questions and be available to help',
    '- Build their confidence in choosing M10 DJ',
    '- Make them excited about their event',
    '',
    'Now engage naturally with the lead\'s questions!'
  ].join('\n');
  
  return prompt;
}

/**
 * Get fallback response when API fails
 */
function getFallbackResponse(): string {
  const responses = [
    "That's a great question! Our team will make sure to cover all the details when Ben reaches out. In the meantime, feel free to ask anything else!",
    "I love the enthusiasm! Ben is going to be so excited to work with you on this. What else would you like to know?",
    "Perfect! That helps me understand your vision. Do you have any other questions about our services or packages?",
    "Awesome! I'm here to help however I can. What else would you like to discuss?",
    "Got it! That sounds amazing. Anything else I can help you with while you plan?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

