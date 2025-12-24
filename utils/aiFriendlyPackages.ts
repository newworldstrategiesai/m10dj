// AI-Friendly Service Package Descriptions
// Optimized for conversational search queries and ChatGPT shopping features
// These descriptions use natural language, specific vibes, genres, and event types
// to help AI models match your business to specific user needs

export interface AIPackageDescription {
  // Basic package info
  name: string;
  price: string; // Exact price for AI/structured data
  priceRange?: string; // Price range for AI
  displayPrice?: string; // Vague price to show humans (e.g., "Starting at $1,600")
  duration: string;
  
  // AI-optimized conversational descriptions
  conversationalDescription: string; // Natural language for AI matching
  shortDescription: string; // Brief summary for quick matching
  
  // Specific attributes for AI matching
  vibes: string[]; // e.g., "high-energy", "elegant", "intimate", "party atmosphere"
  genres: string[]; // e.g., "90s hip-hop", "country", "top 40", "classic rock"
  eventTypes: string[]; // e.g., "30th birthday", "corporate gala", "outdoor wedding"
  guestCount: string; // e.g., "50-150 guests", "200+ guests"
  atmosphere: string; // e.g., "floor-filling dance party", "sophisticated cocktail hour"
  
  // Structured data for Product schema
  productSchema: {
    name: string;
    description: string;
    category: string;
    offers: {
      price: string;
      priceCurrency: string;
      availability: string;
      validFrom: string;
    };
  };
  
  // Features in conversational language
  features: string[];
  
  // Keywords for AI matching
  searchKeywords: string[];
}

