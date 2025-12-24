# 🎯 Event Structured Data Strategy
## Should We Create Event Pages for Past Events?

---

## ⚠️ **IMPORTANT: Google's Guidelines**

### **Key Restriction:**
> **"Events must be bookable to the general public."**

Google's Event structured data is designed for **UPCOMING, BOOKABLE EVENTS**, not past events.

### **What Google Says:**
- Events must be "bookable to the general public"
- Event experience is for discovering and attending events
- Past events don't qualify

---

## ❌ **Why Past Events DON'T Work**

### **1. Violates Google Guidelines:**
- Past events aren't "bookable"
- Would need to mark as `EventCancelled` or use past dates
- Google specifically says: "Don't mark non-events as events"

### **2. Not the Right Use Case:**
- Event structured data is for ticket sales and discovery
- Past events can't be discovered or attended
- Would confuse users and Google

### **3. Risk of Manual Action:**
- Google may see this as spammy structured markup
- Could result in manual action penalty
- Not worth the risk

---

## ✅ **BETTER ALTERNATIVES for Past Events**

### **Option 1: Case Study / Success Story Pages** (RECOMMENDED)
**Best for:** Showcasing past events, demonstrating expertise

**Schema to Use:**
- `Article` or `BlogPosting` schema
- `Review` schema (client testimonials)
- `LocalBusiness` with venue-specific content

**Example Structure:**
```
/events/sarah-michael-peabody-wedding-2024
- Article schema
- Review from couple
- Venue-specific details
- Photos (with permission)
- What made it special
```

**Benefits:**
- ✅ Shows real experience and expertise
- ✅ Demonstrates E-E-A-T
- ✅ Helps with venue-specific SEO
- ✅ No guideline violations
- ✅ Can link to venue pages

---

### **Option 2: Venue Experience Pages**
**Best for:** Showing expertise at specific venues

**Schema to Use:**
- `LocalBusiness` (your business)
- `Place` (the venue)
- `Review` (testimonials from that venue)

**Example Structure:**
```
/venues/peabody-hotel-experience
- How many events at The Peabody
- Specific challenges/solutions
- Client testimonials
- Photos (with permission)
- What makes this venue special
```

**Benefits:**
- ✅ Targets venue-specific searches
- ✅ Shows deep expertise
- ✅ Multiple events = more credibility
- ✅ No guideline violations

---

### **Option 3: Event Gallery / Portfolio Pages**
**Best for:** Visual showcase of past work

**Schema to Use:**
- `ImageGallery` or `CollectionPage`
- `LocalBusiness` schema
- Individual `ImageObject` schemas

**Benefits:**
- ✅ Visual proof of experience
- ✅ Can organize by venue/event type
- ✅ No guideline violations

---

## ✅ **When Event Structured Data IS Appropriate**

### **For UPCOMING Events:**
If you have **future, bookable events**, Event structured data is perfect:

**Examples:**
- Upcoming public DJ performances
- Festival appearances
- Club residencies
- Public events you're DJing

**Required Properties:**
- `name` - Event name
- `startDate` - Future date/time
- `location` - Venue with full address
- `offers` - Ticket purchase URL (if applicable)

**Example:**
```json
{
  "@type": "Event",
  "name": "Mempho Music Festival 2025",
  "startDate": "2025-09-15T19:00:00-05:00",
  "endDate": "2025-09-15T23:00:00-05:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "location": {
    "@type": "Place",
    "name": "Mempho Music Festival Grounds",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Music Lane",
      "addressLocality": "Memphis",
      "addressRegion": "TN",
      "postalCode": "38103",
      "addressCountry": "US"
    }
  },
  "performer": {
    "@type": "Person",
    "name": "DJ Ben Murray"
  },
  "organizer": {
    "@type": "Organization",
    "name": "M10 DJ Company",
    "url": "https://www.m10djcompany.com"
  }
}
```

---

## 🎯 **RECOMMENDED STRATEGY**

### **For Past Events:**
1. **Create Case Study Pages** (Article schema)
   - `/events/[venue]-[couple-name]-[year]`
   - Real stories, photos, testimonials
   - Link to venue pages
   - Demonstrates expertise

2. **Enhance Venue Pages** (LocalBusiness + Place schema)
   - Add "Our Experience at [Venue]" sections
   - Include number of events
   - Client testimonials
   - Specific challenges/solutions

3. **Create Event Type Pages** (Article/BlogPosting)
   - "Memphis Outdoor Wedding DJ Guide"
   - "The Peabody Hotel Wedding Experience"
   - Real examples from past events

### **For Future Events:**
1. **Use Event Structured Data** ✅
   - Public performances
   - Festival appearances
   - Club residencies
   - Any bookable, upcoming events

---

## 📊 **SEO Benefits of Case Study Approach**

### **Better Than Event Schema for Past Events:**
- ✅ No guideline violations
- ✅ Demonstrates E-E-A-T (real experience)
- ✅ Can target long-tail keywords
- ✅ Shows venue-specific expertise
- ✅ Builds trust with real examples
- ✅ Can be linked from venue pages

### **Example Keywords You Could Target:**
- "Peabody Hotel wedding DJ experience"
- "Memphis Botanic Garden wedding DJ"
- "Graceland wedding DJ reviews"
- "[Venue] wedding DJ case study"

---

## 🚀 **Implementation Plan**

### **Phase 1: Create Case Study Template**
1. Create `/events/[slug]` page structure
2. Use Article schema (not Event)
3. Include:
   - Venue name and details
   - Couple names (with permission)
   - Event date
   - What made it special
   - Client testimonial
   - Photos (with permission)

### **Phase 2: Create Top 10 Case Studies**
1. Pick 10 most impressive/unique events
2. Focus on different venues
3. Get client permission for photos/testimonials
4. Write authentic, helpful content

### **Phase 3: Link Strategy**
1. Link case studies from venue pages
2. Link from service pages
3. Add to sitemap
4. Internal linking for SEO

---

## ✅ **Final Recommendation**

**DON'T use Event structured data for past events** - it violates Google's guidelines.

**DO create case study/success story pages** using Article schema:
- ✅ Shows real expertise
- ✅ Demonstrates E-E-A-T
- ✅ Helps with venue-specific SEO
- ✅ No guideline violations
- ✅ More valuable for users

**DO use Event structured data for future, bookable events** like:
- Public DJ performances
- Festival appearances
- Club residencies

---

## 📝 **Next Steps**

Would you like me to:
1. Create a case study page template?
2. Help identify which past events to feature?
3. Set up Article schema for case studies?
4. Create venue experience pages instead?

