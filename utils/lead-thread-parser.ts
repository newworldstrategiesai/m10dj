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
  eventTime: string | null;
  endTime: string | null;
  guestCount: number | null;
  budgetRange: string | null;
  notes: string[];
}

export interface ParsedLeadMessage {
  speakerLabel: string;
  role: 'contact' | 'team' | 'unknown';
  message: string;
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

const DATE_REGEX =
  /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](\d{2}|\d{4})\b/;

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

  const possibleName = structured.name || extractName(thread);
  const { firstName, lastName } = splitName(possibleName);

  // Try structured fields first, then fallback to extraction
  let venueName = structured.venueName || extractVenue(thread);
  let venueAddress = structured.venueAddress || null;
  
  // If we have venue name but no address, try to extract address from context
  if (venueName && !venueAddress) {
    // Look for address patterns near the venue name
    const venueIndex = thread.toLowerCase().indexOf(venueName.toLowerCase());
    if (venueIndex >= 0) {
      // Look in the next 200 characters after venue name
      const context = thread.slice(venueIndex, venueIndex + 200);
      const addressPatterns = [
        /\b(\d+\s+[A-Z][a-z]+(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy))[^,\n]{0,50},\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Parkway|Pkwy))[^,\n]{0,50},\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}(?:\s+\d{5})?)/i,
        /\baddress[:\s]+([^.\n]{10,100})/i,
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
      // Check if first part looks like a venue name (not just a street number)
      if (!/^\d+/.test(firstPart) && /^[A-Z][a-z]+/.test(firstPart)) {
        venueName = capitalize(firstPart);
      }
    }
  }
  const eventType = structured.eventType || inferEventType(thread);

  let eventDate = structured.eventDate || null;
  if (!eventDate) {
    const dateMatch = thread.match(DATE_REGEX);
    if (dateMatch) {
      eventDate = normalizeFlexibleDate(dateMatch[0]);
    }
  }

  // Extract event time from natural language if not in structured fields
  let eventTime = structured.eventTime || null;
  let endTime = structured.endTime || null;
  
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
    // Try to match time ranges first (e.g., "3pm-5pm", "3:00 PM to 5:00 PM", "ceremony is 3 pm-3:30")
    const timeRangePatterns = [
      /(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
      /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*(?:-|to|until|through)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
      /(?:from|between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:to|until|-)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
    ];
    
    for (const pattern of timeRangePatterns) {
      const match = thread.match(pattern);
      if (match) {
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
    
    // If no range found, try single time patterns
    if (!eventTime) {
      const timePatterns = [
        /(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /(?:at|starts?|begins?|starts? at|beginning at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:start|begin|ceremony|reception)/i,
        /(?:time|event time|start time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /(\d{1,2}\s*(?:am|pm|AM|PM))\s+(?:start|begin|ceremony)/i,
      ];
      
      for (const pattern of timePatterns) {
        const match = thread.match(pattern);
        if (match && !grandEntrance) {
          eventTime = match[1].trim();
          break;
        }
      }
    }
    
    // Try to extract end time separately if not already found
    if (!endTime) {
      const endTimePatterns = [
        /(?:ceremony|it|event)\s+(?:will\s+)?end\s+(?:no\s+later\s+than|by|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /(?:ends?|finishes?|ends? at|finishes? at|until|till)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:end|finish)/i,
        /(?:end time|finish time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
      ];
      
      for (const pattern of endTimePatterns) {
        const match = thread.match(pattern);
        if (match && !grandExit) {
          endTime = match[1].trim();
          break;
        }
      }
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
    eventTime,
    endTime,
    guestCount,
    budgetRange,
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
    if (prefix && !/\d/.test(prefix)) {
      const candidate = sanitizeNameCandidate(prefix.replace(/[._]/g, ' '));
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
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
  const enhancedBlocklist = [...VENUE_BLOCKLIST, 'i know', 'how it goes', 'by the way', 'got your', 'reaching out'];
  if (enhancedBlocklist.some(phrase => lower.includes(phrase))) {
    return null;
  }

  // Remove conversational phrases that might be captured
  value = value.replace(/\b(?:i know|how it goes|by the way|got your|reaching out|was reaching|to see if)\b/gi, '').trim();
  
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
  venueName: string | null;
  venueAddress: string | null;
  guestCount: number | null;
  budgetRange: string | null;
  eventType: string | null;
  notes: string[];
}

function extractStructuredFields(thread: string): StructuredFields {
  const fields: StructuredFields = {
    name: null,
    email: null,
    eventDate: null,
    eventTime: null,
    endTime: null,
    venueName: null,
    venueAddress: null,
    guestCount: null,
    budgetRange: null,
    eventType: null,
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
    const labeledMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9\s\-_]{0,49}):\s*(.+)$/);
    if (labeledMatch) {
      const label = labeledMatch[1].toLowerCase().trim();
      const value = labeledMatch[2].trim();
      
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
      continue;
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
    if (!fields.eventTime) {
      // Try time ranges first
      const rangePatterns = [
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /(?:from|between)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:to|until|-)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
      ];
      
      for (const pattern of rangePatterns) {
        const rangeMatch = trimmed.match(pattern);
        if (rangeMatch) {
          fields.eventTime = rangeMatch[1].trim();
          fields.endTime = rangeMatch[2].trim();
          break;
        }
      }
      
      // If no range found, try single time patterns
      if (!fields.eventTime) {
        const timePatterns = [
          /(?:at|starts?|begins?|starts? at|beginning at)\s+(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/i,
          /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s+(?:start|begin|ceremony|reception)/i,
          /(?:time|event time|start time)[:\s]+(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/i,
          /(\d{1,2}\s*(?:am|pm|AM|PM))\s+(?:start|begin|ceremony)/i,
        ];
        
        for (const pattern of timePatterns) {
          const timeMatch = trimmed.match(pattern);
          if (timeMatch) {
            fields.eventTime = timeMatch[1].trim();
            break;
          }
        }
      }
    }
    
    // Extract end time separately if not already found
    if (!fields.endTime) {
      const endTimePatterns = [
        /(?:ends?|finishes?|ends? at|finishes? at|until|till)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
        /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s+(?:end|finish)/i,
        /(?:end time|finish time)[:\s]+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
      ];
      
      for (const pattern of endTimePatterns) {
        const endMatch = trimmed.match(pattern);
        if (endMatch) {
          fields.endTime = endMatch[1].trim();
          break;
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

  const parsed = new Date(sanitized);
  if (!isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()))
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
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const speakerMatch = trimmed.match(/^([^:]{2,}):\s*(.*)$/);
    if (speakerMatch) {
      pushBuffer();
      currentSpeaker = speakerMatch[1];
      buffer = speakerMatch[2] ? [speakerMatch[2]] : [];
    } else if (currentSpeaker) {
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