// WEDDING PACKAGES
// These match the actual pricing structure: Package 1 ($2000), Package 2 ($2500), Package 3 ($3000)
// All packages are "RECEPTION ONLY" with Ceremony Audio available as an addon
export const weddingPackages: AIPackageDescription[] = [
  {
    name: "Package 1 - Reception Only",
    price: "$2,000", // Exact price for AI/structured data
    priceRange: "$2,000-$2,600", // For AI matching
    displayPrice: "Starting at $1,600", // Vague price for humans
    duration: "Up to 4 hours",
    conversationalDescription: "Perfect for couples planning a Memphis wedding reception who want professional DJ services with all the essentials. This package includes up to 4 hours of DJ and MC services, dance floor lighting, uplighting to transform your venue, and cocktail hour audio. Ideal for receptions where you want quality sound, smooth transitions, and someone who understands how to keep the dance floor moving. Great for couples who want the full reception experience with professional lighting and sound. Add the Ceremony Audio package separately if you need ceremony coverage.",
    shortDescription: "Professional 4-hour wedding reception DJ package with dance floor lighting, uplighting, and cocktail hour audio. Perfect for Memphis weddings wanting quality sound and lighting.",
    vibes: ["intimate", "elegant", "romantic", "sophisticated"],
    genres: ["wedding classics", "top 40", "country", "R&B", "soul"],
    eventTypes: ["intimate wedding", "garden wedding", "outdoor ceremony", "small reception"],
    guestCount: "75-200 guests",
    atmosphere: "energetic reception with professional lighting and sound",
    productSchema: {
      name: "Package 1 - Reception Only",
      description: "Professional 4-hour wedding reception DJ package with dance floor lighting, uplighting (16 fixtures), and cocktail hour audio. Perfect for Memphis weddings.",
      category: "Wedding Entertainment",
      offers: {
        price: "2000",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "Up to 4 hours of professional DJ and MC services",
      "Dance floor lighting with multi-color LED fixtures",
      "Uplighting package with 16 multicolor LED fixtures to enhance venue ambiance",
      "Cocktail hour audio with extra powered speaker and built-in mixer",
      "Professional sound system with microphones and music library",
      "Add Ceremony Audio package separately for ceremony coverage"
    ],
    searchKeywords: [
      "Memphis wedding reception DJ",
      "4 hour wedding DJ package",
      "wedding DJ with uplighting",
      "reception only DJ Memphis",
      "Memphis wedding lighting package"
    ]
  },
  {
    name: "Package 2 - Reception Only",
    price: "$2,500", // Exact price for AI/structured data
    priceRange: "$2,500-$3,400", // For AI matching
    displayPrice: "Starting at $2,000", // Vague price for humans
    duration: "Up to 6 hours",
    conversationalDescription: "The go-to package for most Memphis weddings where you want complete wedding day coverage with seamless transitions. This package includes up to 6 hours of DJ and MC services covering ceremony, cocktail hour, and reception—ensuring smooth flow and protecting against rushing or overtime fees. Perfect for couples who want that floor-filling wedding reception where guests of all ages are dancing. Includes dance floor lighting, uplighting to transform your venue, and cocktail hour audio. Ideal for traditional weddings at venues like The Peabody, Dixon Gallery, or Memphis Botanic Garden where you need someone who knows how to read the room, mix tracks live, and keep the energy high. Options available for additional uplighting or extra hours.",
    shortDescription: "Complete 6-hour wedding day coverage package perfect for traditional Memphis weddings with 100-250 guests who want seamless ceremony-to-reception transitions.",
    vibes: ["high-energy", "elegant", "party atmosphere", "sophisticated", "celebratory"],
    genres: ["top 40", "90s hip-hop", "country", "classic rock", "R&B", "wedding classics"],
    eventTypes: ["traditional wedding", "large reception", "venue wedding", "Memphis wedding"],
    guestCount: "100-250 guests",
    atmosphere: "floor-filling wedding reception with seamless day-of coverage and professional lighting",
    productSchema: {
      name: "Package 2 - Reception Only",
      description: "Complete 6-hour wedding day coverage with DJ/MC services, dance floor lighting, uplighting (16 fixtures), and cocktail hour audio. Perfect for traditional Memphis weddings.",
      category: "Wedding Entertainment",
      offers: {
        price: "2500",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "Complete wedding day coverage up to 6 hours (ceremony, cocktail hour, and reception)",
      "Seamless transitions between ceremony, cocktail hour, and reception",
      "Dance floor lighting with multi-color LED fixtures",
      "Uplighting package with 16 multicolor LED fixtures",
      "Cocktail hour audio with extra powered speaker",
      "Professional MC services for announcements and timeline coordination",
      "Options available: Additional uplighting (16 lights) or extra hour of time",
      "Add Ceremony Audio package separately if needed"
    ],
    searchKeywords: [
      "Memphis wedding DJ",
      "complete wedding day coverage",
      "6 hour wedding DJ package",
      "Peabody wedding DJ",
      "professional wedding entertainment",
      "Memphis wedding MC",
      "high-energy wedding DJ"
    ]
  },
  {
    name: "Package 3 - Reception Only",
    price: "$3,000", // Exact price for AI/structured data
    priceRange: "$3,000-$3,900", // For AI matching
    displayPrice: "Starting at $2,500", // Vague price for humans
    duration: "Up to 6 hours",
    conversationalDescription: "For couples planning a premium Memphis wedding where every detail matters and you want entertainment that matches the sophistication of your event. This package includes everything in Package 2 plus the magical 'Dancing on the Clouds' dry ice effect for your first dance and special moments. Perfect for large weddings at luxury venues where you need a DJ who can handle multiple locations, coordinate with your wedding planner, and create an unforgettable experience. Includes complete 6-hour wedding day coverage, professional lighting, and that extra touch of magic. Options available for ceremony audio, additional hours, or extra speakers. Because when it's your dream wedding, you want zero compromises.",
    shortDescription: "Premium 6-hour wedding day coverage package with special effects lighting and dry ice effects. Perfect for luxury Memphis weddings with 150+ guests who want sophisticated entertainment.",
    vibes: ["luxury", "sophisticated", "elegant", "premium", "unforgettable"],
    genres: ["sophisticated mix", "classic hits", "current top 40", "jazz", "R&B", "custom curated"],
    eventTypes: ["luxury wedding", "premium venue wedding", "large wedding", "destination wedding"],
    guestCount: "150+ guests",
    atmosphere: "sophisticated luxury wedding with premium entertainment and special effects",
    productSchema: {
      name: "Package 3 - Reception Only",
      description: "Premium 6-hour wedding day coverage with dance floor lighting, uplighting, cocktail hour audio, and 'Dancing on the Clouds' dry ice effect. Perfect for luxury Memphis weddings.",
      category: "Wedding Entertainment",
      offers: {
        price: "3000",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "Complete wedding day coverage up to 6 hours (ceremony, cocktail hour, and reception)",
      "Dance floor lighting with multi-color LED fixtures",
      "Uplighting package with 16 multicolor LED fixtures",
      "Cocktail hour audio with extra powered speaker",
      "Dancing on the Clouds - sophisticated dry ice effect for first dance and special moments",
      "Professional MC services for announcements and timeline coordination",
      "Options available: Ceremony audio package (+1 hour), additional hour of time, or additional speaker",
      "Add Ceremony Audio package separately if needed"
    ],
    searchKeywords: [
      "luxury wedding DJ Memphis",
      "premium wedding entertainment",
      "Memphis luxury wedding",
      "high-end wedding DJ",
      "dry ice effect wedding",
      "dancing on the clouds",
      "special effects wedding DJ"
    ]
  }
];

// CEREMONY AUDIO ADDON (A La Carte)
export const ceremonyAudioAddon: AIPackageDescription = {
  name: "Ceremony Audio - A La Carte",
  price: "$500", // Exact price for AI/structured data
  priceRange: "$400-$600", // For AI matching
  displayPrice: "Starting at $400", // Vague price for humans
  duration: "Additional hour + ceremony coverage",
  conversationalDescription: "Perfect for couples who want professional audio for their ceremony but are using one of our reception-only packages. This addon includes an additional hour of DJ services plus ceremony music programming. Features a smaller, less obstructive sound system perfect for ceremonies, with prelude music starting up to 15 minutes before your ceremony time. Includes lapel microphone for your officiant and handheld microphones as needed. Ideal for couples who want quality ceremony audio without the full ceremony DJ package, or for those who want to add ceremony coverage to their reception package.",
  shortDescription: "Professional ceremony audio addon with smaller sound system, prelude music, and microphones for officiant and speakers. Perfect for adding ceremony coverage to reception packages.",
  vibes: ["elegant", "intimate", "professional", "sophisticated"],
  genres: ["ceremony music", "prelude music", "processional", "recessional"],
  eventTypes: ["ceremony audio", "wedding ceremony", "vow ceremony"],
  guestCount: "50-200 guests",
  atmosphere: "elegant ceremony with professional audio and clear sound",
  productSchema: {
    name: "Ceremony Audio - A La Carte",
    description: "Professional ceremony audio addon with smaller sound system, prelude music, and microphones. Perfect for adding ceremony coverage to reception-only packages.",
    category: "Wedding Entertainment",
    offers: {
      price: "500",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString()
    }
  },
  features: [
    "Smaller, less obstructive sound system perfect for ceremonies",
    "Prelude music starts up to 15 minutes before ceremony time",
    "Music and microphones included for complete ceremony coverage",
    "Lapel microphone for officiant",
    "Handheld microphones as needed for vows and readings",
    "Microphones and speaker only option available (contact for pricing)",
    "Perfect addon for Package 1, 2, or 3 reception packages"
  ],
  searchKeywords: [
    "ceremony audio Memphis",
    "wedding ceremony sound",
    "ceremony microphone rental",
    "officiant microphone",
    "ceremony audio addon",
    "Memphis wedding ceremony audio"
  ]
};

// CORPORATE EVENT PACKAGES
export const corporatePackages: AIPackageDescription[] = [
  {
    name: "Corporate Event DJ Services",
    price: "$495",
    priceRange: "$450-$650",
    duration: "2-6 hours",
    conversationalDescription: "Professional DJ services for corporate events where you need someone who understands business etiquette and can seamlessly transition from background music during networking to high-energy entertainment for your celebration. Perfect for company holiday parties, awards ceremonies, product launches, or team-building events where you want professional-grade sound for presentations and then a DJ who knows how to get your team dancing. Ideal for events at hotels, conference centers, or corporate venues where you need discrete, professional service.",
    shortDescription: "Professional corporate event DJ perfect for company parties, awards ceremonies, and business celebrations with presentation support and entertainment.",
    vibes: ["professional", "sophisticated", "energetic", "corporate-appropriate"],
    genres: ["background music", "top 40", "classic hits", "corporate-appropriate mix"],
    eventTypes: ["company party", "holiday party", "awards ceremony", "product launch", "corporate celebration"],
    guestCount: "50-500+ guests",
    atmosphere: "professional corporate event with seamless presentation-to-party transition",
    productSchema: {
      name: "Corporate Event DJ Services",
      description: "Professional corporate event entertainment with presentation support, background music, and celebration DJ services for business events.",
      category: "Corporate Entertainment",
      offers: {
        price: "495",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "Professional DJ with corporate event experience",
      "Sound system for presentations and announcements",
      "Wireless microphones for speakers and awards",
      "Background music during networking and dinner",
      "Presentation support with AV integration",
      "Professional attire matching your event dress code",
      "Discrete service that enhances without overwhelming"
    ],
    searchKeywords: [
      "corporate DJ Memphis",
      "company party DJ",
      "business event entertainment",
      "corporate holiday party DJ",
      "awards ceremony DJ",
      "professional event DJ"
    ]
  }
];

// PRIVATE PARTY PACKAGES
export const privatePartyPackages: AIPackageDescription[] = [
  {
    name: "Private Party DJ Services",
    price: "$395",
    priceRange: "$150-$395",
    duration: "3-6 hours",
    conversationalDescription: "Perfect for birthday parties, anniversaries, graduations, and family celebrations where you want a DJ who can read the crowd and keep the energy high. Ideal for milestone birthdays like 30th, 40th, or 50th celebrations where you want someone who specializes in the music of your era—whether that's 90s hip-hop, 80s classics, or current top 40. Great for backyard parties, community centers, or private venues where you want professional sound and lighting without the wedding-level formality.",
    shortDescription: "Professional DJ for private parties, birthdays, and family celebrations with crowd-reading skills and genre flexibility.",
    vibes: ["high-energy", "fun", "celebratory", "party atmosphere", "relaxed"],
    genres: ["90s hip-hop", "80s classics", "top 40", "country", "classic rock", "custom requests"],
    eventTypes: ["30th birthday", "40th birthday", "50th birthday", "anniversary party", "graduation party", "family celebration"],
    guestCount: "25-150 guests",
    atmosphere: "high-energy party with guests dancing and celebrating",
    productSchema: {
      name: "Private Party DJ Services",
      description: "Professional DJ services for private parties including birthdays, anniversaries, graduations, and family celebrations with flexible music options.",
      category: "Party Entertainment",
      offers: {
        price: "395",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "Professional DJ with crowd-reading expertise",
      "Sound system suitable for private venues",
      "Party music with genre flexibility",
      "Music requests taken during the event",
      "Lighting effects to enhance the party atmosphere",
      "MC services for announcements and special moments",
      "Flexible setup for backyard, community center, or private venue"
    ],
    searchKeywords: [
      "birthday party DJ Memphis",
      "30th birthday DJ",
      "90s hip-hop DJ",
      "anniversary party DJ",
      "private party entertainment",
      "family celebration DJ"
    ]
  }
];

// EQUIPMENT RENTAL PACKAGES
export const rentalPackages: AIPackageDescription[] = [
  {
    name: "Basic Sound Package",
    price: "$150/day",
    priceRange: "$150-$200/day",
    duration: "1 day",
    conversationalDescription: "Perfect for small gatherings, presentations, or events where you just need reliable sound without a DJ. Ideal for community meetings, small workshops, or intimate gatherings where you need clear audio for speakers and basic background music. Great for outdoor events, backyard parties, or small venues where you want professional sound without the full entertainment package.",
    shortDescription: "Basic sound system rental perfect for small gatherings, presentations, and intimate events needing clear audio.",
    vibes: ["simple", "reliable", "professional"],
    genres: ["background music", "presentation audio"],
    eventTypes: ["small gathering", "presentation", "workshop", "community meeting"],
    guestCount: "20-50 guests",
    atmosphere: "clear audio for presentations and background music",
    productSchema: {
      name: "Basic Sound Package Rental",
      description: "Basic sound system rental with speakers, wireless microphone, and setup assistance for small gatherings and presentations.",
      category: "Equipment Rental",
      offers: {
        price: "150",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "2 professional speakers",
      "1 wireless microphone",
      "Basic mixer for audio control",
      "All necessary cables and connections",
      "Setup assistance and basic training"
    ],
    searchKeywords: [
      "sound system rental Memphis",
      "speaker rental",
      "microphone rental",
      "presentation equipment rental"
    ]
  },
  {
    name: "Wedding Package",
    price: "$350/day",
    priceRange: "$350-$400/day",
    duration: "1 day",
    conversationalDescription: "Complete ceremony and reception sound solution for couples who want professional audio equipment but are handling their own music. Perfect for DIY weddings, budget-conscious couples, or intimate ceremonies where you want quality sound for vows, speeches, and background music. Ideal for outdoor weddings, garden ceremonies, or venues that don't provide sound systems.",
    shortDescription: "Complete wedding sound system rental with ceremony and reception coverage, perfect for DIY weddings needing professional audio.",
    vibes: ["professional", "complete", "reliable"],
    genres: ["ceremony music", "reception background"],
    eventTypes: ["DIY wedding", "outdoor wedding", "garden ceremony"],
    guestCount: "50-200 guests",
    atmosphere: "professional audio for ceremony and reception",
    productSchema: {
      name: "Wedding Sound Package Rental",
      description: "Complete wedding sound system rental with ceremony and reception coverage, uplighting, and full setup and breakdown service.",
      category: "Equipment Rental",
      offers: {
        price: "350",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "4 professional speakers for ceremony and reception",
      "3 wireless microphones for vows and speeches",
      "Professional mixer for audio control",
      "Uplighting to enhance your venue",
      "Full setup and breakdown service"
    ],
    searchKeywords: [
      "wedding sound system rental",
      "ceremony audio rental",
      "wedding equipment rental Memphis",
      "DIY wedding sound"
    ]
  },
  {
    name: "Corporate Event Package",
    price: "$450/day",
    priceRange: "$450-$550/day",
    duration: "1 day",
    conversationalDescription: "Professional presentation and entertainment system for corporate events where you need reliable audio for speakers, presentations, and background music. Perfect for conferences, company meetings, or business events where you need professional-grade equipment with backup systems and technical support. Ideal for hotels, conference centers, or corporate venues where you need equipment that integrates seamlessly with existing AV systems.",
    shortDescription: "Professional corporate event sound system with presentation support, backup equipment, and technical support.",
    vibes: ["professional", "reliable", "corporate-grade"],
    genres: ["presentation audio", "background music"],
    eventTypes: ["corporate conference", "company meeting", "business event"],
    guestCount: "50-500+ guests",
    atmosphere: "professional corporate event with reliable audio",
    productSchema: {
      name: "Corporate Event Sound Package Rental",
      description: "Professional corporate event sound system with premium speakers, multiple microphones, lighting, backup equipment, and technical support.",
      category: "Equipment Rental",
      offers: {
        price: "450",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "Premium speakers for large venues",
      "Multiple wireless microphones for speakers",
      "Professional lighting for presentations",
      "Backup equipment for reliability",
      "On-site technical support during your event"
    ],
    searchKeywords: [
      "corporate sound system rental",
      "conference equipment rental",
      "business event audio",
      "presentation system rental"
    ]
  },
  {
    name: "Full Event Package",
    price: "$650/day",
    priceRange: "$650-$750/day",
    duration: "1 day",
    conversationalDescription: "Everything you need for large events and celebrations where you want professional-grade equipment with on-site technical support. Perfect for festivals, large parties, or major celebrations where you need complete sound, DJ equipment, full lighting, and backup systems. Ideal for outdoor events, large venues, or celebrations where you want zero-downtime guarantees and professional technical support throughout your event.",
    shortDescription: "Complete event package with full sound system, DJ equipment, lighting, backup systems, and on-site technician for large events.",
    vibes: ["complete", "professional", "reliable", "comprehensive"],
    genres: ["full range", "live sound", "DJ equipment"],
    eventTypes: ["large event", "festival", "major celebration", "outdoor event"],
    guestCount: "200+ guests",
    atmosphere: "professional large-scale event with complete technical support",
    productSchema: {
      name: "Full Event Sound Package Rental",
      description: "Complete event package with full sound system, DJ equipment, comprehensive lighting, backup systems, and dedicated on-site technician.",
      category: "Equipment Rental",
      offers: {
        price: "650",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString()
      }
    },
    features: [
      "Complete professional sound system",
      "DJ equipment for live mixing",
      "Full lighting package with effects",
      "Backup systems for zero-downtime guarantee",
      "Dedicated on-site technician throughout your event"
    ],
    searchKeywords: [
      "full event package rental",
      "large event sound system",
      "festival equipment rental",
      "complete event package"
    ]
  }
];

// Helper function to generate Product schema markup for a package
export function generateProductSchema(packageData: AIPackageDescription) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": packageData.productSchema.name,
    "description": packageData.productSchema.description,
    "category": packageData.productSchema.category,
    "brand": {
      "@type": "Brand",
      "name": "M10 DJ Company"
    },
    "offers": {
      "@type": "Offer",
      "price": packageData.productSchema.offers.price,
      "priceCurrency": packageData.productSchema.offers.priceCurrency,
      "availability": packageData.productSchema.offers.availability,
      "validFrom": packageData.productSchema.offers.validFrom,
      "seller": {
        "@type": "LocalBusiness",
        "name": "M10 DJ Company",
        "url": "https://www.m10djcompany.com"
      }
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Duration",
        "value": packageData.duration
      },
      {
        "@type": "PropertyValue",
        "name": "Guest Count",
        "value": packageData.guestCount
      },
      {
        "@type": "PropertyValue",
        "name": "Atmosphere",
        "value": packageData.atmosphere
      }
    ],
    "keywords": packageData.searchKeywords.join(", ")
  };
}

// Extended interface for matching results
export interface MatchedPackage extends AIPackageDescription {
  matchScore: number;
}

// Helper function to find packages matching conversational queries
export function findMatchingPackages(query: string): MatchedPackage[] {
  const allPackages = [
    ...weddingPackages,
    ceremonyAudioAddon,
    ...corporatePackages,
    ...privatePartyPackages,
    ...rentalPackages
  ];
  
  const queryLower = query.toLowerCase();
  const matches: MatchedPackage[] = [];
  
  for (const pkg of allPackages) {
    let score = 0;
    
    // Check conversational description
    if (pkg.conversationalDescription.toLowerCase().includes(queryLower)) {
      score += 10;
    }
    
    // Check vibes
    if (pkg.vibes.some(vibe => queryLower.includes(vibe.toLowerCase()))) {
      score += 5;
    }
    
    // Check genres
    if (pkg.genres.some(genre => queryLower.includes(genre.toLowerCase()))) {
      score += 5;
    }
    
    // Check event types
    if (pkg.eventTypes.some(type => queryLower.includes(type.toLowerCase()))) {
      score += 8;
    }
    
    // Check keywords
    if (pkg.searchKeywords.some(keyword => queryLower.includes(keyword.toLowerCase()))) {
      score += 3;
    }
    
    if (score > 0) {
      matches.push({ ...pkg, matchScore: score });
    }
  }
  
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

