# AI-Shopable But Lead-Focused Pricing Strategy

## The Strategy

**Goal**: Make your packages discoverable by AI (ChatGPT, Google Shopping) while requiring human contact for exact pricing to capture leads.

## Why This Works

### ✅ Benefits:
1. **AI Can Still Match You**: Structured data (JSON-LD) includes exact pricing that AI can read but humans don't see
2. **Lead Capture**: Visitors must contact you for pricing, giving you their info
3. **Pricing Flexibility**: You can adjust quotes based on event details without showing outdated prices
4. **Competitive Advantage**: Competitors can't easily price-match if they can't see your exact rates
5. **Better Conversations**: When people contact you, you can explain value and upsell

### ⚠️ Considerations:
- Some users may bounce if they can't see any pricing (mitigate with "Starting at..." ranges)
- AI shopping features work best with exact prices, but price ranges still work
- You need to respond quickly to inquiries to convert leads

## Implementation Approach

### 1. Visible Content (What Humans See)
- **Vague Price Ranges**: "Starting at $1,600" or "Contact for custom pricing"
- **Value-Focused Descriptions**: Focus on what's included, not price
- **Clear CTAs**: "Get Your Custom Quote" buttons everywhere
- **Trust Signals**: "No hidden fees", "Transparent pricing after consultation"

### 2. Structured Data (What AI Sees)
- **Exact Pricing**: Include real prices ($2000, $2500, $3000) in Product schema
- **Price Ranges**: Show min/max in offers
- **Availability**: Mark as "InStock" or "PreOrder"
- **Keywords**: Include pricing-related terms for AI matching

### 3. Meta Tags (What Search Engines See)
- **Price Ranges**: "Memphis Wedding DJ Packages: $2,000-$3,000"
- **Descriptions**: Include value propositions, not just prices
- **Structured Data**: Rich snippets with pricing info

## Example Implementation

### Visible on Page:
```tsx
<div className="package-card">
  <h3>Package 1 - Reception Only</h3>
  <p className="text-gray-600">Starting at $1,600</p>
  <p className="text-sm text-gray-500">
    <LockIcon /> Exact pricing after inquiry
  </p>
  <button>Get Your Custom Quote</button>
</div>
```

### Hidden in Structured Data (AI-Readable):
```json
{
  "@type": "Product",
  "name": "Package 1 - Reception Only",
  "offers": {
    "@type": "Offer",
    "price": "2000",
    "priceCurrency": "USD",
    "priceRange": "$2,000-$2,600",
    "availability": "https://schema.org/InStock"
  }
}
```

## Best Practices

### 1. Use Price Ranges, Not Exact Prices
- ✅ "Starting at $1,600" 
- ✅ "Packages from $2,000-$3,000"
- ❌ "$2,000" (too specific, reduces flexibility)

### 2. Focus on Value in Descriptions
- ✅ "Complete 6-hour wedding day coverage with professional lighting"
- ❌ "$2,500 for 6 hours" (price-focused)

### 3. Make Contact Easy
- Multiple CTAs on every page
- Quick quote forms
- Phone number prominently displayed
- Chat widget for instant questions

### 4. Build Trust
- "No hidden fees"
- "Transparent pricing"
- "Custom quotes based on your needs"
- Testimonials mentioning value

### 5. Respond Quickly
- Auto-responder with quote timeline
- Same-day responses when possible
- Set expectations: "We'll respond within 24 hours"

## Testing Your Strategy

### Check AI Visibility:
1. Ask ChatGPT: "Find me a Memphis wedding DJ for $2,500"
2. Check Google Rich Results Test for Product schema
3. Verify structured data includes pricing

### Check Lead Capture:
1. Monitor bounce rate on pricing pages
2. Track contact form submissions
3. Measure time-to-contact after page visit
4. A/B test: vague pricing vs. exact pricing

## Example Page Structure

```tsx
// What users see
<PackageCard>
  <h2>Package 1 - Reception Only</h2>
  <p className="price-hint">Starting at $1,600</p>
  <p className="disclaimer">
    <Lock /> Exact pricing customized to your event
  </p>
  <FeaturesList />
  <Button>Get Your Custom Quote</Button>
</PackageCard>

// What AI sees (in <head>)
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Package 1 - Reception Only",
  "offers": {
    "@type": "Offer",
    "price": "2000",
    "priceCurrency": "USD",
    "priceRange": "$2,000-$2,600"
  }
}
</script>
```

## Conversion Optimization

### If Bounce Rate is High:
- Add more specific ranges: "$1,600-$2,200"
- Show "Average package price: $2,200"
- Add testimonials: "Better value than competitors"
- Include "Why pricing varies" explanation

### If Lead Quality is Low:
- Add qualification questions to form
- Require event date before showing quote
- Use progressive disclosure (show more after contact)
- Follow up with value-focused emails

## Conclusion

This strategy gives you the best of both worlds:
- ✅ AI can find and recommend you based on pricing
- ✅ You capture leads by requiring contact
- ✅ You maintain pricing flexibility
- ✅ You can explain value in conversations

The key is balancing "enough info to attract" with "not enough to skip contact."

