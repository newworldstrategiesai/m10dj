# Package Bundle Strategy: Removing Monogram from Bundles

## Problem
Clients frequently request to remove monogram projection from Package 2, indicating it's not a high-value bundled item. Most clients don't care about monogram projection, so it shouldn't be forced into packages.

## Current State

### Package 2 ($2,500)
- ✅ DJ/MC Services (4 hours)
- ✅ Speakers & microphones
- ✅ Dance Floor Lighting
- ✅ Uplighting (16 LED fixtures)
- ✅ Ceremony Audio
- ❌ **Monogram Projection** (should be removed)

### Package 3 ($3,000)
- ✅ Everything in Package 2
- ✅ Dancing on the Clouds
- ❌ **Monogram Projection** (should be removed)

## Strategy: Make Monogram Optional Add-On

### Approach 1: Remove from Bundles, Keep as Add-On (RECOMMENDED)
**Benefits:**
- Clients only pay for what they want
- Reduces friction in sales conversations
- Monogram remains available for those who want it ($350 add-on)
- Package pricing can stay the same or be adjusted slightly

**Implementation:**
1. Remove monogram from Package 2 features list
2. Remove monogram from Package 3 features list
3. Keep monogram as an optional add-on ($350)
4. Update all package descriptions across the codebase
5. Update AI assistant prompts to reflect new structure

### Approach 2: Adjust Package Pricing
If removing monogram, consider:
- **Option A:** Keep Package 2 at $2,500 (better value perception)
- **Option B:** Reduce Package 2 to $2,150 (removing $350 monogram value)
- **Option C:** Keep pricing, emphasize better value with ceremony audio + uplighting

**Recommendation:** Keep Package 2 at $2,500 - ceremony audio + uplighting are higher-value items that justify the price.

## Files to Update

### Primary Package Definitions
1. `pages/quote/[id]/index.js` - Main quote page package definitions
2. `pages/select-services/[token].tsx` - Service selection page
3. `pages/select-services/demo.tsx` - Demo service selection

### AI Assistant & Messaging
4. `utils/sms-agent.js` - SMS agent package descriptions
5. `utils/lead-assistant-prompt.js` - Lead assistant prompts
6. `pages/api/leads/chat.ts` - Chat API package info
7. `pages/api/leads/sms.ts` - SMS API package info
8. `lib/dj-agent-workflow.ts` - DJ agent workflow

### Documentation & Marketing
9. `components/ui/Pricing/Pricing.tsx` - Pricing component
10. `app/pricing/page.tsx` - Pricing page
11. Any blog posts or marketing pages mentioning packages

## New Package Structure

### Package 2 - Reception Only ($2,500) ⭐ MOST POPULAR
- Up to 4 hours of DJ/MC services at reception
- Speakers & microphones included
- Dance Floor Lighting
- Multi-color LED fixtures for dance floor
- Uplighting (16 multicolor LED fixtures)
- Ceremony Audio (additional hour + ceremony music)
- ~~Monogram Projection~~ (removed - available as add-on)

### Package 3 - Ceremony & Reception ($3,000)
- Everything in Package 2
- Dancing on the Clouds
- ~~Monogram Projection~~ (removed - available as add-on)

### Monogram Projection Add-On ($350)
- Available as optional add-on to any package
- Custom graphic with names or initials
- Fully customizable font and look
- Can be projected on any floor or wall

## Sales Messaging Update

**Before:** "Package 2 includes ceremony audio and monogram projection..."

**After:** "Package 2 includes ceremony audio and uplighting. Monogram projection is available as an optional add-on if you'd like it."

## Benefits of This Approach

1. **Reduced Friction:** Clients don't have to ask to remove something they don't want
2. **Better Value Perception:** Packages focus on high-value items (ceremony audio, uplighting)
3. **Flexibility:** Clients who want monogram can still add it
4. **Simpler Sales:** Less back-and-forth about removing unwanted features
5. **Higher Conversion:** Fewer objections during the sales process

## Implementation Checklist

- [ ] Update Package 2 definition in quote page
- [ ] Update Package 3 definition in quote page
- [ ] Update service selection pages
- [ ] Update AI assistant prompts
- [ ] Update SMS/chat responses
- [ ] Update pricing components
- [ ] Test quote generation
- [ ] Test service selection flow
- [ ] Update any marketing copy
- [ ] Verify add-on still works correctly

