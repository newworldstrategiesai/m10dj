# Intelligent Quick Replies System

## Overview

The SMS chat interface now features an intelligent quick reply system that adapts to the conversation context. It uses a hybrid approach: **basic pattern matching for data collection**, then **OpenAI for advanced suggestions** once all required information is captured.

## How It Works

### Phase 1: Data Collection (Free - No AI)

The system analyzes the entire conversation history to extract key information:

1. **Event Type** - Wedding, birthday, corporate, party, etc.
2. **Date** - Event date or timeline
3. **Venue** - Location or venue name
4. **Budget** - Price range (optional)
5. **Guest Count** - Number of attendees (optional)

During this phase, quick replies focus on gathering **missing required data** in priority order:

```
Priority 1: Event Type → "What type of event are you planning?"
Priority 2: Date → "When is your wedding?"
Priority 3: Venue → "What venue are you considering?"
```

### Phase 2: AI-Powered Suggestions (Once Data is Complete)

Once all required fields are captured (Event Type, Date, Venue), the system calls OpenAI to generate 3 intelligent, context-aware suggestions that:

- Reference specific details from the conversation
- Move the conversation toward booking
- Match the customer's tone and style
- Provide actionable next steps (pricing, availability, packages)

## Key Features

### ✅ Context-Aware Detection

The system won't ask for information already provided:

**Customer:** "Hi this is Haywood Williams, I will be needing DJ for my son upcoming wedding"
- ❌ Won't suggest: "What type of event?"
- ✅ Will suggest: "When is your son's wedding?"

**Customer:** "Venue: 6616 Wilhugh Pl, Nashville, TN 37209"
- ❌ Won't suggest: "Where is your event?"
- ✅ Will suggest: "Great! What's the date of your wedding?" or use AI for next steps

### ✅ Progressive Data Collection

The system asks for one thing at a time in logical order:

1. First interaction → Get event type
2. Second interaction → Get date
3. Third interaction → Get venue
4. After that → AI-powered suggestions for closing/booking

### ✅ Smart Pattern Recognition

Detects information even when not explicitly stated:

- **Dates:** "January 15th, 2025", "next Saturday", "6/15/24"
- **Venues:** "6616 Wilhugh Pl", "at The Grand Ballroom", "Nashville Convention Center"
- **Event Types:** Keywords in context (wedding, birthday, corporate, party, etc.)
- **Budget:** "$2000", "budget of 5k", "around three thousand"
- **Guest Count:** "150 guests", "about 200 people", "100 attendees"

### ✅ Cost Optimization

- **Phase 1 (Data Collection):** $0 - Uses local pattern matching
- **Phase 2 (AI Suggestions):** ~$0.001 per request using GPT-4o-mini
- Only calls OpenAI when it adds real value (after data is collected)

### ✅ Loading States

The UI shows clear feedback:
- "Generating smart replies..." when calling OpenAI
- Disabled buttons during loading
- Spinning icon on the refresh button

### ✅ Graceful Fallbacks

If OpenAI fails or is unavailable:
- Falls back to generic but professional suggestions
- Never blocks the user from continuing the conversation
- Logs errors for debugging

## Example Conversation Flow

### Conversation 1: Wedding Inquiry

```
Customer: "Hi this is Haywood Williams, I will be needing DJ for my son upcoming wedding"
System detects: Event type = "wedding" ✅

Quick Replies (Basic):
- "When is your son's wedding?"
- "What date are you looking at for your event?"
- "Great! What's the date of your event?"
```

```
Customer: "June 15th, 2025"
System detects: Date = "June 15th, 2025" ✅

Quick Replies (Basic):
- "Sounds good! What venue are you considering?"
- "Awesome! Where will the event be held?"
- "Great! Do you have a venue in mind, or do you need recommendations?"
```

