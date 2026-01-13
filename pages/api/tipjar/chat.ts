/**
 * TipJar Chat API Endpoint
 * 
 * Public-facing chat assistant for TipJar requests pages
 * Answers questions about the admin's business and how to use TipJar
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const openaiApiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  organizationId: string;
  organizationName: string;
  eventQrCode?: string; // Optional event QR code for looking up user requests
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
    const { messages, organizationId, organizationName, organizationData, eventQrCode } = req.body as ChatRequestBody;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!organizationId || !organizationName) {
      return res.status(400).json({ error: 'Organization ID and name are required' });
    }

    // Fetch organization settings for assistant configuration
    let assistantSettings = null;
    try {
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('requests_assistant_custom_prompt, requests_assistant_enable_user_status, requests_assistant_enable_all_requests, requests_assistant_enable_queue, requests_assistant_enable_played, requests_assistant_enable_popular, requests_assistant_enable_count, requests_assistant_enable_search')
        .eq('id', organizationId)
        .single();
      
      if (!orgError && org) {
        assistantSettings = {
          customPrompt: org.requests_assistant_custom_prompt,
          enable_user_status: org.requests_assistant_enable_user_status !== false,
          enable_all_requests: org.requests_assistant_enable_all_requests !== false,
          enable_queue: org.requests_assistant_enable_queue !== false,
          enable_played: org.requests_assistant_enable_played !== false,
          enable_popular: org.requests_assistant_enable_popular !== false,
          enable_count: org.requests_assistant_enable_count !== false,
          enable_search: org.requests_assistant_enable_search !== false
        };
      }
    } catch (error) {
      console.error('Error fetching assistant settings:', error);
      // Continue with defaults if settings can't be loaded
    }

    // Analyze user's questions and fetch relevant song request data
    let requestsDataInfo = '';
    
    // Get all user messages to analyze what data they might need
    const allUserMessages = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content?.toLowerCase() || '')
      .join(' ');
    
    const lastUserMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    
    // Determine what type of data query is needed
    const queryType = determineQueryType(allUserMessages, lastUserMessage);
    
    // Check if this query type is enabled
    const isQueryEnabled = assistantSettings && queryType !== 'none' ? (
      (queryType === 'user_status' && assistantSettings.enable_user_status) ||
      (queryType === 'all_requests' && assistantSettings.enable_all_requests) ||
      (queryType === 'queue' && assistantSettings.enable_queue) ||
      (queryType === 'played' && assistantSettings.enable_played) ||
      (queryType === 'popular' && assistantSettings.enable_popular) ||
      (queryType === 'count' && assistantSettings.enable_count) ||
      (queryType === 'search' && assistantSettings.enable_search)
    ) : queryType !== 'none'; // Default to enabled if settings not loaded
    
    if (isQueryEnabled) {
      try {
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
        requestsDataInfo = await fetchRequestsData(supabase, queryType, organizationId, eventQrCode, lastUserMessage);
        console.log(`📊 TipJar Chat - Fetched ${queryType} data for organization ${organizationId}`);
      } catch (error) {
        console.error('Error fetching requests data:', error);
        // Continue without request info - don't fail the chat
      }
    }

    // Build system prompt with organization context and requests data
    const systemPrompt = buildTipJarSystemPrompt(organizationName, organizationData, requestsDataInfo, assistantSettings);

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
 * Determine what type of database query is needed based on user's questions
 */
