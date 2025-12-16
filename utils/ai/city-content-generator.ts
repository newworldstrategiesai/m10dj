/**
 * AI City Content Generator
 * Generates city-specific content for DJ Dash city pages
 * Uses OpenAI API to create localized guides, tips, FAQs, and seasonal trends
 */

import OpenAI from 'openai';

// Lazy-load OpenAI client to allow environment variables to be loaded first
let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiInstance = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openaiInstance;
}

interface CityContentRequest {
  cityName: string;
  state: string;
  stateAbbr: string;
  djCount?: number;
  eventTypes?: string[];
  popularVenues?: string[];
}

interface GeneratedContent {
  guides: Array<{
    title: string;
    content: string;
    slug: string;
  }>;
  tips: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  seasonalTrends: {
    spring: string;
    summer: string;
    fall: string;
    winter: string;
  };
  localInsights: string[];
}

export async function generateCityContent(
  request: CityContentRequest
): Promise<GeneratedContent> {
  const { cityName, state, stateAbbr, djCount = 0, eventTypes = [], popularVenues = [] } = request;

  const prompt = `You are a content writer for DJ Dash, a professional DJ marketplace. Generate comprehensive, SEO-optimized content for a city page about hiring DJs in ${cityName}, ${state}.

Context:
- City: ${cityName}, ${state} (${stateAbbr})
- Number of DJs: ${djCount}
- Event types served: ${eventTypes.join(', ') || 'weddings, corporate events, parties'}
- Popular venues: ${popularVenues.join(', ') || 'various venues'}

Generate the following content in JSON format:

1. **Guides** (3-5 guides):
   - "Top 10 Wedding Venues in ${cityName} for DJs"
   - "How to Pick a DJ for a Corporate Event in ${cityName}"
   - "Most Popular DJ Songs in ${cityName} Summer Weddings"
   - "DJ Pricing Guide for ${cityName} Events"
   - "Last-Minute DJ Booking in ${cityName}: What You Need to Know"

2. **Tips** (5-7 tips):
   - Practical tips for hiring DJs in ${cityName}
   - City-specific considerations
   - Budget tips
   - Booking timeline advice

3. **FAQs** (8-10 FAQs):
   - "How much does a ${cityName} DJ charge?"
   - "Can I book a DJ last minute in ${cityName}?"
   - "What's the average cost of a wedding DJ in ${cityName}?"
   - "Do ${cityName} DJs provide equipment?"
   - "How far in advance should I book a DJ in ${cityName}?"
   - City-specific questions

4. **Seasonal Trends** (for each season):
   - Popular event types per season
   - Peak booking times
   - Pricing trends
   - Popular music trends

5. **Local Insights** (3-5 insights):
   - City-specific event culture
   - Popular music genres/styles
   - Venue considerations
   - Local DJ market insights

Return ONLY valid JSON in this exact format:
{
  "guides": [
    {
      "title": "Guide Title",
      "content": "Full guide content (300-500 words)",
      "slug": "guide-url-slug"
    }
  ],
  "tips": ["Tip 1", "Tip 2", ...],
  "faqs": [
    {
      "question": "Question?",
      "answer": "Answer (100-200 words)"
    }
  ],
  "seasonalTrends": {
    "spring": "Spring trends description",
    "summer": "Summer trends description",
    "fall": "Fall trends description",
    "winter": "Winter trends description"
  },
  "localInsights": ["Insight 1", "Insight 2", ...]
}`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert content writer specializing in local business SEO and event planning. Generate helpful, accurate, and engaging content that helps people find and hire DJs.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const parsed = JSON.parse(content);
    return parsed as GeneratedContent;
  } catch (error) {
    console.error('Error generating city content:', error);
    // Return fallback content
    return getFallbackContent(request);
  }
}

