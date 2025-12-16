/**
 * AI City + Event Type Content Generator
 * Generates SEO-rich, LLM-optimized content for city + event type pages
 * Optimized for AI search engines (ChatGPT, Perplexity, etc.)
 */

import OpenAI from 'openai';

// Lazy-load OpenAI client
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

interface CityEventContentRequest {
  cityName: string;
  state: string;
  stateAbbr: string;
  eventType: string; // 'wedding', 'corporate', 'birthday', 'school_dance', 'holiday_party', 'private_party'
  eventTypeDisplay: string; // 'Wedding DJs', 'Corporate Event DJs', etc.
  djCount?: number;
  popularVenues?: string[];
  averagePriceRange?: string;
  averageRating?: number;
  reviewCount?: number;
  averageResponseTime?: string; // e.g., '<24hrs', '2-4 hours'
  averageBookingLeadTime?: string; // e.g., '30-90 days'
}

interface GeneratedCityEventContent {
  // SEO Metadata
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  metaOgTitle: string;
  metaOgDescription: string;

  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;

  // Main Content
  introductionText: string; // Opening paragraph (200-300 words)
  whyChooseSection: string; // Why choose DJs for this event type in this city (300-400 words)
  pricingSection: string; // City + event type specific pricing (200-300 words)
  venueSection: string; // Popular venues for this event type (300-400 words)
  timelineSection: string; // Booking timeline (150-200 words)

  // LLM-Optimized Content
  comprehensiveGuide: string; // Long-form guide (2000+ words) for LLM understanding
  localInsights: string; // City-specific insights for this event type (400-500 words)
  seasonalTrends: {
    spring: string;
    summer: string;
    fall: string;
    winter: string;
  };
  popularSongs: string[]; // Popular songs for this event type in this city
  venueRecommendations: Array<{
    name: string;
    description: string;
    whyPopular: string;
  }>;

  // FAQs (Critical for LLM Search)
  faqs: Array<{
    question: string;
    answer: string; // 100-200 words, direct answers
  }>;

  // Structured Data (JSON-LD)
  structuredData: any;
}

const EVENT_TYPE_CONTEXT: Record<string, { keywords: string[]; tone: string; focus: string }> = {
  wedding: {
    keywords: ['wedding DJ', 'wedding entertainment', 'reception DJ', 'ceremony music', 'bridal party'],
    tone: 'romantic, elegant, celebratory',
    focus: 'ceremony, reception, first dance, special moments'
  },
  corporate: {
    keywords: ['corporate DJ', 'business event DJ', 'company party DJ', 'corporate entertainment'],
    tone: 'professional, sophisticated, business-appropriate',
    focus: 'background music, presentations, networking, awards'
  },
  birthday: {
    keywords: ['birthday party DJ', 'birthday DJ', 'party DJ', 'celebration DJ'],
    tone: 'fun, energetic, celebratory',
    focus: 'age-appropriate music, party atmosphere, requests'
  },
  school_dance: {
    keywords: ['school dance DJ', 'prom DJ', 'homecoming DJ', 'student event DJ'],
    tone: 'age-appropriate, energetic, safe',
    focus: 'clean music, student engagement, school policies'
  },
  holiday_party: {
    keywords: ['holiday party DJ', 'Christmas party DJ', 'New Year DJ', 'holiday entertainment'],
    tone: 'festive, celebratory, seasonal',
    focus: 'holiday music, seasonal atmosphere, year-end celebrations'
  },
  private_party: {
    keywords: ['private party DJ', 'private event DJ', 'party DJ', 'event DJ'],
    tone: 'versatile, personalized, fun',
    focus: 'custom playlists, personal preferences, intimate gatherings'
  }
};