function determineQueryType(allUserMessages: string, lastUserMessage: string): 'user_status' | 'all_requests' | 'queue' | 'played' | 'popular' | 'count' | 'search' | 'none' {
  const lowerAll = allUserMessages.toLowerCase();
  const lowerLast = lastUserMessage.toLowerCase();
  
  // User asking about their own request status
  if (lowerAll.includes('my request') || lowerAll.includes('my song') || 
      lowerAll.includes('has my') || lowerAll.includes('did my') ||
      lowerAll.includes('when did') || lowerAll.includes('what time') ||
      lowerAll.includes('check my') || lowerAll.includes('my status')) {
    return 'user_status';
  }
  
  // Asking about all requests
  if (lowerLast.includes('what songs') || lowerLast.includes('what requests') ||
      lowerLast.includes('show me') || lowerLast.includes('list') ||
      lowerLast.includes('all songs') || lowerLast.includes('all requests')) {
    return 'all_requests';
  }
  
  // Asking about queue/pending requests
  if (lowerLast.includes('queue') || lowerLast.includes('pending') ||
      lowerLast.includes('waiting') || lowerLast.includes('upcoming') ||
      lowerLast.includes('next songs') || lowerLast.includes('what\'s next')) {
    return 'queue';
  }
  
  // Asking about played songs
  if (lowerLast.includes('played') || lowerLast.includes('already played') ||
      lowerLast.includes('what has been played') || lowerLast.includes('songs played')) {
    return 'played';
  }
  
  // Asking about popular/most requested songs
  if (lowerLast.includes('popular') || lowerLast.includes('most requested') ||
      lowerLast.includes('top songs') || lowerLast.includes('favorite') ||
      lowerLast.includes('most common')) {
    return 'popular';
  }
  
  // Asking about count/statistics
  if (lowerLast.includes('how many') || lowerLast.includes('count') ||
      lowerLast.includes('total requests') || lowerLast.includes('number of')) {
    return 'count';
  }
  
  // Searching for specific song
  if (lowerLast.includes('has') && (lowerLast.includes('been requested') || lowerLast.includes('requested')) ||
      lowerLast.includes('who requested') || lowerLast.includes('requested by')) {
    return 'search';
  }
  
  return 'none';
}

/**
 * Fetch song request data from database based on query type
 */
async function fetchRequestsData(
  supabase: any,
  queryType: string,
  organizationId: string,
  eventQrCode?: string,
  searchQuery?: string
): Promise<string> {
  let query = supabase
    .from('crowd_requests')
    .select('id, song_title, song_artist, requester_name, status, played_at, created_at, request_type, is_fast_track')
    .eq('organization_id', organizationId)
    .eq('request_type', 'song_request'); // Only get song requests for now
  
  // Filter by event code if available
  if (eventQrCode) {
    query = query.eq('event_qr_code', eventQrCode);
  }
  
  switch (queryType) {
    case 'user_status':
      // Get recent requests for this event (user's own requests)
      // Note: Without event code, we can't identify specific user requests
      // But we can still show recent requests for the organization
      query = query.order('created_at', { ascending: false }).limit(10);
      break;
      
    case 'all_requests':
      // Get all recent requests
      query = query.order('created_at', { ascending: false }).limit(20);
      break;
      
    case 'queue':
      // Get pending/acknowledged/playing requests
      query = query.in('status', ['new', 'acknowledged', 'playing'])
                   .order('priority_order', { ascending: true })
                   .order('created_at', { ascending: true })
                   .limit(20);
      break;
      
    case 'played':
      // Get played requests
      query = query.eq('status', 'played')
                   .order('played_at', { ascending: false })
                   .limit(20);
      break;
      
    case 'popular':
      // Get most requested songs (group by song)
      query = query.order('created_at', { ascending: false }).limit(100);
      break;
      
    case 'count':
      // Get count of requests
      const { count, error: countError } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('request_type', 'song_request');
      
      if (eventQrCode) {
        const { count: eventCount } = await supabase
          .from('crowd_requests')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('event_qr_code', eventQrCode)
          .eq('request_type', 'song_request');
        
        return `\n\nSONG REQUEST STATISTICS:\n- Total song requests for this organization: ${count || 0}\n- Song requests for this event: ${eventCount || 0}\n\nUse this information to answer questions about how many requests have been made.`;
      }
      
      return `\n\nSONG REQUEST STATISTICS:\n- Total song requests: ${count || 0}\n\nUse this information to answer questions about how many requests have been made.`;
      
    case 'search':
      // Search for specific song
      if (searchQuery) {
        // Try to extract song title or artist from query
        // Remove common words and extract meaningful terms
        const commonWords = ['has', 'been', 'requested', 'who', 'by', 'the', 'a', 'an', 'is', 'was'];
        const searchTerms = searchQuery
          .split(/\s+/)
          .filter(term => term.length > 2 && !commonWords.includes(term.toLowerCase()));
        
        if (searchTerms.length > 0) {
          // Use the first meaningful term for search
          const searchTerm = searchTerms[0];
          query = query.or(`song_title.ilike.%${searchTerm}%,song_artist.ilike.%${searchTerm}%`)
                       .limit(10);
        } else {
          // Fallback: use the whole query
          query = query.or(`song_title.ilike.%${searchQuery}%,song_artist.ilike.%${searchQuery}%`)
                       .limit(10);
        }
      }
      break;
      
    default:
      return '';
  }
  
  const { data: requests, error: requestsError } = await query;
  
  if (requestsError) {
    console.error('Error fetching requests:', requestsError);
    return '';
  }
  
  if (!requests || requests.length === 0) {
    return '';
  }
  
  // Format data based on query type
  switch (queryType) {
    case 'user_status':
      return formatUserRequests(requests);
      
    case 'all_requests':
      return formatAllRequests(requests);
      
    case 'queue':
      return formatQueueRequests(requests);
      
    case 'played':
      return formatPlayedRequests(requests);
      
    case 'popular':
      return formatPopularRequests(requests);
      
    case 'search':
      return formatSearchResults(requests);
      
    default:
      return '';
  }
}

