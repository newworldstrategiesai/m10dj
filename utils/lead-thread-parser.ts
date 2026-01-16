export interface ParsedLeadContact {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  email: string | null;
  phoneDigits: string | null;
  phoneE164: string | null;
  eventType: string | null;
  eventDate: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueType: string | null;
  venueRoom: string | null;
  eventTime: string | null;
  endTime: string | null;
  setupTime: string | null;
  guestArrivalTime: string | null;
  guestCount: number | null;
  budgetRange: string | null;
  referralSource: string | null;
  eventOccasion: string | null;
  eventFor: string | null;
  isSurprise: boolean | null;
  notes: string[];
}

export interface ParsedLeadMessage {
  speakerLabel: string;
  role: 'contact' | 'team' | 'unknown';
  message: string;
  timestamp?: string | null; // ISO timestamp if extracted from thread
}

export interface ParsedLeadThread {
  contact: ParsedLeadContact;
  messages: ParsedLeadMessage[];
  rawThread: string;
}

const TEAM_ALIASES = [
  'ben',
  'ben murray',
  'benjamin',
  'dj ben',
  'dj ben murray',
  'ben m',
  'm10',
  'm10 dj',
  'm10 dj company',
  'ben murray:',
];

const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
  wedding: ['wedding', 'bride', 'groom', 'ceremony', 'reception'],
  corporate: ['corporate', 'company', 'office', 'business'],
  school_dance: ['prom', 'homecoming', 'school dance'],
  holiday_party: ['holiday party', 'christmas party', 'holiday'],
  private_party: ['birthday', 'private party', 'anniversary', 'surprise party'],
};

const NAME_STOP_PHRASES = [' by the way', ' btw', ' just', ' thanks', ' thank you'];

const VENUE_BLOCKLIST = ['last night', 'tonight', 'yesterday', 'today'];
const VENUE_STOP_PHRASES = [
  ' my name',
  ' i am',
  " i'm",
  ' this is',
  ' we met',
  ' we were',
  ' we are',
  ' we\'re',
  ' were wondering',
];

const EMAIL_REGEX =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const INTERNAL_EMAIL_PATTERNS = [
  /@m10djcompany\.com$/i,
  /@m10dj\.co$/i,
  /@m10djcompany\.co$/i,
  /@m10dj\.com$/i,
];

// Enhanced phone regex patterns - matches various formats
const PHONE_REGEXES = [
  /(\+?1?[\s.(\-]*\d{3}[\s.)\-]*\d{3}[\s.\-]*\d{4})/, // Standard US format
  /(\d{3}[\s.\-]?\d{3}[\s.\-]?\d{4})/, // Simple format: 901-555-1234 or 901.555.1234
  /(\(\d{3}\)[\s.\-]?\d{3}[\s.\-]?\d{4})/, // (901) 555-1234
  /(\d{10})/, // 10 consecutive digits
];

// Enhanced DATE_REGEX to match both numeric and text-based dates
// Matches: "1/31/2024", "01-31-2024", "Jan. 31st", "January 31st", "Jan 31", etc.
const DATE_REGEX =
  /\b((?:0?[1-9]|1[0-2])[\/\-](?:0?[1-9]|[12]\d|3[01])[\/\-](?:\d{2}|\d{4})|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{4})?)\b/i;

export function parseLeadThread(thread: string): ParsedLeadThread {
  const normalizedThread = thread.replace(/\r\n/g, '\n').trim();
  const contact = extractContactInfo(normalizedThread);
  const messages = extractMessages(normalizedThread, contact.fullName, contact.phoneDigits);

  return {
    contact,
    messages,
    rawThread: normalizedThread,
  };
}