export async function generateCityEventContent(
  request: CityEventContentRequest
): Promise<GeneratedCityEventContent> {
  const {
    cityName,
    state,
    stateAbbr,
    eventType,
    eventTypeDisplay,
    djCount = 0,
    popularVenues = [],
    averagePriceRange
  } = request;

  const eventContext = EVENT_TYPE_CONTEXT[eventType] || EVENT_TYPE_CONTEXT.private_party;

  const prompt = `You are an expert SEO content writer specializing in local business content optimized for both traditional search engines and AI-powered search engines (ChatGPT, Perplexity, Google Gemini).

Generate comprehensive, SEO-rich content for a page about ${eventTypeDisplay} in ${cityName}, ${state}.

Context:
- City: ${cityName}, ${state} (${stateAbbr})
- Event Type: ${eventTypeDisplay} (${eventType})
- Number of DJs: ${djCount}
- Average Price Range: ${averagePriceRange || 'varies'}
- Popular Venues: ${popularVenues.join(', ') || 'various venues'}
- Tone: ${eventContext.tone}
- Focus: ${eventContext.focus}

Generate the following content in JSON format:

1. **SEO Metadata**:
   - seoTitle: "Best ${eventTypeDisplay} in ${cityName} ${stateAbbr} | Find ${eventTypeDisplay} | DJ Dash"
   - seoDescription: Compelling 155-160 character description with primary keywords
   - seoKeywords: Array of 15-20 relevant keywords including "${eventTypeDisplay} ${cityName}", "${cityName} ${eventType} DJ", etc.
   - metaOgTitle: Social media optimized title
   - metaOgDescription: Social media optimized description

2. **Hero Section**:
   - heroTitle: Compelling H1 (60-80 characters)
   - heroSubtitle: Engaging subtitle (100-120 characters)
   - heroDescription: Brief description (150-200 words)

3. **Main Content Sections** (each 200-400 words):
   - introductionText: Opening paragraph that answers "Why ${eventTypeDisplay} in ${cityName}?"
   - whyChooseSection: Why choose professional DJs for ${eventType} events in ${cityName}
   - pricingSection: Detailed pricing information specific to ${eventType} events in ${cityName}
   - venueSection: Popular ${eventType} venues in ${cityName} and DJ considerations
   - timelineSection: When to book, peak seasons, planning timeline

4. **LLM-Optimized Content**:
   - comprehensiveGuide: Long-form guide (2000+ words) covering everything about ${eventTypeDisplay} in ${cityName}. This should be comprehensive enough for AI search engines to extract detailed information. Include: planning tips, what to expect, common questions, venue considerations, music selection, timeline, budgeting, and local insights.
   - localInsights: City-specific insights about ${eventType} events in ${cityName} (400-500 words)
   - seasonalTrends: For each season, describe ${eventType} trends in ${cityName}
   - popularSongs: Array of 10-15 popular songs for ${eventType} events in ${cityName}
   - venueRecommendations: Array of 5-8 popular venues with descriptions

5. **FAQs** (Critical for LLM Search - 10-12 FAQs):
   Each FAQ should have:
   - question: Direct, natural language question people ask
   - answer: Comprehensive answer (100-200 words) that directly answers the question
   
   Include questions like:
   - "How much does a ${eventType} DJ cost in ${cityName}?"
   - "What's the average price for ${eventTypeDisplay} in ${cityName}?"
   - "How far in advance should I book a ${eventType} DJ in ${cityName}?"
   - "What venues in ${cityName} are popular for ${eventType} events?"
   - "What music do ${eventType} DJs play in ${cityName}?"
   - "Do ${cityName} ${eventType} DJs provide equipment?"
   - City and event-type specific questions

6. **Structured Data** (JSON-LD schema):
   Generate structured data for:
   - Service type
   - LocalBusiness
   - FAQPage schema
   - AggregateRating (if applicable)

Return ONLY valid JSON in this exact format:
{
  "seoTitle": "...",
  "seoDescription": "...",
  "seoKeywords": [...],
  "metaOgTitle": "...",
  "metaOgDescription": "...",
  "heroTitle": "...",
  "heroSubtitle": "...",
  "heroDescription": "...",
  "introductionText": "...",
  "whyChooseSection": "...",
  "pricingSection": "...",
  "venueSection": "...",
  "timelineSection": "...",
  "comprehensiveGuide": "...",
  "localInsights": "...",
  "seasonalTrends": {
    "spring": "...",
    "summer": "...",
    "fall": "...",
    "winter": "..."
  },
  "popularSongs": [...],
  "venueRecommendations": [
    {
      "name": "...",
      "description": "...",
      "whyPopular": "..."
    }
  ],
  "faqs": [
    {
      "question": "...",
      "answer": "..."
    }
  ],
  "structuredData": {...}
}`;

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert SEO content writer specializing in local business content optimized for both traditional search engines and AI-powered search engines. Generate comprehensive, accurate, and helpful content that directly answers user questions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    const parsed = JSON.parse(content);
    
    // Enhance structured data
    parsed.structuredData = generateStructuredData({
      cityName,
      state,
      stateAbbr,
      eventType,
      eventTypeDisplay,
      djCount,
      content: parsed
    });

    return parsed as GeneratedCityEventContent;
  } catch (error) {
    console.error('Error generating city event content:', error);
    // Return fallback content
    return getFallbackContent(request);
  }
}

