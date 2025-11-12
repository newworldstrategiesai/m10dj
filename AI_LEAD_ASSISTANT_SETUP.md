# AI Lead Assistant - Setup & Configuration

## 🤖 Overview

The AI Lead Assistant uses OpenAI's GPT-4 to engage with leads in real-time after they submit the contact form. It provides intelligent, contextual responses that feel natural and helpful, not robotic.

---

## ⚙️ Setup Requirements

### 1. OpenAI API Key

You need an OpenAI API key with access to GPT-4.

**Get your key:**
1. Go to https://platform.openai.com/account/api-keys
2. Create a new secret key
3. Copy the key (you'll only see it once)

**Add to environment:**
```env
OPENAI_API_KEY=sk_test_your_api_key_here
```

### 2. Environment Variables

Add to `.env.local` or Vercel dashboard:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk_xxxxxxxxxxxxx

# Optional: Set API timeout (in milliseconds)
OPENAI_API_TIMEOUT=30000
```

### 3. Vercel Deployment

If using Vercel:
1. Go to Project Settings → Environment Variables
2. Add `OPENAI_API_KEY`
3. Set to all environments (Production, Preview, Development)
4. Redeploy project

---

## 🔄 How It Works

### Conversation Flow

```
1. Customer fills out lead form
2. Form submits successfully
3. Chat interface appears with instant greeting
4. AI greets customer by name with personalized message
5. Customer asks questions
6. AI responds contextually using:
   - Company information
   - Packages and pricing
   - Event details
   - Conversation history
7. Conversation continues naturally
```

### Message Routing

```
Customer Message
    ↓
Chat Component
    ↓
API Request to /api/leads/chat
    ↓
OpenAI GPT-4 API
    (with company context prompt)
    ↓
API Response
    ↓
Chat Component displays response
    ↓
Customer sees AI message
```

---

## 📊 System Prompt Context

The AI receives detailed context including:

### Company Information
- Business name and location
- Contact details
- Packages and pricing
- Available add-ons

### Lead Information
- Name, email, phone
- Event type and date
- Venue and guest count
- Any additional details provided

### Behavior Guidelines
- Communicate warmly and professionally
- Use natural conversational language
- Answer questions knowledgeably
- Build trust and excitement
- Mention Ben's personal follow-up
- Direct complex issues to Ben

---

## 🧪 Testing

### Local Testing

1. **Setup:**
   ```bash
   # Add OPENAI_API_KEY to .env.local
   OPENAI_API_KEY=sk_xxxxx
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Test flow:**
   - Go to contact form
   - Fill out completely
   - Click "Get My Free Quote"
   - Chat should appear with greeting
   - Type a question
   - Wait for AI response
   - Check console for logs

### Debugging

**Enable verbose logging:**
```javascript
// In ContactFormChat.js
console.log('📤 Sending message to AI assistant...');
console.log('Response:', data);
```

**Monitor API calls:**
1. Open DevTools → Network tab
2. Submit form and look for POST to `/api/leads/chat`
3. Check response body for `message` field
4. Look at console for token usage

**Check API errors:**
1. Server logs will show OpenAI API errors
2. Chat shows fallback responses on error
3. See `/api/leads/chat` for error handling

---

## 💰 Pricing

### OpenAI API Costs

GPT-4 Turbo pricing (as of Nov 2024):
- **Input tokens:** $0.01 per 1K tokens
- **Output tokens:** $0.03 per 1K tokens

### Typical Conversation Cost

Average lead conversation (5-10 messages):
- Input: ~1,500 tokens = $0.015
- Output: ~1,000 tokens = $0.03
- **Total per lead: ~$0.045**

### Monthly Estimate

If 100 leads per month with 5 messages each:
- 100 × $0.045 = **$4.50/month**

If 1,000 leads per month:
- 1,000 × $0.045 = **$45/month**

---

## 🔧 Configuration Options

### Model Selection

Current: `gpt-4-turbo-preview`

To change model:
```javascript
// In /pages/api/leads/chat.ts
model: 'gpt-4-turbo-preview', // Change this

// Options:
// - gpt-4-turbo-preview (recommended, fast)
// - gpt-4 (more expensive)
// - gpt-3.5-turbo (cheaper, less capable)
```

### Temperature (Creativity)

Current: `0.7` (balanced)

```javascript
temperature: 0.7

// Range: 0.0 to 2.0
// 0.0 = Deterministic (always same response)
// 0.7 = Balanced (current setting)
// 1.0+ = More creative/random
```

### Response Length

Current: `max_tokens: 500`

```javascript
max_tokens: 500 // Max length of response

// Adjust based on needs
// Typical responses: 150-300 tokens
```

---

## 📝 Customizing Responses

### Edit System Prompt

File: `/pages/api/leads/chat.ts`

Find `buildSystemPrompt()` function:

```javascript
function buildSystemPrompt(leadData: any): string {
  return `You are a friendly and professional lead assistant...
  
  // Edit this text to change AI personality
  // Add company info, policies, etc.
  // Include prices, packages, contact info
`;
}
```

### Change Company Information

Update in `buildSystemPrompt()`:

```javascript
COMPANY INFORMATION:
- Business: DJ services for weddings, corporate events, parties, and celebrations
- Location: Memphis, Tennessee & Surrounding Areas
- Phone: (901) 410-2020  // Update these
- Email: djbenmurray@gmail.com

PACKAGES OFFERED:
- Package 1: ... // Update pricing and details
```

### Edit Behavior

Change guidelines section:

```javascript
YOUR ROLE:
You are engaging with a lead...
// Customize what the AI should do
// Change tone, approach, priorities
```

---

## 🚨 Error Handling

### API Errors

If OpenAI API fails:
1. Error is logged to server console
2. Chat shows fallback response
3. Conversation continues gracefully
4. No data loss

### Fallback Responses

If API unavailable, uses one of:
- "That's a great question! Ben is going to love discussing this..."
- "I appreciate you sharing that! Our team will..."
- "Perfect! That helps me understand your vision better..."

### Timeout Handling

If API takes too long:
1. After 30 seconds, shows fallback
2. User can continue asking questions
3. Each question tries API again

---

## 🔐 Security & Privacy

### Data Handling

**Sent to OpenAI:**
- Customer messages
- Company context
- Lead information

**NOT sent:**
- Customer email stored in Supabase
- Customer personal data beyond form
- Internal business secrets

### API Key Security

**Best practices:**
- ✅ Keep in environment variables
- ✅ Never commit to git
- ✅ Rotate regularly
- ✅ Monitor usage in OpenAI dashboard
- ❌ Don't share with team
- ❌ Don't put in client-side code

### Conversation Privacy

- Conversations stored locally in browser
- Not sent to any external service except OpenAI
- Not stored on your servers
- Lost if user closes/refreshes page

---

## 📊 Monitoring

### Check API Usage

1. Go to https://platform.openai.com/account/usage/overview
2. See monthly usage and costs
3. Monitor tokens and responses
4. Set usage limits if needed

### View Server Logs

When user sends message, check logs for:
```
📤 Sending message to AI assistant...
Lead: [Customer Name]
✅ OpenAI API Response received
Tokens used: [number]
```

### Monitor Errors

Errors appear as:
```
❌ OpenAI API Error: [error message]
❌ Chat endpoint error: [error]
```

---

## 🚀 Deployment Checklist

- [ ] Add `OPENAI_API_KEY` to `.env.local`
- [ ] Test locally with dev server
- [ ] Verify chat appears after form submission
- [ ] Test multiple messages work
- [ ] Check fallback works (disable API to test)
- [ ] Test on mobile device
- [ ] Test in dark mode
- [ ] Add `OPENAI_API_KEY` to Vercel
- [ ] Redeploy to production
- [ ] Test on live site
- [ ] Monitor OpenAI usage dashboard

---

## 🧬 How to Improve Responses

### Examples to Show AI Better Behavior

Add to system prompt:

```javascript
CONVERSATION EXAMPLES:

Customer: "What's your cheapest package?"
Assistant: "Our most affordable option is Package 1 at $2,000, which includes 4 hours of DJ/MC services, speakers, dance floor lighting, and more. But let me ask - what's the vibe you're going for? That might help me suggest the perfect fit."

Customer: "Can you do my wedding on Dec 25?"
Assistant: "December 25th - that's a big day! Yes, we absolutely do weddings around the holidays. For that date, I'd want to make sure Ben marks his calendar ASAP. What time were you thinking for your reception?"
```

### Avoid Phrases

Tell AI what NOT to do:

```javascript
COMMUNICATION STYLE:
- Avoid: "Unfortunately", "I cannot", "That's not possible"
- Instead: Be solution-oriented, positive
- Avoid: Overly formal language
- Instead: Warm, conversational tone
- Avoid: Making promises
- Instead: Mention Ben will discuss details
```

---

## 🆘 Troubleshooting

### Problem: Chat doesn't respond

**Check:**
1. `OPENAI_API_KEY` is set
2. Key is valid (test in OpenAI dashboard)
3. Account has available balance
4. No rate limits exceeded

**Solution:**
1. Verify API key value
2. Check OpenAI account status
3. Wait if rate limited
4. Check error in server logs

### Problem: Responses are generic

**Solution:**
1. Update system prompt with more context
2. Add company personality
3. Include more examples
4. Adjust temperature (try 0.8-1.0)

### Problem: AI doesn't mention Ben

**Solution:**
1. Check system prompt includes Ben's name
2. Verify `leadData` is passed correctly
3. Update prompt to emphasize personal touch

### Problem: Responses too long/short

**Solution:**
1. Adjust `max_tokens` in API call
2. Update system prompt with guidance
3. Change temperature

---

## 📈 Optimization Tips

### Cost Reduction

- Use `gpt-3.5-turbo` (cheaper)
- Lower `max_tokens` value
- Implement conversation caching

### Response Quality

- Use `gpt-4-turbo-preview` (better)
- Add more examples to prompt
- Adjust temperature (0.7-0.8 optimal)
- Include company voice/personality

### Speed

- `gpt-3.5-turbo` is fastest
- `gpt-4-turbo` is slower
- `gpt-4` is slowest

---

## 📞 Support

**For OpenAI issues:**
- Visit: https://platform.openai.com/account/help/summary
- Check API status: https://status.openai.com/

**For integration issues:**
- Check `/api/leads/chat` endpoint
- Monitor server logs
- Verify env variables

---

**Status:** ✅ Ready for Testing  
**Last Updated:** Today  
**Model:** GPT-4 Turbo Preview