```
Customer: "Venue: 6616 Wilhugh Pl, Nashville, TN 37209"
System detects: Venue = "6616 Wilhugh Pl, Nashville, TN 37209" ✅
All required data captured! → Calls OpenAI

Quick Replies (AI-Powered):
- "Perfect! I'm familiar with that area. How many guests are you expecting?"
- "Sounds great! I'd love to send you a custom package for your son's June 15th wedding. Should I put together pricing?"
- "Excellent venue choice! When would be a good time for a quick call to discuss music preferences?"
```

### Conversation 2: Price Inquiry

```
Customer: "How much for a wedding DJ?"
System detects: Event type = "wedding" ✅, but missing date and venue

Quick Replies (Basic):
- "Perfect! When is your wedding?"
- "What date are you looking at for your event?"
- "Great! What's the date of your event?"
```

## API Endpoint

### POST `/api/generate-reply-suggestions`

**Request Body:**
```json
{
  "lastMessage": "Venue: 6616 Wilhugh Pl, Nashville, TN 37209",
  "conversationHistory": [
    { "role": "customer", "content": "Hi, I need DJ for my son's wedding" },
    { "role": "business", "content": "When is your son's wedding?" },
    { "role": "customer", "content": "June 15th, 2025" },
    { "role": "business", "content": "Great! What venue?" },
    { "role": "customer", "content": "Venue: 6616 Wilhugh Pl, Nashville, TN 37209" }
  ],
  "leadData": {
    "eventType": "wedding",
    "hasDate": true,
    "hasVenue": true,
    "hasBudget": false,
    "hasGuestCount": false
  }
}
```

**Response:**
```json
{
  "suggestions": [
    "Perfect! I'm familiar with that area. How many guests are you expecting?",
    "Sounds great! I'd love to send you a custom package for June 15th. Should I put together pricing?",
    "Excellent venue choice! When would be a good time to discuss music preferences?"
  ]
}
```

## Configuration

The system uses these environment variables:

- `OPENAI_API_KEY` - Required for AI-powered suggestions
- Model: `gpt-4o-mini` (cost-effective and fast)
- Max tokens: 200 (keeps responses short for SMS)
- Temperature: 0.7 (balanced creativity)

## Benefits

1. **Better Customer Experience** - No redundant questions
2. **Cost Efficient** - Only uses AI when valuable
3. **Faster Qualification** - Systematically collects required data
4. **Higher Conversion** - Intelligent suggestions move toward booking
5. **Time Saving** - Quick replies reduce typing time
6. **Professional** - Consistent, high-quality responses

## Future Enhancements

- [ ] Extract data from contact record (event_date, venue_name, event_type)
- [ ] Save extracted data back to contact record automatically
- [ ] Add more sophisticated date parsing (relative dates, timezones)
- [ ] Multi-language support based on customer's preferred language
- [ ] Learn from successful conversations to improve suggestions
- [ ] Add special handling for urgent inquiries (next week/tomorrow)
- [ ] Integration with calendar for real-time availability checks

## Testing

To test the system:

1. Start a new conversation in the Chat page
2. Send a message like "Hi, I need a DJ for my wedding"
3. Notice the quick replies focus on getting the date
4. Provide a date
5. Notice the quick replies now ask about venue
6. Provide a venue
7. Notice the quick replies switch to AI-powered suggestions
8. Check browser console for API calls and extraction results

## Troubleshooting

**Quick replies not showing:**
- Check that the last message is from the customer (inbound)
- Verify conversation history is being loaded correctly

**AI suggestions not working:**
- Check `OPENAI_API_KEY` is set in environment
- Check API logs: `/api/generate-reply-suggestions`
- System will fallback to basic suggestions if AI fails

**Wrong data detected:**
- Review regex patterns in `extractLeadDataFromConversation()`
- Add debug logging to see what's being detected
- Update patterns for edge cases

**Performance issues:**
- AI calls are async and don't block the UI
- Typical response time: 1-2 seconds
- Consider caching suggestions if same conversation state repeats

---

**Last Updated:** 2025-11-10