/**
 * Format user's own requests
 */
function formatUserRequests(requests: any[]): string {
  if (requests.length === 0) {
    return '';
  }
  
  const requestsList = requests.map(req => {
    const isPlayed = req.status === 'played' && req.played_at;
    let playTime = null;
    if (isPlayed && req.played_at) {
      try {
        const playedDate = new Date(req.played_at);
        playTime = playedDate.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {
        playTime = new Date(req.played_at).toLocaleString();
      }
    }
    
    return `- "${req.song_title || 'Unknown'}" by ${req.song_artist || 'Unknown Artist'} (Requested by ${req.requester_name || 'Unknown'}) - Status: ${req.status}${isPlayed && playTime ? ` - Played at: ${playTime}` : ''}`;
  }).join('\n');
  
  return `\n\nRECENT SONG REQUESTS:\n${requestsList}\n\nWhen answering questions about request status, use this information. If a request shows "Status: played" with a "Played at" timestamp, tell the user their song has been played and provide the exact time it was played. If a request shows other statuses (new, acknowledged, playing), explain the current status and that it hasn't been played yet. Note: If the user is asking about their own specific request, match by requester name if possible.`;
}

/**
 * Format all requests
 */
function formatAllRequests(requests: any[]): string {
  const requestsList = requests.map(req => {
    const statusEmoji = req.status === 'played' ? '✅' : req.status === 'playing' ? '▶️' : '⏳';
    return `${statusEmoji} "${req.song_title || 'Unknown'}" by ${req.song_artist || 'Unknown Artist'} - ${req.status}`;
  }).join('\n');
  
  return `\n\nRECENT SONG REQUESTS:\n${requestsList}\n\nUse this information to answer questions about what songs have been requested.`;
}

/**
 * Format queue requests
 */
function formatQueueRequests(requests: any[]): string {
  const requestsList = requests.map((req, index) => {
    const priority = req.is_fast_track ? '⚡ FAST-TRACK' : '';
    return `${index + 1}. "${req.song_title || 'Unknown'}" by ${req.song_artist || 'Unknown Artist'} ${priority} - ${req.status}`;
  }).join('\n');
  
  return `\n\nCURRENT QUEUE (Pending/Upcoming Songs):\n${requestsList}\n\nUse this information to answer questions about what songs are in the queue or waiting to be played.`;
}

/**
 * Format played requests
 */
function formatPlayedRequests(requests: any[]): string {
  const requestsList = requests.map(req => {
    let playTime = null;
    if (req.played_at) {
      try {
        const playedDate = new Date(req.played_at);
        playTime = playedDate.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (e) {
        playTime = new Date(req.played_at).toLocaleString();
      }
    }
    
    return `✅ "${req.song_title || 'Unknown'}" by ${req.song_artist || 'Unknown Artist'}${playTime ? ` - Played at ${playTime}` : ''}`;
  }).join('\n');
  
  return `\n\nRECENTLY PLAYED SONGS:\n${requestsList}\n\nUse this information to answer questions about what songs have already been played.`;
}

/**
 * Format popular requests (count duplicates)
 */
function formatPopularRequests(requests: any[]): string {
  // Count occurrences of each song
  const songCounts: Record<string, { count: number; song: any }> = {};
  
  requests.forEach(req => {
    if (req.song_title && req.song_artist) {
      const key = `${req.song_title.toLowerCase()}|${req.song_artist.toLowerCase()}`;
      if (!songCounts[key]) {
        songCounts[key] = { count: 0, song: req };
      }
      songCounts[key].count++;
    }
  });
  
  const popular = Object.values(songCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((item, index) => {
      return `${index + 1}. "${item.song.song_title}" by ${item.song.song_artist} - Requested ${item.count} time${item.count > 1 ? 's' : ''}`;
    })
    .join('\n');
  
  return `\n\nMOST REQUESTED SONGS:\n${popular}\n\nUse this information to answer questions about popular or most requested songs.`;
}

/**
 * Format search results
 */
function formatSearchResults(requests: any[]): string {
  const results = requests.map(req => {
    return `- "${req.song_title || 'Unknown'}" by ${req.song_artist || 'Unknown Artist'} - Requested by ${req.requester_name || 'Unknown'} - Status: ${req.status}`;
  }).join('\n');
  
  return `\n\nSEARCH RESULTS:\n${results}\n\nUse this information to answer questions about whether specific songs have been requested and who requested them.`;
}

/**
 * Build system prompt with TipJar and organization context
 */
function buildTipJarSystemPrompt(
  organizationName: string, 
  organizationData?: ChatRequestBody['organizationData'], 
  requestsDataInfo?: string,
  assistantSettings?: {
    customPrompt?: string | null;
    enable_user_status?: boolean;
    enable_all_requests?: boolean;
    enable_queue?: boolean;
    enable_played?: boolean;
    enable_popular?: boolean;
    enable_count?: boolean;
    enable_search?: boolean;
  } | null
): string {
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

  // Use custom prompt if provided, otherwise use default
  if (assistantSettings?.customPrompt) {
    // Replace placeholders in custom prompt
    let customPrompt = assistantSettings.customPrompt;
    customPrompt = customPrompt.replace(/{artistName}/g, artistName);
    customPrompt = customPrompt.replace(/{location}/g, location);
    customPrompt = customPrompt.replace(/{organizationName}/g, organizationName);
    customPrompt = customPrompt.replace(/{pageTitle}/g, pageTitle);
    customPrompt = customPrompt.replace(/{pageDescription}/g, pageDescription);
    
    // Append requests data info if available
    if (requestsDataInfo) {
      customPrompt += requestsDataInfo;
    }
    
    return customPrompt;
  }

  // Default prompt
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
- **You can also ask me directly about song requests!** I can answer questions like:
  - "Has my song been played?" or "When did my song play?" - Check your request status
  - "What songs have been requested?" - See all recent requests
  - "What's in the queue?" - See upcoming songs
  - "What songs have been played?" - See recently played songs
  - "What's the most popular song?" - See most requested songs
  - "How many requests have been made?" - Get request statistics
  - "Has [song name] been requested?" - Search for specific songs
${requestsDataInfo || ''}

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
- **When you have access to song request data (provided above), use it to answer questions directly and accurately**
- For user's own request status: If data shows "Status: played" with a "Played at" timestamp, tell them their song has been played and provide the exact time. If status is new/acknowledged/playing, explain the current status
- For questions about all requests: Use the provided list to tell them what songs have been requested
- For queue questions: Use the queue data to tell them what songs are waiting to be played
- For played songs questions: Use the played songs list to tell them what has already been played
- For popular songs: Use the popular songs data to tell them the most requested songs
- For count questions: Use the statistics to tell them how many requests have been made
- For search questions: Use the search results to tell them if a specific song has been requested and by whom
- If you don't have access to specific request information, explain that after payment, users are taken to a thank you page that they can bookmark and reload anytime to check status
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