function getFallbackContent(request: CityContentRequest): GeneratedContent {
  const { cityName, state } = request;
  
  return {
    guides: [
      {
        title: `Top Wedding Venues in ${cityName} for DJs`,
        content: `Planning a wedding in ${cityName}, ${state}? Here are the top venues that work well with professional DJs...`,
        slug: `top-wedding-venues-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
      },
      {
        title: `How to Pick a DJ for a Corporate Event in ${cityName}`,
        content: `Corporate events in ${cityName} require professional DJs who understand business entertainment...`,
        slug: `corporate-dj-guide-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
      },
    ],
    tips: [
      `Book your ${cityName} DJ at least 3-6 months in advance for peak season dates`,
      `Ask about equipment setup requirements for your ${cityName} venue`,
      `Request references from previous ${cityName} events similar to yours`,
      `Confirm the DJ's experience with your specific event type in ${cityName}`,
      `Discuss backup plans in case of equipment issues`,
    ],
    faqs: [
      {
        question: `How much does a ${cityName} DJ charge?`,
        answer: `DJ pricing in ${cityName} varies based on event type, duration, and services needed. Wedding DJs typically range from $800-$2,500, while corporate events may cost $600-$1,500. Contact DJs directly for accurate quotes.`,
      },
      {
        question: `Can I book a DJ last minute in ${cityName}?`,
        answer: `While some ${cityName} DJs may have last-minute availability, it's best to book 3-6 months in advance, especially for weddings and popular dates. Last-minute bookings may have limited options and higher prices.`,
      },
    ],
    seasonalTrends: {
      spring: `Spring is a popular time for weddings and corporate events in ${cityName}`,
      summer: `Summer sees peak wedding season with outdoor events requiring weather backup plans`,
      fall: `Fall brings corporate holiday parties and school events in ${cityName}`,
      winter: `Winter focuses on holiday parties and indoor corporate events`,
    },
    localInsights: [
      `${cityName} has a vibrant event scene with diverse music preferences`,
      `Many ${cityName} venues have specific sound requirements`,
      `Local DJs understand ${cityName} event culture and venue logistics`,
    ],
  };
}

/**
 * Generate a single guide for a city
 */
export async function generateCityGuide(
  cityName: string,
  state: string,
  guideType: 'wedding_venues' | 'corporate_guide' | 'pricing' | 'booking_timeline'
): Promise<{ title: string; content: string; slug: string }> {
  const guidePrompts: Record<string, string> = {
    wedding_venues: `Write a comprehensive guide titled "Top 10 Wedding Venues in ${cityName}, ${state} for DJs". Include venue names, why they're popular, DJ requirements, and tips for couples.`,
    corporate_guide: `Write a guide titled "How to Pick a DJ for a Corporate Event in ${cityName}". Cover professionalism, equipment needs, music selection, and corporate event best practices.`,
    pricing: `Write a comprehensive pricing guide for DJ services in ${cityName}, ${state}. Include average costs by event type, what's included, and factors that affect pricing.`,
    booking_timeline: `Write a guide about booking timelines for DJs in ${cityName}. Cover when to book, peak seasons, last-minute options, and planning tips.`,
  };

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert event planning writer. Create detailed, helpful guides that help people make informed decisions.',
        },
        {
          role: 'user',
          content: guidePrompts[guideType] || guidePrompts.wedding_venues,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || '';
    const title = content.split('\n')[0].replace(/^#+\s*/, '') || `Guide for ${cityName}`;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return {
      title,
      content,
      slug,
    };
  } catch (error) {
    console.error('Error generating guide:', error);
    return {
      title: `Guide for ${cityName}`,
      content: `This guide provides information about DJ services in ${cityName}, ${state}.`,
      slug: `guide-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
    };
  }
}

/**
 * Update city page AI content (to be called quarterly)
 */
export async function refreshCityAIContent(cityPageId: string): Promise<void> {
  // This would fetch city page data, generate new content, and update the database
  // Implementation would go here
  console.log(`Refreshing AI content for city page ${cityPageId}`);
}

