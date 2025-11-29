// Shared email parsing utility - extracted from import-thread.ts for reuse

export interface ParsedEmailData {
  playlists: {
    first_dance?: string;
    reception?: string;
    cocktail?: string;
  };
  ceremonyTime: string | null;
  ceremonyEndTime: string | null;
  grandEntrance: string | null;
  grandExit: string | null;
  specialRequests: string | null;
  notes: string | null;
}

export function normalizeTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  
  timeStr = timeStr.trim();
  // Improved regex to handle formats like "3 pm", "3:30 pm", "3pm", etc.
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    let ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    
    // If no am/pm specified, infer from context (most weddings are PM)
    // For times 1-11 without am/pm, assume PM (wedding times)
    if (!ampm) {
      if (hours >= 1 && hours <= 11) {
        ampm = 'pm';
      } else if (hours === 12) {
        ampm = 'pm';
      } else {
        ampm = 'am';
      }
    }
    
    if (ampm === 'pm' && hours !== 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
  
  return null;
}

export function parseEmailContent(emailContent: string): ParsedEmailData {
  const extracted: ParsedEmailData = {
    playlists: {},
    ceremonyTime: null,
    ceremonyEndTime: null,
    grandEntrance: null,
    grandExit: null,
    specialRequests: null,
    notes: null
  };

  const lowerContent = emailContent.toLowerCase();

  // Extract Spotify playlist links
  const spotifyRegex = /(?:spotify\.com|open\.spotify\.com)[^\s\)]+/gi;
  const spotifyLinks = emailContent.match(spotifyRegex) || [];
  
  // Try to identify playlist types from context
  spotifyLinks.forEach((link, index) => {
    const contextBefore = emailContent.substring(Math.max(0, emailContent.indexOf(link) - 100), emailContent.indexOf(link));
    const contextLower = contextBefore.toLowerCase();
    
    if (contextLower.includes('first dance') || contextLower.includes('first dances')) {
      extracted.playlists.first_dance = link;
    } else if (contextLower.includes('wedding') && !contextLower.includes('cocktail')) {
      extracted.playlists.reception = link;
    } else if (contextLower.includes('cocktail')) {
      extracted.playlists.cocktail = link;
    } else {
      // Assign in order if no context found
      if (index === 0) extracted.playlists.first_dance = link;
      if (index === 1) extracted.playlists.reception = link;
      if (index === 2) extracted.playlists.cocktail = link;
    }
  });

  // Extract times with improved patterns
  const ceremonyRangePatterns = [
    /(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+(?:to|until)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /(?:the\s+)?ceremony\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  ];
  
  let ceremonyRangeMatch = null;
  for (const pattern of ceremonyRangePatterns) {
    ceremonyRangeMatch = emailContent.match(pattern);
    if (ceremonyRangeMatch) break;
  }
  
  if (ceremonyRangeMatch) {
    extracted.ceremonyTime = normalizeTime(ceremonyRangeMatch[1]);
    extracted.ceremonyEndTime = normalizeTime(ceremonyRangeMatch[2]);
  } else {
    // Try single ceremony time
    const singleCeremonyMatch = emailContent.match(/(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (singleCeremonyMatch) {
      extracted.ceremonyTime = normalizeTime(singleCeremonyMatch[1]);
    }
  }
  
  // Check for "will end no later than" pattern
  const ceremonyEndMatch = emailContent.match(/(?:ceremony|it)\s+(?:will\s+)?end\s+(?:no\s+later\s+than|by|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (ceremonyEndMatch && !extracted.ceremonyEndTime) {
    extracted.ceremonyEndTime = normalizeTime(ceremonyEndMatch[1]);
  }

  // Extract grand entrance
  const entrancePatterns = [
    /grand\s+entrance\s+is\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+entrance\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+entrance\s+is\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  ];
  
  for (const pattern of entrancePatterns) {
    const entranceMatch = emailContent.match(pattern);
    if (entranceMatch) {
      extracted.grandEntrance = normalizeTime(entranceMatch[1]);
      break;
    }
  }

  // Extract grand exit
  const exitPatterns = [
    /grand\s+exit\s+is\s+scheduled\s+for\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+exit\s+scheduled\s+for\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+exit\s+is\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+exit\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  ];
  
  for (const pattern of exitPatterns) {
    const exitMatch = emailContent.match(pattern);
    if (exitMatch) {
      extracted.grandExit = normalizeTime(exitMatch[1]);
      break;
    }
  }
  
  // If no ceremony time found but we found entrance, use entrance as event time
  if (!extracted.ceremonyTime && extracted.grandEntrance) {
    extracted.ceremonyTime = extracted.grandEntrance;
  }

  // Extract special requests
  const specialRequests = [];
  if (lowerContent.includes('mariachi')) {
    const mariachiMatch = emailContent.match(/mariachi[^.]*(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)[^.]*/i);
    if (mariachiMatch) {
      specialRequests.push(mariachiMatch[0].trim());
    }
  }
  if (lowerContent.includes('break') || lowerContent.includes('breaks')) {
    const breakMatch = emailContent.match(/[^.]*(?:break|breaks)[^.]*/i);
    if (breakMatch) {
      specialRequests.push(breakMatch[0].trim());
    }
  }

  if (specialRequests.length > 0) {
    extracted.specialRequests = specialRequests.join('\n');
  }

  // Extract general notes
  const notes = [];
  if (emailContent.match(/(?:what does|how does|schedule|arrival|set up|break down)/i)) {
    const scheduleMatch = emailContent.match(/[^.]*(?:what does|how does|schedule|arrival|set up|break down)[^.]*/i);
    if (scheduleMatch) {
      notes.push(scheduleMatch[0].trim());
    }
  }

  if (notes.length > 0) {
    extracted.notes = notes.join('\n');
  }

  return extracted;
}

