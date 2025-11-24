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

  const venueName = structured.venueName || extractVenue(thread);
  const venueAddress = structured.venueAddress || null;
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
  if (!eventTime) {
    const timePatterns = [
      /(?:at|starts?|begins?|starts? at|beginning at)\s+(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/i,
      /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)\s+(?:start|begin|ceremony|reception)/i,
      /(?:time|event time|start time)[:\s]+(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM)?)/i,
      /(\d{1,2}\s*(?:am|pm|AM|PM))\s+(?:start|begin|ceremony)/i,
    ];
    
    for (const pattern of timePatterns) {
      const match = thread.match(pattern);
      if (match) {
        eventTime = match[1].trim();
        break;
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

    const labeledMatch = trimmed.match(/^([A-Za-z ]{2,40}):\s*(.+)$/);
    if (labeledMatch) {
      const label = labeledMatch[1].toLowerCase().trim();
      const value = labeledMatch[2].trim();

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
          if (!fields.email) {
            const match = value.match(EMAIL_REGEX);
            if (match) {
              fields.email = selectContactEmail(match);
            }
          }
          break;
        case 'date': {
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
        case 'venue':
          setVenueFields(fields, value);
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

    // Enhanced event time extraction
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

  const monthNameRegex = /(january|february|march|april|may|june|july|august|september|october|november|december)/i;
  if (!monthNameRegex.test(trimmed)) {
    return null;
  }

  const sanitized = stripOrdinalSuffixes(trimmed.replace(/[–—]/g, '-'));
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


