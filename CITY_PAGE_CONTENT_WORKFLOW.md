# 🎯 City Page Content Generation Workflow

## Overview

This document explains how to generate unique, AI-powered content for each city page in DJ Dash. The system uses OpenAI to create city-specific guides, tips, FAQs, and insights that are unique to each location.

## 🚀 Quick Start

### Option 1: Command Line Script (Recommended)

```bash
# Generate content for a single city
npx tsx scripts/generate-city-page-content.ts memphis-tn

# Generate content for Nashville
npx tsx scripts/generate-city-page-content.ts nashville-tn

# Batch generate multiple cities
npx tsx scripts/generate-city-page-content.ts --batch
```

### Option 2: Admin API Endpoint

```bash
# POST to admin API
curl -X POST http://localhost:3000/api/admin/cities/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "cityName": "Memphis",
    "state": "Tennessee",
    "stateAbbr": "TN",
    "metroArea": "Memphis Metro"
  }'
```

### Option 3: Admin Dashboard UI (Future)

A visual interface will be available at `/admin/cities` to:
- View all city pages
- Generate/regenerate content
- Edit city page settings
- Preview content before publishing

## 📋 Step-by-Step Process

### Step 1: Prepare City Data

Before generating content, gather:
- ✅ City name (e.g., "Memphis")
- ✅ State name (e.g., "Tennessee")
- ✅ State abbreviation (e.g., "TN")
- ✅ Metro area name (optional, e.g., "Memphis Metro")
- ✅ Popular venues (optional, auto-fetched if not provided)
- ✅ Event types (optional, auto-detected from DJ profiles)

### Step 2: Run Content Generation

**Single City:**
```bash
npx tsx scripts/generate-city-page-content.ts memphis-tn
```

**Batch Mode:**
1. Edit `scripts/generate-city-page-content.ts`
2. Add cities to the `batchCities` array:
```typescript
const batchCities: CityInput[] = [
  {
    cityName: 'Memphis',
    state: 'Tennessee',
    stateAbbr: 'TN',
    metroArea: 'Memphis Metro',
  },
  {
    cityName: 'Nashville',
    state: 'Tennessee',
    stateAbbr: 'TN',
  },
  // Add more...
];
```
3. Run: `npx tsx scripts/generate-city-page-content.ts --batch`

### Step 3: Review Generated Content

The script automatically:
1. ✅ Fetches DJ data for the city
2. ✅ Fetches popular venues from past events
3. ✅ Generates AI content (guides, tips, FAQs, seasonal trends)
4. ✅ Calculates aggregate stats (DJ count, reviews, ratings)
5. ✅ Creates/updates city page in database
6. ✅ Sets `is_published = true`

**Review the generated content:**
- Visit `/djdash/cities/[city-slug]` to see the page
- Check the AI-generated content in the database
- Verify SEO metadata is correct

### Step 4: Manual Refinements (Optional)

You can manually edit city pages via:
- **Database**: Update `city_pages` table directly
- **Admin API**: Update specific fields
- **Future Admin UI**: Visual editor

**Common edits:**
- Adjust `hero_title` or `hero_subtitle`
- Add/remove `featured_dj_ids`
- Update `popular_venues` in `city_venue_spotlights` table
- Refine AI-generated FAQs or tips

## 🎨 Content Uniqueness Strategy

### How We Ensure Unique Content

1. **City-Specific Context**:
   - City name, state, and metro area in every prompt
   - Local DJ count and event types
   - Popular venues from actual events

2. **AI Prompt Engineering**:
   - Detailed prompts with city-specific examples
   - Temperature setting (0.7) for creativity while maintaining accuracy
   - JSON structure ensures consistent format

3. **Data-Driven Content**:
   - Real DJ data from your database
   - Actual venue names from past events
   - Real review counts and ratings

4. **Content Types**:
   - **Guides**: City-specific venue guides, pricing guides
   - **Tips**: Local booking tips, venue considerations
   - **FAQs**: City-specific pricing, availability questions
   - **Seasonal Trends**: City-specific event patterns
   - **Local Insights**: City event culture, music preferences

### Example: Memphis vs Nashville

**Memphis Content:**
- "Top 10 Wedding Venues in Memphis for DJs"
- "How much does a Memphis DJ charge?"
- Tips about Memphis event culture
- Seasonal trends for Memphis weddings

**Nashville Content:**
- "Top 10 Wedding Venues in Nashville for DJs"
- "How much does a Nashville DJ charge?"
- Tips about Nashville event culture
- Seasonal trends for Nashville weddings

Each city gets completely unique content, even if the structure is similar.

## 🔄 Content Refresh Workflow

### Quarterly Refresh