/**
 * Generate structured data (JSON-LD) for SEO and LLM understanding
 */
function generateStructuredData(params: {
  cityName: string;
  state: string;
  stateAbbr: string;
  eventType: string;
  eventTypeDisplay: string;
  djCount: number;
  content: any;
}): any {
  const { cityName, state, stateAbbr, eventType, eventTypeDisplay, djCount, content } = params;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: `${eventTypeDisplay} in ${cityName}`,
    provider: {
      '@type': 'LocalBusiness',
      name: `DJ Dash - ${eventTypeDisplay} in ${cityName}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: cityName,
        addressRegion: stateAbbr,
        addressCountry: 'US',
      },
    },
    areaServed: {
      '@type': 'City',
      name: cityName,
      addressRegion: stateAbbr,
    },
    offers: {
      '@type': 'Offer',
      description: `${eventTypeDisplay} services in ${cityName}`,
    },
    ...(content.faqs && content.faqs.length > 0 && {
      '@type': 'FAQPage',
      mainEntity: content.faqs.map((faq: any) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }),
  };
}

/**
 * Fallback content if AI generation fails
 */
function getFallbackContent(request: CityEventContentRequest): GeneratedCityEventContent {
  const { cityName, state, stateAbbr, eventType, eventTypeDisplay } = request;
  const eventContext = EVENT_TYPE_CONTEXT[eventType] || EVENT_TYPE_CONTEXT.private_party;

  return {
    seoTitle: `Best ${eventTypeDisplay} in ${cityName} ${stateAbbr} | Find ${eventTypeDisplay} | DJ Dash`,
    seoDescription: `Find the best ${eventTypeDisplay} in ${cityName}, ${state}. Browse verified DJs with reviews, portfolios, and pricing. Get free quotes for your ${eventType} event.`,
    seoKeywords: [
      `${eventTypeDisplay} ${cityName}`,
      `${cityName} ${eventType} DJ`,
      `find ${eventType} DJ ${cityName}`,
      `best ${eventTypeDisplay} ${cityName}`,
      `${cityName} ${eventType} DJ services`,
    ],
    metaOgTitle: `${eventTypeDisplay} in ${cityName} ${stateAbbr} | DJ Dash`,
    metaOgDescription: `Find the best ${eventTypeDisplay} in ${cityName}, ${state}. Browse verified DJs with reviews and pricing.`,
    heroTitle: `Find the Perfect ${eventTypeDisplay} in ${cityName}`,
    heroSubtitle: `Browse verified ${eventTypeDisplay} with reviews, portfolios, and instant availability`,
    heroDescription: `Looking for ${eventTypeDisplay} in ${cityName}, ${state}? DJ Dash connects you with professional DJs specializing in ${eventType} events. Browse verified profiles, read reviews, and get free quotes.`,
    introductionText: `Planning a ${eventType} event in ${cityName}, ${state}? Professional DJ services can make all the difference. ${cityName} offers a vibrant event scene, and finding the right DJ for your ${eventType} is crucial for creating the perfect atmosphere.`,
    whyChooseSection: `Professional ${eventTypeDisplay} in ${cityName} bring expertise, quality equipment, and experience with ${eventType} events. They understand the unique needs of ${eventType} celebrations and can create the perfect atmosphere.`,
    pricingSection: `Pricing for ${eventTypeDisplay} in ${cityName} varies based on event duration, services needed, and DJ experience. Contact DJs directly for accurate quotes tailored to your ${eventType} event.`,
    venueSection: `${cityName} offers many excellent venues for ${eventType} events. Popular venues include various locations throughout the city. When booking a DJ, consider venue size, sound requirements, and setup needs.`,
    timelineSection: `For ${eventType} events in ${cityName}, it's best to book your DJ 3-6 months in advance, especially during peak seasons. Last-minute bookings may have limited availability.`,
    comprehensiveGuide: `Complete Guide to ${eventTypeDisplay} in ${cityName}

Planning a ${eventType} event in ${cityName}, ${state}? This comprehensive guide covers everything you need to know about hiring ${eventTypeDisplay}.

**Why ${eventTypeDisplay} in ${cityName}?**
${cityName} offers a vibrant event scene with experienced DJs who specialize in ${eventType} events. Professional DJs bring expertise, quality equipment, and local knowledge.

**What to Expect**
When hiring ${eventTypeDisplay} in ${cityName}, you can expect professional service, quality sound systems, and experience with ${eventType} events. DJs understand the unique needs of ${eventType} celebrations.

**Planning Your ${eventType} Event**
Start planning 3-6 months in advance. Consider venue size, guest count, music preferences, and special requirements. Contact multiple DJs to compare services and pricing.

**Budgeting**
Pricing varies based on event duration, services, and DJ experience. Get quotes from multiple DJs to find the best fit for your budget.

**Local Insights**
${cityName} has a thriving ${eventType} event scene. Local DJs understand the city's event culture and can provide valuable insights for your celebration.`,
    localInsights: `${cityName} has a vibrant ${eventType} event scene. Local DJs understand the city's unique event culture, popular venues, and music preferences. They bring local expertise that can enhance your ${eventType} celebration.`,
    seasonalTrends: {
      spring: `Spring is a popular time for ${eventType} events in ${cityName}, with pleasant weather and many venues available.`,
      summer: `Summer sees peak season for ${eventType} events in ${cityName}, with outdoor venues and warm weather celebrations.`,
      fall: `Fall brings ${eventType} events in ${cityName}, with beautiful weather and many venue options.`,
      winter: `Winter ${eventType} events in ${cityName} focus on indoor venues and cozy celebrations.`,
    },
    popularSongs: [
      'Popular song 1',
      'Popular song 2',
      'Popular song 3',
    ],
    venueRecommendations: [
      {
        name: 'Popular Venue',
        description: 'A great venue for events',
        whyPopular: 'Known for excellent event facilities',
      },
    ],
    faqs: [
      {
        question: `How much does a ${eventType} DJ cost in ${cityName}?`,
        answer: `Pricing for ${eventTypeDisplay} in ${cityName} varies based on event duration, services needed, and DJ experience. Contact DJs directly for accurate quotes tailored to your event.`,
      },
      {
        question: `How far in advance should I book a ${eventType} DJ in ${cityName}?`,
        answer: `For ${eventType} events in ${cityName}, it's best to book your DJ 3-6 months in advance, especially during peak seasons. This ensures availability and allows time for planning.`,
      },
    ],
    structuredData: generateStructuredData({
      cityName,
      state,
      stateAbbr,
      eventType,
      eventTypeDisplay,
      djCount: 0,
      content: {},
    }),
  };
}

/**
 * Generate content for a specific city + event type combination
 */
export async function generateCityEventPageContent(
  citySlug: string,
  eventTypeSlug: string,
  cityData: {
    name: string;
    state: string;
    stateAbbr: string;
    djCount?: number;
  },
  eventTypeData: {
    type: string;
    display: string;
  }
): Promise<GeneratedCityEventContent> {
  return generateCityEventContent({
    cityName: cityData.name,
    state: cityData.state,
    stateAbbr: cityData.stateAbbr,
    eventType: eventTypeData.type,
    eventTypeDisplay: eventTypeData.display,
    djCount: cityData.djCount || 0,
  });
}