function extractContactInfo(thread: string): ParsedLeadContact {
  const notes: string[] = [];
  const structured = extractStructuredFields(thread);

  const emailMatch = thread.match(EMAIL_REGEX);
  
  // Try all phone regex patterns
  let phoneMatch = null;
  for (const regex of PHONE_REGEXES) {
    phoneMatch = thread.match(regex);
    if (phoneMatch) break;
  }

  const phoneDigits = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : null;
  const phoneE164 = phoneDigits
    ? phoneDigits.length === 10
      ? `+1${phoneDigits}`
      : phoneDigits.startsWith('1') && phoneDigits.length === 11
        ? `+${phoneDigits}`
        : `+${phoneDigits}`
    : null;

  const email = structured.email || selectContactEmail(emailMatch);

  // Try to extract name from email first if we have an email but no name
  let possibleName = structured.name || extractName(thread);
  
  // If we have an email but no name, try extracting from email prefix
  if (!possibleName && email) {
    const emailPrefix = email.split('@')[0];
    if (emailPrefix) {
      // Remove numbers and separators to get name
      let cleanedPrefix = emailPrefix
        .replace(/\d+/g, '') // Remove numbers
        .replace(/[._-]/g, ' ') // Replace separators with spaces
        .trim();
      
      if (cleanedPrefix.length >= 2) {
        // Try splitting compound names first (e.g., "Joelane" -> "Joe Lane")
        let processedPrefix = cleanedPrefix;
        if (!cleanedPrefix.includes(' ') && cleanedPrefix.length >= 4) {
          processedPrefix = splitCompoundName(cleanedPrefix);
        }
        const candidate = sanitizeNameCandidate(processedPrefix);
        if (candidate) {
          possibleName = candidate;
        }
      }
    }
  }
  
  const { firstName, lastName } = splitName(possibleName);

  // Try structured fields first, then fallback to extraction
  let venueName = structured.venueName || null;
  let venueAddress = structured.venueAddress || null;
  
  // First, try to extract full address patterns that may include venue name
  // Pattern: "Venue Name, Street Number Street Name, City, State ZIP, Country"
  // e.g., "Audubon Square Condominiums, 4755 Audubon View Cir, Memphis, TN 38117, United States"
  
  // Look for full address lines - match on lines that start with capitalized venue name
  // This avoids capturing conversational phrases from previous lines
  const lines = thread.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Pattern: "Venue Name, Street Address, City, State ZIP, Country"
    // Must start with capitalized words (venue name), not conversational phrases
    const fullAddressPattern = /^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4}(?:\s+(?:Condominiums|Apartments|Complex|Building|Center|Club|Hall|Hotel|Resort|Garden|Park|Theater|Theatre|Arena|Stadium|Venue|Facility|Place|Plaza|Square|Tower|Mall|Centre|Clubhouse|Room|Ballroom|Banquet|Lounge|Bar|Restaurant|Cafe|Bistro|Grill|Pub|Tavern|Inn|Lodge|Manor|Estate|Villa|Mansion|Palace|Castle))?),\s*(\d+\s+[A-Z][A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy|Place|Pl|Terrace|Ter|Trail|Trl|View|Bend|Ridge|Heights|Hills|Valley|Grove|Woods|Meadows|Fields|Acres|Ranch|Farm|Plantation)),\s*([A-Z][A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)(?:,\s*[^,\n]+)?$/i;
    
    const fullAddressMatch = trimmedLine.match(fullAddressPattern);
    if (fullAddressMatch) {
      const firstPart = fullAddressMatch[1].trim();
      // Check if first part looks like a venue name (has multiple capitalized words, not just a street name)
      // Also exclude common conversational phrases
      const lowerFirstPart = firstPart.toLowerCase();
      const conversationalPhrases = ['sure thing', 'sure', 'okay', 'ok', 'yes', 'yeah', 'yep', 'alright', 'all right', 'got it', 'sounds good', 'perfect', 'great', 'thanks', 'thank you'];
      
      if (!conversationalPhrases.some(phrase => lowerFirstPart.includes(phrase))) {
        const wordCount = firstPart.split(/\s+/).length;
        if (wordCount >= 2 && !/^\d+/.test(firstPart)) {
          venueName = capitalize(firstPart);
          // Extract the full address (everything after the venue name)
          const commaIndex = trimmedLine.indexOf(',');
          if (commaIndex > 0) {
            venueAddress = trimmedLine.substring(commaIndex + 1).trim();
          } else {
            // Fallback: construct from captured groups
            venueAddress = `${fullAddressMatch[2].trim()}, ${fullAddressMatch[3].trim()}, ${fullAddressMatch[4].trim()} ${fullAddressMatch[5].trim()}`;
          }
          break; // Found a match, stop searching
        }
      }
    }
    
    // Also try a more flexible pattern for addresses that might span lines
    // But only if we haven't found a match yet
    if (!venueName && !venueAddress) {
      // Pattern that matches venue name followed by address on same or next line
      const flexiblePattern = /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,4}(?:\s+(?:Condominiums|Apartments|Complex|Building|Center|Club|Hall|Hotel|Resort|Garden|Park|Theater|Theatre|Arena|Stadium|Venue|Facility|Place|Plaza|Square|Tower|Mall|Centre|Clubhouse|Room|Ballroom|Banquet|Lounge|Bar|Restaurant|Cafe|Bistro|Grill|Pub|Tavern|Inn|Lodge|Manor|Estate|Villa|Mansion|Palace|Castle))?),\s*(\d+\s+[A-Z][A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy|Place|Pl|Terrace|Ter|Trail|Trl|View|Bend|Ridge|Heights|Hills|Valley|Grove|Woods|Meadows|Fields|Acres|Ranch|Farm|Plantation)),\s*([A-Z][A-Za-z\s]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)(?:,\s*[^,\n]+)?/i;
      const flexibleMatch = trimmedLine.match(flexiblePattern);
      if (flexibleMatch) {
        const firstPart = flexibleMatch[1].trim();
        const lowerFirstPart = firstPart.toLowerCase();
        const conversationalPhrases = ['sure thing', 'sure', 'okay', 'ok', 'yes', 'yeah', 'yep', 'alright', 'all right', 'got it', 'sounds good', 'perfect', 'great', 'thanks', 'thank you'];
        
        if (!conversationalPhrases.some(phrase => lowerFirstPart.includes(phrase))) {
          const wordCount = firstPart.split(/\s+/).length;
          if (wordCount >= 2 && !/^\d+/.test(firstPart)) {
            venueName = capitalize(firstPart);
            const commaIndex = trimmedLine.indexOf(',');
            if (commaIndex > 0) {
              venueAddress = trimmedLine.substring(commaIndex + 1).trim();
            } else {
              venueAddress = `${flexibleMatch[2].trim()}, ${flexibleMatch[3].trim()}, ${flexibleMatch[4].trim()} ${flexibleMatch[5].trim()}`;
            }
            break;
          }
        }
      }
    }
  }
  
  // If we still don't have venue name, try extractVenue (but exclude common phrases)
  if (!venueName) {
    venueName = extractVenue(thread);
  }
  
  // If we have venue name but no address, try to extract address from context
  if (venueName && !venueAddress) {
    // Look for address patterns near the venue name
    const venueIndex = thread.toLowerCase().indexOf(venueName.toLowerCase());
    if (venueIndex >= 0) {
      // Look in the next 300 characters after venue name (increased from 200)
      const context = thread.slice(venueIndex, venueIndex + 300);
      const addressPatterns = [
        // Full address with street number
        /\b(\d+\s+[A-Z][A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy|Place|Pl|Terrace|Ter|Trail|Trl)[^,\n]{0,50},\s*[A-Z][A-Za-z\s]+(?:\s+[A-Z][A-Za-z\s]+)?,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
        // Address without street number (less preferred)
        /\b([A-Z][A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy)[^,\n]{0,50},\s*[A-Z][A-Za-z\s]+(?:\s+[A-Z][A-Za-z\s]+)?,\s*[A-Z]{2}(?:\s+\d{5})?)/i,
        // Simple address pattern
        /\baddress[:\s]+([^.\n]{10,150})/i,
      ];
      for (const pattern of addressPatterns) {
        const match = context.match(pattern);
        if (match) {
          venueAddress = capitalize(match[1].trim());
          break;
        }
      }
    }
  }
  
  // If we have address but no venue name, try to extract venue name from address
  if (venueAddress && !venueName) {
    const parts = venueAddress.split(',');
    if (parts.length > 0) {
      const firstPart = parts[0].trim();
      // Check if first part looks like a venue name (not just a street number, and has multiple capitalized words)
      if (!/^\d+/.test(firstPart) && /^[A-Z][a-z]+/.test(firstPart) && firstPart.split(/\s+/).length >= 2) {
        venueName = capitalize(firstPart);
        // Remove venue name from address if it was included
        if (parts.length > 1) {
          venueAddress = parts.slice(1).map(p => p.trim()).join(', ');
      }
    }
  }
  }
  
  const eventType = structured.eventType || inferEventType(thread);

  let eventDate = structured.eventDate || null;
  if (!eventDate) {
    // First try the standard regex patterns
    const dateMatch = thread.match(DATE_REGEX);
    if (dateMatch) {
      eventDate = normalizeFlexibleDate(dateMatch[0]);
    }
    
    // If no date found, try conversational patterns
    if (!eventDate) {
      // Pattern: "wedding on March 15" or "wedding on the 15th"
      const conversationalPatterns = [
        // "wedding on March 15" or "wedding on March 15th" or "wedding on the 15th of March"
        /(?:wedding|event|ceremony|reception|party|celebration)\s+(?:on|is|will\s+be|is\s+on)\s+(?:the\s+)?(?:(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?)?(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)[a-z]*\.?\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i,
        // "March 15" or "March 15th" (standalone)
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)[a-z]*\.?\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?/i,
        // "the 15th of March" or "15th of March"
        /\b(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\s+of\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December)[a-z]*\.?(?:\s+,?\s*(\d{4}))?/i,
        // "on the 15th" with context of wedding/event nearby (within 50 chars)
        /\b(?:wedding|event|ceremony|reception|party)(?:[^.]{0,50}?)?\s+(?:on|is|will\s+be|is\s+on)\s+the\s+(\d{1,2})(?:st|nd|rd|th)\b/i,
      ];
      
      for (const pattern of conversationalPatterns) {
        const match = thread.match(pattern);
        if (match) {
          // Try to construct a date string from the match
          let dateStr = '';
          if (match[1] && match[2]) {
            // Pattern with day first: "15th of March"
            dateStr = `${match[2]} ${match[1]}`;
            if (match[3]) dateStr += `, ${match[3]}`;
          } else if (match[2] && match[3]) {
            // Pattern with month first: "March 15"
            dateStr = `${match[2]} ${match[3]}`;
            if (match[4]) dateStr += `, ${match[4]}`;
          } else if (match[1] && match[2] && match[3]) {
            // Pattern like "wedding on March 15"
            dateStr = `${match[2]} ${match[3]}`;
            if (match[4]) dateStr += `, ${match[4]}`;
          } else if (match[1]) {
            // Just day number - need more context, skip for now
            continue;
          }
          
          if (dateStr) {
            const normalized = normalizeFlexibleDate(dateStr);
            if (normalized) {
              eventDate = normalized;
              break;
            }
          }
        }
      }
    }
  }

  // Extract event time from natural language if not in structured fields
  let eventTime = structured.eventTime || null;
  let endTime = structured.endTime || null;
  let setupTime = structured.setupTime || null;
  
  // First, try to extract grand entrance/exit (for reception events)
  // These take priority over ceremony times for reception/wedding events
  const grandEntrancePatterns = [
    /(?:grand\s+entrance|entrance)\s+(?:is\s+at|at|is)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
    /(?:grand\s+entrance|entrance)\s+(?:is\s+scheduled\s+for|scheduled\s+for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
    /(?:our\s+)?grand\s+entrance\s+is\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
  ];
  
  const grandExitPatterns = [
    /(?:grand\s+exit|exit)\s+(?:is\s+scheduled\s+for|scheduled\s+for|is\s+at|at|is)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
    /(?:our\s+)?grand\s+exit\s+(?:is\s+scheduled\s+for|scheduled\s+for)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
  ];
  
  let grandEntrance = null;
  let grandExit = null;
  
  for (const pattern of grandEntrancePatterns) {
    const match = thread.match(pattern);
    if (match) {
      grandEntrance = match[1].trim();
      break;
    }
  }
  
  for (const pattern of grandExitPatterns) {
    const match = thread.match(pattern);
    if (match) {
      grandExit = match[1].trim();
      break;
    }
  }
  
  // For reception/wedding events, use grand entrance/exit as event times (these are the actual reception times)
  const isReceptionEvent = eventType === 'wedding' || eventType === 'private_party' || 
                          thread.toLowerCase().includes('reception') || 
                          thread.toLowerCase().includes('grand entrance') ||
                          thread.toLowerCase().includes('grand exit');
  
  if (isReceptionEvent) {
    if (grandEntrance && !eventTime) {
      eventTime = grandEntrance;
    }
    if (grandExit && !endTime) {
      endTime = grandExit;
    }
  }
  
  if (!eventTime) {
    // First, try specific patterns for "arrive at" and "until" (common in casual conversations)
    // Pattern: "arrive at 7" or "guests to arrive at 7" - use word boundaries to avoid partial matches
    const arrivePatterns = [
      /\b(?:guests?\s+to\s+)?arrive\s+at\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i,
      /\barrive\s+at\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i,
    ];
    
    for (const pattern of arrivePatterns) {
      const match = thread.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        // Validate hour is reasonable (1-12)
        if (hour >= 1 && hour <= 12) {
          // For "arrive at 7", assume PM for event times (1-11)
          if (hour >= 1 && hour <= 11) {
            eventTime = `${hour}pm`;
          } else if (hour === 12) {
            eventTime = '12pm';
          }
          break;
        }
      }
    }
    
    // Try to match time ranges first (e.g., "3pm-5pm", "3:00 PM to 5:00 PM", "ceremony is 3 pm-3:30")
    // Use word boundaries to avoid matching partial numbers
    if (!eventTime) {
    const timeRangePatterns = [
        /\b(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*(?:-|to|until)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*(?:-|to|until|through)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(?:from|between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:to|until|-)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
    ];
    
    for (const pattern of timeRangePatterns) {
      const match = thread.match(pattern);
      if (match) {
          const startHour = parseInt(match[1].replace(/[^\d]/g, ''));
          const endHour = parseInt(match[2].replace(/[^\d]/g, ''));
          // Validate hours are reasonable (1-12)
          if (startHour >= 1 && startHour <= 12 && endHour >= 1 && endHour <= 12) {
        // Only use ceremony times if we don't have grand entrance/exit
        if (!grandEntrance) {
          eventTime = match[1].trim();
        }
        if (!grandExit) {
          endTime = match[2].trim();
        }
        break;
          }
        }
      }
    }
    
    // If no range found, try single time patterns
    // Use word boundaries to avoid matching partial numbers
    if (!eventTime) {
      const timePatterns = [
        /\b(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(?:at|starts?|begins?|starts? at|beginning at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:start|begin|ceremony|reception)\b/i,
        /\b(?:time|event time|start time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(\d{1,2}\s*(?:am|pm|AM|PM))\s+(?:start|begin|ceremony)\b/i,
      ];
      
      for (const pattern of timePatterns) {
        const match = thread.match(pattern);
        if (match && !grandEntrance) {
          const hour = parseInt(match[1].replace(/[^\d]/g, ''));
          // Validate hour is reasonable (1-12)
          if (hour >= 1 && hour <= 12) {
          eventTime = match[1].trim();
          break;
          }
        }
        }
      }
    }
    
    // Try to extract end time separately if not already found
  if (!endTime) {
    // First try "until" patterns (common in casual conversations)
    // Pattern: "go until 11" or "until 11 at the latest" - use word boundaries to avoid partial matches
    const untilPatterns = [
      /\b(?:probably\s+)?go\s+until\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?(?:\s+at\s+the\s+latest)?/i,
      /\buntil\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?(?:\s+at\s+the\s+latest)?/i,
      /\b(?:will\s+)?go\s+until\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i,
    ];
    
    for (const pattern of untilPatterns) {
      const match = thread.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        // Validate hour is reasonable (1-12)
        if (hour >= 1 && hour <= 12) {
          // For "until 11", assume PM for event times (1-11)
          if (hour >= 1 && hour <= 11) {
            endTime = `${hour}pm`;
          } else if (hour === 12) {
            endTime = '12pm';
          }
          break;
        }
      }
    }
    
    // If not found, try other end time patterns
    // Use word boundaries to avoid matching partial numbers
    if (!endTime) {
      const endTimePatterns = [
        /\b(?:ceremony|it|event)\s+(?:will\s+)?end\s+(?:no\s+later\s+than|by|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(?:ends?|finishes?|ends? at|finishes? at|until|till)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:end|finish)\b/i,
        /\b(?:end time|finish time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
      ];
      
      for (const pattern of endTimePatterns) {
        const match = thread.match(pattern);
        if (match && !grandExit) {
          const hour = parseInt(match[1].replace(/[^\d]/g, ''));
          // Validate hour is reasonable (1-12)
          if (hour >= 1 && hour <= 12) {
          endTime = match[1].trim();
          break;
        }
      }
      }
    }
  }
  
  // Extract referral source (e.g., "Spike's cousin" -> "Spike", "I'm Joe, Spike's cousin" -> "Spike")
  let referralSource = structured.referralSource || null;
  if (!referralSource) {
    const referralPatterns = [
      // Pattern 1: "Spike's cousin" - standalone pattern (test this first, it's the simplest)
      /([A-Z][a-z]+)'s\s+(?:cousin|friend|brother|sister|colleague|co-worker|neighbor|family|relative)/i,
      // Pattern 2: "I'm Joe, Spike's cousin" or "I'm Joe Spike's cousin" (with or without comma)
      /(?:I'?m|I am|my name is)\s+[A-Z][a-z]+(?:,\s*|\s+)([A-Z][a-z]+)'s\s+(?:cousin|friend|brother|sister|colleague|co-worker|neighbor|family|relative)/i,
      // Pattern 3: "referred by Spike" or "got your number from Spike"
      /\b(?:referred|referred by|got your|contacted|found you|heard about you|recommended|recommended by|told me about|said|mentioned)\s+(?:by|from|through)?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      // Pattern 4: "my friend Spike referred me"
      /\b(?:my|a)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:referred|recommended|told me|said)/i,
    ];
    
    for (let i = 0; i < referralPatterns.length; i++) {
      const pattern = referralPatterns[i];
      const match = thread.match(pattern);
      if (match) {
        const candidate = match[1].trim();
        console.log('[lead-thread-parser] Referral pattern', i, 'matched:', match[0], 'candidate:', candidate);
        // Validate it's not a common word or our own name
        const commonWords = ['the', 'this', 'that', 'ben', 'benjamin', 'murray', 'm10', 'dj', 'company', 'joe', 'looking', 'he', 'she', 'they', 'for', 'a', 'dj'];
        if (!commonWords.includes(candidate.toLowerCase()) && candidate.length >= 2) {
          referralSource = capitalize(candidate);
          console.log('[lead-thread-parser] ✅ Extracted referral source:', referralSource, 'from match:', match[0]);
          break;
        } else {
          console.log('[lead-thread-parser] ⚠️ Referral candidate filtered out (common word):', candidate);
        }
      }
    }
    if (!referralSource) {
      console.log('[lead-thread-parser] ⚠️ No referral source extracted from thread');
      // Debug: try to find any name with apostrophe-s followed by cousin
      const debugMatch = thread.match(/([A-Z][a-z]+)'s\s+cousin/i);
      if (debugMatch) {
        console.log('[lead-thread-parser] 🔍 Debug: Found potential referral:', debugMatch[0], 'but pattern did not match');
      }
    }
  }

  // Extract event occasion details (e.g., "surprise birthday party", "my wife's")
  let eventOccasion = structured.eventOccasion || null;
  let eventFor = structured.eventFor || null;
  let isSurprise = structured.isSurprise || false;
  
  if (!eventOccasion) {
    const occasionPatterns = [
      /\b(surprise\s+(?:birthday|anniversary|party|celebration|event))/i,
      /\b((?:birthday|anniversary|graduation|retirement|engagement)\s+party)/i,
      /\b(surprise\s+party)/i,
      /\b(?:for|celebrating)\s+(?:my|our)?\s*(?:wife|husband|daughter|son|mom|dad|mother|father|parent|sister|brother|friend|boss|colleague)'s\s+(?:surprise\s+)?(?:birthday|anniversary|graduation|retirement|engagement)\s+party/i, // "my wife's surprise birthday party"
    ];
    
    for (const pattern of occasionPatterns) {
      const match = thread.match(pattern);
      if (match) {
        eventOccasion = match[1] ? match[1].trim().toLowerCase() : match[0].trim().toLowerCase();
        if (eventOccasion.includes('surprise')) {
          isSurprise = true;
        }
        console.log('[lead-thread-parser] Extracted event occasion:', eventOccasion, 'isSurprise:', isSurprise);
        break;
      }
    }
  }
  
  // Extract who the event is for (e.g., "my wife's", "my daughter's")
  if (!eventFor) {
    const eventForPatterns = [
      /\b(?:my|our)\s+(wife|husband|daughter|son|mom|dad|mother|father|parent|sister|brother|friend|boss|colleague)'s/i,
      /\b(?:for|celebrating)\s+(?:my|our)?\s*(wife|husband|daughter|son|mom|dad|mother|father|parent|sister|brother|friend|boss|colleague)/i,
      /\b(?:for|celebrating)\s+(?:my|our)?\s*(?:wife|husband|daughter|son|mom|dad|mother|father|parent|sister|brother|friend|boss|colleague)'s/i, // "for my wife's"
    ];
    
    for (const pattern of eventForPatterns) {
      const match = thread.match(pattern);
      if (match) {
        eventFor = match[1].trim().toLowerCase();
        console.log('[lead-thread-parser] Extracted event for:', eventFor);
        break;
      }
    }
  }

  // Extract guest arrival time (different from event start time)
  let guestArrivalTime = null;
  const guestArrivalPatterns = [
    /\b(?:guests?\s+to\s+)?arrive\s+at\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i,
    /\b(?:guests?\s+will\s+)?arrive\s+at\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i,
    /\b(?:guests?\s+should\s+)?arrive\s+(?:at|by)\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i,
    /\barrival\s+(?:time|at)\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i,
  ];
  
  for (const pattern of guestArrivalPatterns) {
    const match = thread.match(pattern);
    if (match) {
      const hour = parseInt(match[1]);
      if (hour >= 1 && hour <= 12) {
        let timeStr = match[1].trim();
        if (!/[ap]m/i.test(match[0]) && hour >= 1 && hour <= 11) {
          timeStr = `${hour}pm`;
        } else if (!/[ap]m/i.test(match[0]) && hour === 12) {
          timeStr = '12pm';
        } else {
          timeStr = match[0].match(/\d{1,2}\s*(?:am|pm)/i)?.[0] || timeStr;
        }
        guestArrivalTime = timeStr;
        break;
      }
    }
  }

  // Extract venue type and room details (e.g., "It's the clubhouse", "We have the clubhouse")
  let venueType = structured.venueType || null;
  let venueRoom = structured.venueRoom || null;
  
  if (!venueType && !venueRoom) {
    const venueTypePatterns = [
      /\b(?:it'?s|it is|we have|the|at)\s+(?:the\s+)?(clubhouse|ballroom|banquet hall|conference room|meeting room|lounge|bar|restaurant|outdoor|patio|garden|pool|beach|park|venue|hall|room|space|area)/i,
      /\b(?:venue|location|place)\s+(?:is|type|kind)\s+(?:a|an|the)?\s*(clubhouse|ballroom|banquet hall|conference room|meeting room|lounge|bar|restaurant|outdoor|patio|garden|pool|beach|park|venue|hall|room|space|area)/i,
    ];
    
    for (const pattern of venueTypePatterns) {
      const match = thread.match(pattern);
      if (match) {
        const candidate = match[1].trim().toLowerCase();
        // Check if it's a room/area within the venue
        const roomTypes = ['clubhouse', 'ballroom', 'banquet hall', 'conference room', 'meeting room', 'lounge', 'room', 'space', 'area'];
        if (roomTypes.includes(candidate)) {
          venueRoom = capitalize(candidate);
          console.log('[lead-thread-parser] Extracted venue room:', venueRoom, 'from match:', match[0]);
        } else {
          venueType = capitalize(candidate);
          console.log('[lead-thread-parser] Extracted venue type:', venueType, 'from match:', match[0]);
        }
        break;
      }
    }
  }
  
  // Also check for venue room in context of venue name (e.g., "It's the clubhouse")
  if (venueName && !venueRoom) {
    const roomContextPattern = /\b(?:it'?s|it is|we have|the)\s+(?:the\s+)?(clubhouse|ballroom|banquet hall|conference room|meeting room|lounge|room|space|area)/i;
    const roomMatch = thread.match(roomContextPattern);
    if (roomMatch) {
      venueRoom = capitalize(roomMatch[1].trim());
      console.log('[lead-thread-parser] Extracted venue room from context:', venueRoom, 'from match:', roomMatch[0]);
    }
  }
  
  // Also check standalone "It's the clubhouse" pattern
  if (!venueRoom) {
    const standaloneRoomPattern = /\b(?:it'?s|it is)\s+(?:the\s+)?(clubhouse|ballroom|banquet hall|conference room|meeting room|lounge|room|space|area)\b/i;
    const standaloneMatch = thread.match(standaloneRoomPattern);
    if (standaloneMatch) {
      venueRoom = capitalize(standaloneMatch[1].trim());
      console.log('[lead-thread-parser] Extracted venue room (standalone):', venueRoom, 'from match:', standaloneMatch[0]);
    }
  }
  
  // Extract guest count from natural language if not in structured fields
  let guestCount = structured.guestCount ?? null;
  if (!guestCount) {
    const guestPatterns = [
      /(?:approximately|about|around|roughly|expecting|expect)?\s*(\d{1,4})\s+(?:guests?|people|attendees?|persons?)/i,
      /(\d{1,4})\s+(?:guests?|people|attendees?|persons?)\s+(?:are|will|coming|expected)/i,
      /(?:we|we're|we'll|there|have)\s+(?:have|got|will have|expecting)?\s*(\d{1,4})\s+(?:guests?|people)/i,
      /guest[:\s]+(?:count|number|total)?[:\s]*(\d{1,4})/i,
    ];
    
    for (const pattern of guestPatterns) {
      const match = thread.match(pattern);
      if (match) {
        const count = parseInt(match[1], 10);
        if (count > 0 && count < 10000) { // Sanity check
          guestCount = count;
          break;
        }
      }
    }
  }
  
  // Extract budget range from natural language if not in structured fields
  let budgetRange = structured.budgetRange || null;
  if (!budgetRange) {
    const budgetPatterns = [
      /budget[:\s]+(?:is|of|around|about)?\s*([$0-9,\s–—]+)/i,
      /(?:looking|spending|budget)[:\s]+(?:for|around|about|is)?\s*([$0-9,\s–—]+)/i,
      /\$(\d{1,3}(?:,\d{3})*(?:\s*[-–—]\s*\$?\d{1,3}(?:,\d{3})*)?)/, // $1,000-$2,500 or $1000-$2500
      /(\d{1,3}(?:,\d{3})*(?:\s*[-–—]\s*\d{1,3}(?:,\d{3})*)?)\s*(?:dollars?|bucks?)/i,
    ];
    
    for (const pattern of budgetPatterns) {
      const match = thread.match(pattern);
      if (match) {
        budgetRange = match[1].trim().replace(/[–—]/g, ' – ');
        if (!budgetRange.startsWith('$')) {
          budgetRange = '$' + budgetRange;
        }
        break;
      }
    }
  }

  if (!email) notes.push('Email not detected in thread.');
  if (!phoneDigits) notes.push('Phone number not detected in thread.');

  if (structured.notes.length) {
    notes.push(...structured.notes);
  }

  return {
    firstName,
    lastName,
    fullName: possibleName,
    email,
    phoneDigits,
    phoneE164,
    eventType,
    eventDate,
    venueName,
    venueAddress,
    venueType,
    venueRoom,
    eventTime,
    endTime,
    setupTime,
    guestArrivalTime,
    guestCount,
    budgetRange,
    referralSource,
    eventOccasion,
    eventFor,
    isSurprise,
    notes,
  };
}

function extractName(thread: string): string | null {
  const nameRegexes = [
    /my name is ([^.\n]+)/i,
    /i'm ([^.\n]+)/i,
    /i am ([^.\n]+)/i,
    /this is ([^.\n]+)/i,
    /hey[, ]+it's ([^.\n]+)/i,
    /hey[, ]+i'm ([^.\n]+)/i,
    /hey[, ]+this is ([^.\n]+)/i,
    // Social media notification patterns
    /([A-Za-z][A-Za-z0-9]+@[A-Za-z0-9.]+)\s+(?:Reacted|replied|commented|sent)/i, // "Joelane1865@gmail.com Reacted"
    /([A-Za-z][A-Za-z0-9]+)\s+(?:Reacted|replied|commented|sent)/i, // "Joelane1865 Reacted"
  ];

  for (const regex of nameRegexes) {
    const match = thread.match(regex);
    if (match) {
      const candidate = sanitizeNameCandidate(match[1]);
      if (candidate) {
        return candidate;
      }
    }
  }

  // Fall back to name inferred from email prefix
  const emailMatch = thread.match(EMAIL_REGEX);
  const preferredEmail = selectContactEmail(emailMatch);
  if (preferredEmail) {
    const prefix = preferredEmail.split('@')[0];
    if (prefix) {
      // Remove numbers and common separators, but keep the name part
      // e.g., "Joelane1865" -> "Joelane", "john.doe123" -> "john doe"
      let cleanedPrefix = prefix
        .replace(/\d+/g, '') // Remove numbers
        .replace(/[._-]/g, ' ') // Replace separators with spaces
        .trim();
      
      // If we have a meaningful name (at least 2 characters), use it
      if (cleanedPrefix.length >= 2) {
        // Try splitting compound names first (e.g., "Joelane" -> "Joe Lane")
        let processedPrefix = cleanedPrefix;
        if (!cleanedPrefix.includes(' ') && cleanedPrefix.length >= 4) {
          processedPrefix = splitCompoundName(cleanedPrefix);
        }
        const candidate = sanitizeNameCandidate(processedPrefix);
      if (candidate) {
          return candidate;
        }
      }
      
      // Fallback: try original prefix without numbers check
      const candidate = sanitizeNameCandidate(prefix.replace(/[._]/g, ' '));
      if (candidate && candidate.length >= 2) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Intelligently split compound names (e.g., "Joelane" -> "Joe Lane")
 */
function splitCompoundName(name: string): string {
  if (!name || name.length < 4) return name;
  
  // Check for camelCase pattern (lowercase followed by uppercase)
  // e.g., "Joelane" -> "Joe" + "Lane"
  const camelCaseMatch = name.match(/^([a-z]+)([A-Z][a-z]+)$/);
  if (camelCaseMatch) {
    const firstPart = camelCaseMatch[1];
    const secondPart = camelCaseMatch[2];
    // Both parts should be at least 2 characters
    if (firstPart.length >= 2 && secondPart.length >= 2) {
      return `${firstPart} ${secondPart}`;
    }
  }
  
  // Try splitting at common first name lengths (3-6 characters)
  // This handles cases like "Joelane" where there's no camelCase
  for (let i = 3; i <= Math.min(6, name.length - 2); i++) {
    const firstPart = name.substring(0, i);
    const secondPart = name.substring(i);
    
    // Both parts should be at least 2 characters and look like names
    if (firstPart.length >= 2 && secondPart.length >= 2) {
      // Check if both parts start with a letter and are reasonable length
      if (/^[A-Za-z]/.test(firstPart) && /^[A-Za-z]/.test(secondPart)) {
        // Capitalize both parts
        const capitalized = 
          firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase() + ' ' +
          secondPart.charAt(0).toUpperCase() + secondPart.slice(1).toLowerCase();
        return capitalized;
      }
    }
  }
  
  return name;
}

function sanitizeNameCandidate(raw: string): string | null {
  if (!raw) return null;

  let value = raw;
  let lower = value.toLowerCase();

  for (const phrase of NAME_STOP_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx >= 0) {
      value = value.slice(0, idx);
      break;
    }
  }

  const sentenceTerminators = ['.', '!', '?'];
  for (const terminator of sentenceTerminators) {
    const idx = value.indexOf(terminator);
    if (idx >= 0) {
      value = value.slice(0, idx);
      break;
    }
  }
  
  // Try to split compound names before further processing
  // Only if it's a single word (no spaces)
  if (!value.includes(' ') && value.length >= 4) {
    value = splitCompoundName(value);
  }

  value = value.replace(/[^A-Za-z\s'-]/g, ' ');
  value = value.replace(/\s+/g, ' ').trim();

  if (!value) return null;

  const parts = value.split(' ');
  if (parts.length === 0) return null;

  // Keep at most first two words to avoid trailing phrases.
  const limited = parts.slice(0, 2).join(' ');

  return cleanName(limited);
}

function splitName(fullName: string | null): { firstName: string | null; lastName: string | null } {
  if (!fullName) {
    return { firstName: null, lastName: null };
  }

  const parts = fullName
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    return { firstName: capitalize(parts[0]), lastName: null };
  }

  const firstName = capitalize(parts[0]);
  const lastName = capitalize(parts.slice(1).join(' '));

  return { firstName, lastName };
}

function cleanName(name: string): string {
  return name
    .replace(/[^A-Za-z\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalize(value: string): string {
  if (!value) return value;
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function extractVenue(thread: string): string | null {
  // Multiple venue patterns - prioritize more specific patterns first
  const venuePatterns = [
    // Structured format patterns (check these first for better accuracy)
    /\bvenue\s+name[:\s]+([^.\n]+)/gi, // "Venue Name: [venue]" or "venue name: [venue]"
    // Natural language patterns
    /\b(?:at|for|venue|location)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}(?:\s+(?:which is now called|formerly|now called)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})?)/gi, // "at Pin Oak which is now called The Elliot"
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s+(?:which is now called|formerly|now called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/gi, // "Pin Oak which is now called The Elliot"
    /\b(?:at|in|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g, // "at [Capitalized Name]"
    /\bvenue[:\s]+([^.\n]+)/gi, // "venue: [venue]" or "venue [venue]"
    /\blocation[:\s]+([^.\n]+)/gi, // "location: [venue]"
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:venue|hall|center|club|hotel|resort|garden|park)/gi, // Capitalized venue names
  ];

  const allMatches: string[] = [];
  for (const pattern of venuePatterns) {
    const matches = Array.from(thread.matchAll(pattern));
    for (const match of matches) {
      // Handle patterns with multiple capture groups (e.g., "Pin Oak which is now called The Elliot")
      let candidateText = match[1] || match[0];
      if (match[2]) {
        // If we have a "formerly/now called" pattern, combine them
        candidateText = `${match[2]} (formerly ${match[1]})`;
      }
      const candidate = sanitizeVenueCandidate(candidateText);
      if (candidate) {
        allMatches.push(candidate);
      }
    }
  }

  if (!allMatches.length) return null;

  // Score and sort candidates
  const scored = allMatches.map(venue => ({
    venue,
    score: scoreVenueCandidate(venue),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored[0].venue;
}

function sanitizeVenueCandidate(raw: string): string | null {
  if (!raw) return null;

  let value = raw.trim();
  if (!value) return null;

  // Remove "Name:" prefix if it was accidentally captured (e.g., from "Venue Name: The Crossing")
  value = value.replace(/^name:\s*/i, '').trim();

  const lower = value.toLowerCase();
  
  // Enhanced blocklist - exclude common conversational phrases
  const enhancedBlocklist = [...VENUE_BLOCKLIST, 'i know', 'how it goes', 'by the way', 'got your', 'reaching out', 'we have', 'we have the', 'have the', 'have the clubhouse', 'have the venue'];
  if (enhancedBlocklist.some(phrase => lower.includes(phrase))) {
    return null;
  }

  // Remove conversational phrases that might be captured
  value = value.replace(/\b(?:i know|how it goes|by the way|got your|reaching out|was reaching|to see if|we have|we have the|have the|have the clubhouse|have the venue)\b/gi, '').trim();
  
  // If value is too short or looks like a partial phrase, reject it
  if (value.length < 3 || /^(we|have|the|at|in|for|is|are|was|were)$/i.test(value.trim())) {
    return null;
  }
  
  const punctuationBreak = value.search(/[.!?🙂😊\n]/);
  if (punctuationBreak >= 0) {
    value = value.slice(0, punctuationBreak);
  }

  let stopIndex = -1;
  for (const phrase of VENUE_STOP_PHRASES) {
    const idx = value.toLowerCase().indexOf(phrase);
    if (idx >= 0 && (stopIndex === -1 || idx < stopIndex)) {
      stopIndex = idx;
    }
  }
  if (stopIndex >= 0) {
    value = value.slice(0, stopIndex);
  }

  value = value.replace(/[,;:/\-–]+$/g, '').trim();
  value = value.replace(/\s+/g, ' ');

  if (!value) return null;

  // Handle "which is now called" pattern
  if (/which is now called/i.test(value)) {
    const parts = value.split(/which is now called/i).map(part => part.trim()).filter(Boolean);
    if (parts.length === 2) {
      value = `${capitalize(parts[1])} (formerly ${capitalize(parts[0])})`;
    }
  }

  // Final validation - venue should have at least one capitalized word
  const hasCapitalized = /[A-Z][a-z]+/.test(value);
  if (!hasCapitalized) {
    return null;
  }

  return capitalize(value);
}

function scoreVenueCandidate(value: string): number {
  let score = 0;
  const words = value.split(' ').filter(Boolean);
  const capitalizedWords = words.filter(word => /^[A-Z]/.test(word)).length;

  score += Math.min(words.length, 4);
  score += capitalizedWords * 2;

  if (value.includes('(')) score += 1;

  if (value.length > 60) score -= 1;
  if (value.toLowerCase().includes('wedding') && capitalizedWords <= 1) score -= 2;

  return score;
}

interface StructuredFields {
  name: string | null;
  email: string | null;
  eventDate: string | null;
  eventTime: string | null;
  endTime: string | null;
  setupTime: string | null;
  guestArrivalTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueType: string | null;
  venueRoom: string | null;
  guestCount: number | null;
  budgetRange: string | null;
  eventType: string | null;
  referralSource: string | null;
  eventOccasion: string | null;
  eventFor: string | null;
  isSurprise: boolean | null;
  notes: string[];
}

function extractStructuredFields(thread: string): StructuredFields {
  const fields: StructuredFields = {
    name: null,
    email: null,
    eventDate: null,
    eventTime: null,
    endTime: null,
    setupTime: null,
    guestArrivalTime: null,
    venueName: null,
    venueAddress: null,
    venueType: null,
    venueRoom: null,
    guestCount: null,
    budgetRange: null,
    eventType: null,
    referralSource: null,
    eventOccasion: null,
    eventFor: null,
    isSurprise: null,
    notes: [],
  };

  const headerMatch = thread.match(/^([^\n<]{2,})<[^>]+>/m);
  if (headerMatch) {
    const candidate = sanitizeNameCandidate(headerMatch[1]);
    if (candidate) {
      fields.name = candidate;
    }
  }

  const lines = thread.split('\n');

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // More flexible label matching - handles various formats
    // Updated regex to be more permissive with label format (allows numbers, hyphens, etc.)
    // Pattern: Start with letter, then allow letters, numbers, spaces, hyphens, underscores
    // Also handle cases where there might be extra whitespace or formatting
    // IMPORTANT: Only match known field labels to avoid false positives from conversational text
    const labeledMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9\s\-_]{0,49}):\s*(.+)$/);
    if (labeledMatch) {
      const label = labeledMatch[1].toLowerCase().trim().replace(/\s+/g, ' ');
      const value = labeledMatch[2].trim();
      
      // Filter out common conversational words that shouldn't be treated as labels
      // This prevents lines like "Yes, my new house..." from being treated as "Yes: my new house..."
      const conversationalLabels = ['yes', 'no', 'my', 'your', 'our', 'their', 'this', 'that', 'these', 'those', 'here', 'there', 'ok', 'okay', 'sure', 'maybe', 'thanks', 'thank', 'hi', 'hey', 'hello', 'bye', 'goodbye'];
      
      if (conversationalLabels.includes(label)) {
        // Skip this match - it's conversational text, not a structured field
        // Continue to natural language extraction below
      } else {
        // Debug logging for structured field detection
        if (process.env.NODE_ENV === 'development') {
          console.log('[Structured Field Detection] Label:', label, 'Value:', value.substring(0, 50));
        }
        
        // Debug logging for venue name detection
        if (label.includes('venue') && label.includes('name')) {
          console.log('[Venue Name Detection] Label:', label, 'Value:', value);
        }

        switch (label) {
        case 'name':
          if (!fields.name) {
            const candidate = sanitizeNameCandidate(value);
            if (candidate) {
              fields.name = candidate;
            }
          }
          break;
        case 'email':
        case 'email address':
        case 'email_address':
        case 'emailaddress':
          if (!fields.email) {
            const match = value.match(EMAIL_REGEX);
            if (match) {
              fields.email = selectContactEmail(match);
            }
          }
          break;
        case 'phone':
        case 'phone number':
        case 'phone_number':
        case 'phonenumber':
        case 'tel':
        case 'telephone':
          // Phone is extracted separately, but we can note it here
          fields.notes.push(`Phone: ${value}`);
          break;
        case 'date':
        case 'wedding date':
        case 'event date':
        case 'event_date':
        case 'wedding_date': {
          const normalized = normalizeFlexibleDate(value);
          if (normalized) {
            fields.eventDate = normalized;
          } else {
            fields.notes.push(`Event date detail: ${value}`);
          }
          break;
        }
        case 'time':
          if (!fields.eventTime) {
            fields.eventTime = value.replace(/[–—]/g, ' – ').replace(/\s+/g, ' ').trim();
          }
          break;
        case 'event time':
          if (!fields.eventTime) {
            fields.eventTime = value.replace(/[–—]/g, ' – ').replace(/\s+/g, ' ').trim();
          }
          break;
        case 'location':
        case 'event location':
          setVenueFields(fields, value);
          break;
        case 'venue name':
        case 'venue_name':
        case 'venuename':
          if (!fields.venueName) {
            // Clean up the value - remove extra whitespace, trailing punctuation
            const cleaned = value.trim().replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');
            fields.venueName = capitalize(cleaned);
          }
          break;
        case 'venue address':
        case 'venue_address':
        case 'venueaddress':
        case 'address':
          if (!fields.venueAddress) {
            // Clean up the value - preserve address format but remove extra whitespace
            const cleaned = value.trim().replace(/\s+/g, ' ').replace(/[.,;:]+$/, '');
            fields.venueAddress = capitalize(cleaned);
          }
          // If venue name not set and address contains venue name pattern, extract it
          if (!fields.venueName) {
            const parts = value.split(',');
            if (parts.length > 0) {
              const firstPart = parts[0].trim();
              // Check if first part looks like a venue name (capitalized words, not just a street number)
              if (!/^\d+/.test(firstPart) && /^[A-Z][a-z]+/.test(firstPart)) {
                fields.venueName = capitalize(firstPart);
              }
            }
          }
          break;
        case 'guests':
        case 'guest count': {
          const guestMatch = value.match(/(\d{1,4})/);
          if (guestMatch) {
            fields.guestCount = parseInt(guestMatch[1], 10);
          } else {
            fields.notes.push(`Guest detail: ${value}`);
          }
          break;
        }
        case 'budget':
        case 'budget range':
          fields.budgetRange = value.replace(/[–—]/g, ' – ').trim();
          break;
        case 'event type':
          fields.eventType = inferEventType(value) || value.toLowerCase().replace(/\s+/g, '_');
          break;
        case 'performance duration':
        case 'duration':
          fields.notes.push(`Performance duration: ${value}`);
          break;
        default:
          break;
        }
        continue; // Only continue if we found a valid structured field
      }
    }

    if (
      !fields.name &&
      /^(thanks|thank you|best|cheers|regards|warm regards|sincerely)[,!]*/i.test(trimmed)
    ) {
      const nextLine = lines
        .slice(index + 1)
        .map((l) => l.trim())
        .find((l) => l.length > 0);
      if (nextLine) {
        const candidate = sanitizeNameCandidate(nextLine);
        if (candidate) {
          fields.name = candidate;
        }
      }
    }

    if (!fields.eventDate) {
      const normalized = normalizeFlexibleDate(trimmed);
      if (normalized) {
        fields.eventDate = normalized;
      }
    }

    if (!fields.budgetRange) {
      // Enhanced budget patterns
      const budgetPatterns = [
        /budget[:\s]+(?:is|of|around|about)?\s*([$0-9,\s–—]+)/i,
        /(?:looking|spending|budget)[:\s]+(?:for|around|about|is)?\s*([$0-9,\s–—]+)/i,
        /\$(\d{1,3}(?:,\d{3})*(?:\s*[-–—]\s*\$?\d{1,3}(?:,\d{3})*)?)/, // $1,000-$2,500 or $1000-$2500
        /(\d{1,3}(?:,\d{3})*(?:\s*[-–—]\s*\d{1,3}(?:,\d{3})*)?)\s*(?:dollars?|bucks?)/i,
      ];
      
      for (const pattern of budgetPatterns) {
        const budgetMatch = trimmed.match(pattern);
        if (budgetMatch) {
          fields.budgetRange = budgetMatch[1].trim().replace(/[–—]/g, ' – ');
          if (!fields.budgetRange.startsWith('$')) {
            fields.budgetRange = '$' + fields.budgetRange;
          }
          break;
        }
      }
    }

    if (!fields.guestCount) {
      // Enhanced guest count patterns
      const guestPatterns = [
        /(?:approximately|about|around|roughly|expecting|expect)?\s*(\d{1,4})\s+(?:guests?|people|attendees?|persons?)/i,
        /(\d{1,4})\s+(?:guests?|people|attendees?|persons?)\s+(?:are|will|coming|expected)/i,
        /(?:we|we're|we'll|there|have)\s+(?:have|got|will have|expecting)?\s*(\d{1,4})\s+(?:guests?|people)/i,
        /guest[:\s]+(?:count|number|total)?[:\s]*(\d{1,4})/i,
      ];
      
      for (const pattern of guestPatterns) {
        const guestMatch = trimmed.match(pattern);
        if (guestMatch) {
          fields.guestCount = parseInt(guestMatch[1], 10);
          break;
        }
      }
    }

    // Enhanced venue extraction from natural language
    if (!fields.venueName) {
      const venuePatterns = [
        /\bat\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})/g, // "at [Capitalized Venue]"
        /\bvenue[:\s]+([^.\n]+)/i,
        /\blocation[:\s]+([^.\n]+)/i,
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:venue|hall|center|club|hotel|resort|garden|park|ballroom)/i,
      ];
      
      for (const pattern of venuePatterns) {
        const venueMatch = trimmed.match(pattern);
        if (venueMatch) {
          const venueCandidate = sanitizeVenueCandidate(venueMatch[1]);
          if (venueCandidate) {
            fields.venueName = venueCandidate;
            break;
          }
        }
      }
    }
    
    // Enhanced venue address extraction from natural language
    if (!fields.venueAddress) {
      const addressPatterns = [
        /\b(?:venue\s+)?address[:\s]+([^.\n]{5,150})/i,
        /\b(?:at|located\s+at|address\s+is)[:\s]+([A-Z][^.\n]{10,150})/i,
        // Match common address patterns: "123 Main St, City, State ZIP"
        /\b(\d+\s+[A-Z][a-z]+(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy))[^,\n]{0,50},\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
        // Match simpler: "Street, City, State"
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy))[^,\n]{0,50},\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}(?:\s+\d{5})?)/i,
      ];
      for (const pattern of addressPatterns) {
        const addressMatch = trimmed.match(pattern);
        if (addressMatch) {
          const addressCandidate = addressMatch[1].trim();
          // Validate address length and format
          if (addressCandidate.length > 5 && addressCandidate.length < 200) {
            // Remove trailing punctuation
            const cleaned = addressCandidate.replace(/[.,;:]+$/, '').trim();
            if (cleaned.length > 5) {
              fields.venueAddress = capitalize(cleaned);
              break;
            }
          }
        }
      }
    }

    // Enhanced event time extraction
    // Use word boundaries to avoid matching partial numbers
    if (!fields.eventTime) {
      // First, try specific "arrive at" and "until" patterns
      const arriveMatch = trimmed.match(/\b(?:guests?\s+to\s+)?arrive\s+at\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?/i);
      if (arriveMatch) {
        const hour = parseInt(arriveMatch[1]);
        if (hour >= 1 && hour <= 12) {
          fields.eventTime = hour >= 1 && hour <= 11 ? `${hour}pm` : '12pm';
        }
      }
      
      // Try "until" patterns for end time
      if (!fields.endTime) {
        const untilMatch = trimmed.match(/\b(?:probably\s+)?go\s+until\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?(?:\s+at\s+the\s+latest)?/i);
        if (untilMatch) {
          const hour = parseInt(untilMatch[1]);
          if (hour >= 1 && hour <= 12) {
            fields.endTime = hour >= 1 && hour <= 11 ? `${hour}pm` : '12pm';
          }
        } else {
          const untilMatch2 = trimmed.match(/\buntil\s+(\d{1,2})\b(?:\s*(?:pm|PM|am|AM))?(?:\s+at\s+the\s+latest)?/i);
          if (untilMatch2) {
            const hour = parseInt(untilMatch2[1]);
            if (hour >= 1 && hour <= 12) {
              fields.endTime = hour >= 1 && hour <= 11 ? `${hour}pm` : '12pm';
            }
          }
        }
      }
      
      // Try time ranges first (only if we haven't found times yet)
      if (!fields.eventTime) {
      const rangePatterns = [
          /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*(?:-|to|until)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
          /\b(?:from|between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:to|until|-)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
      ];
      
      for (const pattern of rangePatterns) {
        const rangeMatch = trimmed.match(pattern);
        if (rangeMatch) {
            const startHour = parseInt(rangeMatch[1].replace(/[^\d]/g, ''));
            const endHour = parseInt(rangeMatch[2].replace(/[^\d]/g, ''));
            if (startHour >= 1 && startHour <= 12 && endHour >= 1 && endHour <= 12) {
          fields.eventTime = rangeMatch[1].trim();
              if (!fields.endTime) {
          fields.endTime = rangeMatch[2].trim();
              }
          break;
            }
          }
        }
      }
      
      // If no range found, try single time patterns
      if (!fields.eventTime) {
        const timePatterns = [
          /\b(?:at|starts?|begins?|starts? at|beginning at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
          /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:start|begin|ceremony|reception)\b/i,
          /\b(?:time|event time|start time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
          /\b(\d{1,2}\s*(?:am|pm|AM|PM))\s+(?:start|begin|ceremony)\b/i,
        ];
        
        for (const pattern of timePatterns) {
          const timeMatch = trimmed.match(pattern);
          if (timeMatch) {
            const hour = parseInt(timeMatch[1].replace(/[^\d]/g, ''));
            if (hour >= 1 && hour <= 12) {
            fields.eventTime = timeMatch[1].trim();
            break;
            }
          }
        }
      }
    }
    
    // Enhanced end time extraction (if not already found)
    if (!fields.endTime) {
      const endTimePatterns = [
        /\b(?:ends?|finishes?|ends? at|finishes? at|until|till)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
        /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:end|finish)\b/i,
        /\b(?:end time|finish time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/i,
      ];
      
      for (const pattern of endTimePatterns) {
        const endMatch = trimmed.match(pattern);
        if (endMatch) {
          const hour = parseInt(endMatch[1].replace(/[^\d]/g, ''));
          if (hour >= 1 && hour <= 12) {
          fields.endTime = endMatch[1].trim();
          break;
          }
        }
      }
    }
    
    // Enhanced setup time extraction
    if (!fields.setupTime) {
      const setupPatterns = [
        /\b(?:get\s+there|arrive|be\s+there|show\s+up)\s+(?:around|at|by|before)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+to\s+(?:set\s+up|setup)/i,
        /\b(?:set\s+up|setup)\s+(?:at|is\s+at|time\s+is|around|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /\b(?:setup\s+time|set\s+up\s+time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /\b(?:arrive|get\s+there|be\s+there)\s+(?:around|at|by)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:for\s+)?(?:setup|set\s+up)/i,
      ];
      
      for (const pattern of setupPatterns) {
        const setupMatch = trimmed.match(pattern);
        if (setupMatch) {
          const hour = parseInt(setupMatch[1].replace(/[^\d]/g, ''));
          if (hour >= 1 && hour <= 12) {
            let timeStr = setupMatch[1].trim();
            if (!/[ap]m/i.test(timeStr) && hour >= 1 && hour <= 11) {
              timeStr = `${hour}pm`;
            } else if (!/[ap]m/i.test(timeStr) && hour === 12) {
              timeStr = '12pm';
            }
            fields.setupTime = timeStr;
            break;
          }
        }
      }
    }
  }

  return fields;
}

function setVenueFields(fields: StructuredFields, value: string) {
  if (!value) return;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return;

  fields.venueAddress = capitalize(normalized);

  if (!fields.venueName) {
    const parts = normalized.split(',');
    if (parts.length) {
      fields.venueName = capitalize(parts[0].trim());
    }
  }
}

function selectContactEmail(matches: string[] | null): string | null {
  if (!matches || matches.length === 0) return null;

  for (const email of matches) {
    if (!INTERNAL_EMAIL_PATTERNS.some((pattern) => pattern.test(email))) {
      return email.toLowerCase();
    }
  }

  return matches[0].toLowerCase();
}

function normalizeFlexibleDate(value: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const numericMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (numericMatch) {
    let [, month, day, year] = numericMatch;
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    let yearNum = parseInt(year, 10);

    if (year.length === 2) {
      yearNum += yearNum < 50 ? 2000 : 1900;
    }

    try {
      const iso = new Date(Date.UTC(yearNum, monthNum - 1, dayNum)).toISOString();
      return iso.split('T')[0];
    } catch {
      return null;
    }
  }

  // Try to parse with full or abbreviated month names
  const monthNameRegex = /(january|february|march|april|may|june|july|august|september|october|november|december|jan\.?|feb\.?|mar\.?|apr\.?|may|jun\.?|jul\.?|aug\.?|sep\.?|sept\.?|oct\.?|nov\.?|dec\.?)/i;
  if (!monthNameRegex.test(trimmed)) {
    return null;
  }

  // Handle abbreviated months - expand them
  const monthAbbreviations: Record<string, string> = {
    'jan': 'january', 'jan.': 'january',
    'feb': 'february', 'feb.': 'february',
    'mar': 'march', 'mar.': 'march',
    'apr': 'april', 'apr.': 'april',
    'may': 'may',
    'jun': 'june', 'jun.': 'june',
    'jul': 'july', 'jul.': 'july',
    'aug': 'august', 'aug.': 'august',
    'sep': 'september', 'sep.': 'september', 'sept': 'september', 'sept.': 'september',
    'oct': 'october', 'oct.': 'october',
    'nov': 'november', 'nov.': 'november',
    'dec': 'december', 'dec.': 'december',
  };

  let sanitized = stripOrdinalSuffixes(trimmed.replace(/[–—]/g, '-'));
  
  // Replace abbreviated months with full names
  for (const [abbr, full] of Object.entries(monthAbbreviations)) {
    const regex = new RegExp(`\\b${abbr.replace('.', '\\.')}\\b`, 'gi');
    sanitized = sanitized.replace(regex, full);
  }

  // Parse date components manually to avoid timezone issues
  // Extract month, day, and year from the sanitized string
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  
  let monthNum = -1;
  let dayNum = -1;
  let yearNum = -1;
  
  // Find the month and extract day that follows it
  for (let i = 0; i < monthNames.length; i++) {
    const monthName = monthNames[i];
    const monthRegex = new RegExp(`\\b${monthName}\\b`, 'i');
    const monthMatch = sanitized.match(monthRegex);
    if (monthMatch) {
      monthNum = i + 1; // 1-12
      // Extract day that comes after the month name
      const afterMonth = sanitized.substring(monthMatch.index! + monthMatch[0].length);
      const dayMatch = afterMonth.match(/\b(\d{1,2})\b/);
      if (dayMatch) {
        dayNum = parseInt(dayMatch[1], 10);
      }
      break;
    }
  }
  
  // Extract year (4 digits)
  const yearMatch = sanitized.match(/\b(\d{4})\b/);
  if (yearMatch) {
    yearNum = parseInt(yearMatch[1], 10);
  } else {
    // No year provided, use current year
    yearNum = new Date().getFullYear();
  }
  
  // Validate we have all components
  if (monthNum > 0 && dayNum > 0 && yearNum > 1900) {
    // Use Date.UTC to create the date without timezone conversion issues
    // This ensures "Jan 31" stays as January 31st regardless of timezone
    const iso = new Date(Date.UTC(yearNum, monthNum - 1, dayNum)).toISOString();
    return iso.split('T')[0];
  }
  
  // Fallback: Try to parse with Date constructor (but this can have timezone issues)
  let parsed = new Date(sanitized);
  
  // If parsing failed or year is 1901 (default for dates without year), try adding current year
  if (isNaN(parsed.getTime()) || parsed.getFullYear() === 1901) {
    // Try adding current year if not present
    const currentYear = new Date().getFullYear();
    const withYear = `${sanitized} ${currentYear}`;
    parsed = new Date(withYear);
  }
  
  // For fallback, use UTC methods to avoid timezone issues
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
    // Use UTC methods to get the date components without timezone conversion
    const year = parsed.getUTCFullYear();
    const month = parsed.getUTCMonth();
    const day = parsed.getUTCDate();
    return new Date(Date.UTC(year, month, day))
      .toISOString()
      .split('T')[0];
  }

  return null;
}

function stripOrdinalSuffixes(value: string): string {
  return value.replace(/(\d{1,2})(st|nd|rd|th)/gi, '$1');
}

function inferEventType(thread: string): string | null {
  const lower = thread.toLowerCase();
  for (const [eventType, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return eventType;
    }
  }
  return null;
}

function extractMessages(thread: string, contactName: string | null, phoneDigits: string | null): ParsedLeadMessage[] {
  const lines = thread.split('\n');
  const messages: ParsedLeadMessage[] = [];

  let currentSpeaker: string | null = null;
  let buffer: string[] = [];
  let currentTimestamp: string | null = null;

  // Patterns to extract timestamps from various formats
  const timestampPatterns = [
    // Format: "Jan 31, 2024 7:00 PM" or "January 31, 2024 at 7:00 PM"
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)|\d{1,2}\s*(?:am|pm|AM|PM))/i,
    // Format: "1/31/2024 7:00 PM" or "01/31/2024 at 7:00 PM"
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)|\d{1,2}\s*(?:am|pm|AM|PM))/i,
    // Format: "2024-01-31 19:00" or "2024-01-31T19:00:00"
    /\b(\d{4}-\d{2}-\d{2})(?:T|\s+)(\d{2}:\d{2}(?::\d{2})?)/,
    // Format: "Today at 7:00 PM" or "Yesterday at 7:00 PM"
    /\b(Today|Yesterday|Tomorrow)\s+at\s+(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)|\d{1,2}\s*(?:am|pm|AM|PM))/i,
  ];

  const parseTimestamp = (dateStr: string, timeStr?: string): string | null => {
    try {
      // Handle relative dates
      if (dateStr.toLowerCase().includes('today')) {
        const today = new Date();
        if (timeStr) {
          const [hour, minute] = timeStr.match(/\d{1,2}/g) || [];
          const ampm = timeStr.match(/[ap]m/i)?.[0]?.toLowerCase();
          if (hour && minute) {
            let h = parseInt(hour);
            const m = parseInt(minute);
            if (ampm === 'pm' && h !== 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            today.setHours(h, m, 0, 0);
            return today.toISOString();
          }
        }
        return today.toISOString();
      }
      if (dateStr.toLowerCase().includes('yesterday')) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (timeStr) {
          const [hour, minute] = timeStr.match(/\d{1,2}/g) || [];
          const ampm = timeStr.match(/[ap]m/i)?.[0]?.toLowerCase();
          if (hour && minute) {
            let h = parseInt(hour);
            const m = parseInt(minute);
            if (ampm === 'pm' && h !== 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            yesterday.setHours(h, m, 0, 0);
          }
        }
        return yesterday.toISOString();
      }

      // Try to parse as ISO date or standard date format
      const dateTimeStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
      const parsed = new Date(dateTimeStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return null;
  };

  const pushBuffer = () => {
    if (!currentSpeaker) return;
    const message = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (!message) return;

    const normalizedSpeaker = currentSpeaker.trim();
    const role = resolveSpeakerRole(normalizedSpeaker, contactName, phoneDigits);

    messages.push({
      speakerLabel: normalizedSpeaker,
      role,
      message,
      timestamp: currentTimestamp,
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains a timestamp
    let foundTimestamp: string | null = null;
    for (const pattern of timestampPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        foundTimestamp = parseTimestamp(match[1], match[2]);
        if (foundTimestamp) break;
      }
    }

    const speakerMatch = trimmed.match(/^([^:]{2,}):\s*(.*)$/);
    if (speakerMatch) {
      pushBuffer();
      currentSpeaker = speakerMatch[1];
      buffer = speakerMatch[2] ? [speakerMatch[2]] : [];
      currentTimestamp = foundTimestamp;
    } else if (currentSpeaker) {
      // If we found a timestamp on a continuation line, use it
      if (foundTimestamp) {
        currentTimestamp = foundTimestamp;
      }
      buffer.push(trimmed);
    }
  }

  pushBuffer();

  if (messages.length === 0) {
    const snippet = thread.replace(/\s+/g, ' ').trim();
    if (snippet) {
      const preview = snippet.length > 600 ? `${snippet.slice(0, 600).trim()}…` : snippet;
      messages.push({
        speakerLabel: 'Lead Email',
        role: 'contact',
        message: preview,
      });
    }
  }

  return messages;
}

function resolveSpeakerRole(
  speaker: string,
  contactName: string | null,
  phoneDigits: string | null
): ParsedLeadMessage['role'] {
  const normalizedSpeaker = speaker.toLowerCase();

  if (phoneDigits && normalizedSpeaker.includes(phoneDigits.slice(-4))) {
    return 'contact';
  }

  if (contactName) {
    const normalizedName = contactName.toLowerCase();
    if (normalizedSpeaker.includes(normalizedName)) {
      return 'contact';
    }
  }

  if (normalizedSpeaker.includes('+') || normalizedSpeaker.includes('@')) {
    return 'contact';
  }

  if (TEAM_ALIASES.some((alias) => normalizedSpeaker.includes(alias))) {
    return 'team';
  }

  return 'unknown';
}