AI content should be refreshed quarterly to:
- Update seasonal trends
- Refresh outdated information
- Improve SEO with fresh content

**Refresh Process:**
```bash
# Refresh a single city
npx tsx scripts/generate-city-page-content.ts memphis-tn

# Or use the API
curl -X POST /api/admin/cities/generate-content \
  -d '{"cityName": "Memphis", "state": "Tennessee", "stateAbbr": "TN"}'
```

The script will:
1. Keep existing city page data
2. Regenerate AI content
3. Update `last_ai_update` timestamp
4. Preserve manual edits (if stored separately)

### Manual Content Updates

For urgent updates or corrections:
```sql
-- Update specific content
UPDATE city_pages
SET 
  hero_title = 'New Hero Title',
  ai_generated_content = jsonb_set(
    ai_generated_content,
    '{faqs,0,answer}',
    '"Updated answer"'
  )
WHERE city_slug = 'memphis-tn';
```

## 📊 Content Quality Checklist

Before publishing a city page, verify:

- ✅ **SEO Metadata**: Title, description, OG tags
- ✅ **Hero Section**: Compelling title and subtitle
- ✅ **DJ Count**: Accurate number of DJs in city
- ✅ **Reviews**: Real review count and average rating
- ✅ **Guides**: 3-5 comprehensive guides generated
- ✅ **Tips**: 5-7 practical, city-specific tips
- ✅ **FAQs**: 8-10 relevant FAQs with detailed answers
- ✅ **Seasonal Trends**: All 4 seasons covered
- ✅ **Local Insights**: 3-5 city-specific insights
- ✅ **Featured DJs**: Top 6 DJs selected
- ✅ **Event Types**: All major event types represented

## 🛠️ Troubleshooting

### Issue: "No content generated"

**Solution:**
- Check OpenAI API key in environment variables
- Verify API quota/limits
- Check network connection
- Review error logs for specific issues

### Issue: "City not found in database"

**Solution:**
- Ensure DJs exist with matching city name
- Check city name spelling (case-insensitive)
- Verify `product_context = 'djdash'` in organizations

### Issue: "Low quality content"

**Solution:**
- Provide more context (popular venues, event types)
- Manually refine AI-generated content
- Use higher temperature (0.8-0.9) for more creativity
- Add city-specific examples to prompts

### Issue: "Duplicate content across cities"

**Solution:**
- Ensure city name is in every prompt
- Add city-specific data (venues, DJ count)
- Review generated content before publishing
- Manually edit if needed

## 📈 Scaling to Multiple Cities

### Batch Processing Strategy

1. **Start with Top Cities**:
   - Generate content for your top 10-20 cities first
   - Test and refine the process
   - Gather feedback

2. **Automate Common Cities**:
   - Create a list of 50-100 target cities
   - Run batch generation
   - Review and publish in batches

3. **On-Demand Generation**:
   - Generate content when a new city is requested
   - Use API endpoint for quick generation
   - Auto-publish if quality checks pass

### Rate Limiting

The script includes 2-second delays between cities to:
- Avoid OpenAI API rate limits
- Prevent database connection issues
- Allow for error recovery

For large batches, consider:
- Running during off-peak hours
- Splitting into smaller batches
- Using OpenAI batch API for cost savings

## 🎯 Best Practices

1. **Start Small**: Generate 3-5 cities first to test
2. **Review Content**: Always review AI content before publishing
3. **Manual Refinement**: Don't hesitate to manually improve content
4. **Regular Updates**: Refresh content quarterly
5. **Monitor Analytics**: Track which cities perform best
6. **A/B Testing**: Test different hero titles, descriptions
7. **Local Expertise**: Add local knowledge where AI lacks context

## 📝 Example: Complete City Page Creation

```bash
# 1. Generate content
npx tsx scripts/generate-city-page-content.ts memphis-tn

# 2. Review in database
# Check city_pages table for memphis-tn

# 3. Visit the page
# http://localhost:3000/djdash/cities/memphis-tn

# 4. Make manual refinements (if needed)
# Update hero_title, featured_dj_ids, etc.

# 5. Verify SEO
# Check meta tags, structured data

# 6. Publish
# Set is_published = true (already done by script)

# 7. Monitor analytics
# Track page views, leads, conversions
```

## 🔗 Related Files

- **Script**: `scripts/generate-city-page-content.ts`
- **API Endpoint**: `app/api/admin/cities/generate-content/route.ts`
- **AI Generator**: `utils/ai/city-content-generator.ts`
- **City Page Component**: `components/djdash/city/CityPageClient.tsx`
- **Database Migration**: `supabase/migrations/20250216000000_city_expansion_playbook.sql`

