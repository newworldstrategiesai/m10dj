/**
 * Generate Memphis-focused blog posts for DJDash
 * Creates SEO-optimized blog content targeting Memphis market
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BlogPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  seo_title: string;
  seo_description: string;
  featured_image_url?: string;
}

const MEMPHIS_BLOG_POSTS: BlogPost[] = [
  {
    title: 'Complete Guide to Memphis Wedding DJ Prices 2025',
    slug: 'memphis-wedding-dj-prices-2025',
    excerpt: 'Discover current Memphis wedding DJ pricing, what factors affect costs, and how to get the best value for your wedding entertainment budget.',
    category: 'event_planning',
    tags: ['memphis', 'wedding', 'pricing', 'dj', 'cost', 'budget'],
    seo_title: 'Memphis Wedding DJ Prices 2025 | Complete Pricing Guide | DJ Dash',
    seo_description: 'Learn about Memphis wedding DJ prices in 2025. Average costs, pricing factors, and tips for finding the best wedding DJ value in Memphis, Tennessee.',
    content: `# Complete Guide to Memphis Wedding DJ Prices 2025

Planning a wedding in Memphis? One of the most important decisions you'll make is choosing your wedding DJ. But how much should you budget for wedding entertainment in Memphis? This comprehensive guide breaks down Memphis wedding DJ prices for 2025, helping you make an informed decision.

## Average Memphis Wedding DJ Prices

Based on recent data from DJ Dash's Memphis marketplace, here's what you can expect to pay:

### Base Pricing Ranges
- **Budget-Friendly DJs:** $500 - $1,200
- **Mid-Range Professional DJs:** $1,200 - $2,500
- **Premium/Elite DJs:** $2,500 - $5,000+

### What's Typically Included
Most Memphis wedding DJs include in their base price:
- Professional sound system (speakers, microphones, mixer)
- Basic lighting (uplighting, dance floor lighting)
- 4-6 hours of performance time
- Setup and breakdown
- Music library with requests
- MC services (announcements, introductions)

## Factors That Affect Memphis Wedding DJ Prices

### 1. Event Duration
- **4 hours:** Base price
- **6 hours:** +$200-$400
- **8+ hours:** +$400-$800

### 2. Day of the Week
- **Friday/Sunday:** Standard pricing
- **Saturday:** Premium pricing (+$200-$500)
- **Weekday:** Discount pricing (-$200-$400)

### 3. Season
- **Peak Season (April-October):** Higher prices
- **Off-Season (November-March):** Lower prices, more availability

### 4. Venue Location
- **Downtown Memphis:** Standard pricing
- **Suburbs (Germantown, Collierville):** May include travel fees
- **Outdoor venues:** May require additional equipment

### 5. Additional Services
- **Photo booth rental:** +$300-$800
- **Uplighting:** +$200-$600
- **Cold spark machines:** +$400-$1,000
- **Additional speakers for large venues:** +$200-$500

## Popular Memphis Wedding Venues & DJ Considerations

### The Peabody Memphis
- **Capacity:** 200-400 guests
- **DJ Considerations:** Historic venue, may have sound restrictions
- **Typical DJ Cost:** $1,500-$3,000

### Memphis Botanic Garden
- **Capacity:** 150-300 guests
- **DJ Considerations:** Outdoor/indoor options, weather backup needed
- **Typical DJ Cost:** $1,200-$2,500

### Dixon Gallery & Gardens
- **Capacity:** 100-250 guests
- **DJ Considerations:** Elegant setting, may require quieter setup
- **Typical DJ Cost:** $1,000-$2,500

### Woodruff-Fontaine House
- **Capacity:** 80-150 guests
- **DJ Considerations:** Historic mansion, intimate setting
- **Typical DJ Cost:** $800-$2,000

## How to Get the Best Value

### 1. Book Early
Memphis wedding DJs often offer early-bird discounts for bookings 6+ months in advance.

### 2. Consider Off-Peak Dates
Weekday weddings or off-season dates can save you 20-30% on DJ costs.

### 3. Bundle Services
Many Memphis DJs offer package deals when you book multiple services (DJ + photo booth + lighting).

### 4. Read Reviews
Check DJ Dash reviews to find DJs with excellent value ratings in Memphis.

### 5. Compare Multiple DJs
Use DJ Dash to compare pricing, reviews, and portfolios from multiple Memphis DJs.

## What to Ask Your Memphis Wedding DJ

Before booking, ask:
1. What's included in the base price?
2. Are there any additional fees (travel, setup, overtime)?
3. Do you have backup equipment?
4. Can you provide references from Memphis weddings?
5. What's your cancellation policy?

## Conclusion

Memphis wedding DJ prices in 2025 range from $500 to $5,000+, with most couples spending $1,200-$2,500 for professional service. The key is finding a DJ who fits your budget while delivering the quality entertainment your wedding deserves.

**Ready to find your perfect Memphis wedding DJ?** [Browse verified DJs on DJ Dash](https://www.djdash.net/djdash/find-dj/memphis-tn/wedding) and compare prices, reviews, and availability.`
  },
  {
    title: 'Top 15 Memphis Wedding Venues & Their DJ Requirements',
    slug: 'top-memphis-wedding-venues-2025',
    excerpt: 'Discover the best wedding venues in Memphis, Tennessee, and learn about DJ requirements, sound restrictions, and setup considerations for each venue.',
    category: 'venue_spotlight',
    tags: ['memphis', 'wedding', 'venues', 'dj', 'planning'],
    seo_title: 'Top 15 Memphis Wedding Venues 2025 | DJ Requirements Guide | DJ Dash',
    seo_description: 'Explore the best wedding venues in Memphis, Tennessee. Learn about DJ requirements, sound restrictions, and setup considerations for Memphis wedding venues.',
    content: `# Top 15 Memphis Wedding Venues & Their DJ Requirements

Memphis offers a diverse range of wedding venues, from historic mansions to modern event spaces. If you're planning a Memphis wedding, understanding each venue's DJ requirements is crucial for a smooth event. Here's your guide to the top Memphis wedding venues and what DJs need to know.

## Downtown Memphis Venues

### 1. The Peabody Memphis
**Location:** Downtown Memphis  
**Capacity:** 200-400 guests  
**Venue Type:** Historic Hotel Ballroom

**DJ Requirements:**
- Sound system must be approved by venue coordinator
- Music must end by 11:00 PM (strict)
- DJ setup typically in corner or designated area
- Load-in through service entrance
- May require insurance certificate

**Best For:** Elegant, traditional weddings

### 2. Central Station Hotel
**Location:** South Main District  
**Capacity:** 150-300 guests  
**Venue Type:** Modern Hotel with Historic Character

**DJ Requirements:**
- Flexible setup options
- Indoor/outdoor options available
- Sound restrictions: 10:00 PM for outdoor
- Easy load-in access
- Modern AV equipment available

**Best For:** Modern couples wanting downtown vibe

### 3. The Cadre Building
**Location:** Downtown Memphis  
**Capacity:** 100-200 guests  
**Venue Type:** Industrial Event Space

**DJ Requirements:**
- High ceilings, excellent acoustics
- Flexible setup locations
- No strict sound restrictions
- Easy load-in
- Industrial aesthetic

**Best For:** Urban, modern weddings

## Historic Memphis Venues

### 4. Woodruff-Fontaine House
**Location:** Victorian Village  
**Capacity:** 80-150 guests  
**Venue Type:** Historic Mansion

**DJ Requirements:**
- Intimate setting, lower volume preferred
- Setup typically on porch or in garden
- Music must end by 10:00 PM
- Limited space for equipment
- Historic preservation considerations

**Best For:** Intimate, elegant weddings

### 5. Annesdale Mansion
**Location:** Annesdale Park  
**Capacity:** 100-200 guests  
**Venue Type:** Historic Estate

**DJ Requirements:**
- Indoor ballroom and outdoor options
- Sound restrictions: 10:00 PM outdoor, 11:00 PM indoor
- Elegant setting, professional setup required
- Load-in through side entrance

**Best For:** Classic, sophisticated weddings

### 6. The Columns at One Commerce Square
**Location:** Downtown Memphis  
**Capacity:** 150-250 guests  
**Venue Type:** Historic Building

**DJ Requirements:**
- Modern amenities in historic setting
- Flexible setup options
- Sound restrictions: 11:00 PM
- Easy access for load-in

**Best For:** Couples wanting historic charm with modern convenience

## Garden & Outdoor Venues

### 7. Memphis Botanic Garden
**Location:** East Memphis  
**Capacity:** 150-300 guests  
**Venue Type:** Garden & Conservatory

**DJ Requirements:**
- Multiple venue options (indoor/outdoor)
- Weather backup plan required
- Sound restrictions: 10:00 PM outdoor
- Equipment must be weather-protected
- Load-in through service road

**Best For:** Nature-loving couples

### 8. Dixon Gallery & Gardens
**Location:** East Memphis  
**Capacity:** 100-250 guests  
**Venue Type:** Art Gallery & Gardens

**DJ Requirements:**
- Elegant setting, professional setup required
- Indoor and outdoor options
- Sound restrictions: 10:00 PM
- Art preservation considerations
- Limited equipment space

**Best For:** Art and garden enthusiasts

### 9. Avon Acres
**Location:** Memphis Area  
**Capacity:** 200-400 guests  
**Venue Type:** Estate & Gardens

**DJ Requirements:**
- Large outdoor space
- Weather backup essential
- Sound restrictions: 10:00 PM
- Generous setup space
- Easy load-in access

**Best For:** Large outdoor celebrations

## Suburban Memphis Venues

### 10. Heartwood Hall (Germantown)
**Location:** Germantown, TN  
**Capacity:** 150-300 guests  
**Venue Type:** Rustic Barn

**DJ Requirements:**
- Rustic aesthetic
- Flexible setup options
- Sound restrictions: 11:00 PM
- Easy load-in
- Popular for country/rustic weddings

**Best For:** Rustic, country-style weddings

### 11. Cedar Hall (Collierville)
**Location:** Collierville, TN  
**Capacity:** 200-350 guests  
**Venue Type:** Historic Estate

**DJ Requirements:**
- Elegant historic setting
- Indoor and outdoor options
- Sound restrictions: 10:00 PM outdoor
- Professional setup required

**Best For:** Traditional, elegant weddings

### 12. Orion Hill (Collierville)
**Location:** Collierville, TN  
**Capacity:** 150-250 guests  
**Venue Type:** Modern Event Venue

**DJ Requirements:**
- Modern amenities
- Flexible setup
- Sound restrictions: 11:00 PM
- Easy access

**Best For:** Modern couples in suburbs

## Unique Memphis Venues

### 13. Old Dominick Distillery
**Location:** Downtown Memphis  
**Capacity:** 100-200 guests  
**Venue Type:** Distillery Event Space

**DJ Requirements:**
- Industrial aesthetic
- Flexible setup
- Sound restrictions: 11:00 PM
- Unique atmosphere

**Best For:** Couples wanting unique Memphis experience

### 14. Memphis Brooks Museum of Art
**Location:** Overton Park  
**Capacity:** 100-200 guests  
**Venue Type:** Art Museum

**DJ Requirements:**
- Elegant, sophisticated setting
- Lower volume preferred
- Art preservation considerations
- Professional setup required

**Best For:** Art-loving, sophisticated couples

### 15. The Balinese Ballroom
**Location:** Memphis  
**Capacity:** 200-400 guests  
**Venue Type:** Event Ballroom

**DJ Requirements:**
- Large ballroom space
- Flexible setup options
- Sound restrictions: 11:00 PM
- Easy load-in

**Best For:** Large, traditional weddings

## General DJ Requirements for Memphis Venues

### Common Requirements:
1. **Insurance:** Most venues require $1M liability insurance
2. **Setup Time:** Typically 1-2 hours before event
3. **Sound Restrictions:** Most venues require music to end by 10:00-11:00 PM
4. **Load-In:** Usually through service entrances
5. **Equipment:** Professional-grade equipment required

### Questions to Ask Your Venue:
1. What are the sound restrictions?
2. Where can the DJ set up?
3. Is there a preferred vendor list?
4. What's the load-in process?
5. Are there any equipment restrictions?

## Finding the Right DJ for Your Memphis Venue

When choosing a DJ for your Memphis wedding venue, consider:
- **Experience at your venue:** Ask if they've worked there before
- **Equipment:** Ensure they have appropriate equipment for your venue size
- **Flexibility:** Can they adapt to venue requirements?
- **References:** Check reviews from other Memphis weddings

**Ready to find a DJ for your Memphis wedding venue?** [Browse verified Memphis DJs on DJ Dash](https://www.djdash.net/djdash/find-dj/memphis-tn/wedding) and filter by venue experience.`
  },
  {
    title: 'Memphis Corporate Event DJ Guide: What to Expect',
    slug: 'memphis-corporate-event-dj-guide',
    excerpt: 'Everything you need to know about hiring a DJ for corporate events in Memphis. Pricing, requirements, and tips for successful corporate entertainment.',
    category: 'event_planning',
    tags: ['memphis', 'corporate', 'dj', 'events', 'business'],
    seo_title: 'Memphis Corporate Event DJ Guide 2025 | Corporate Entertainment | DJ Dash',
    seo_description: 'Complete guide to hiring a corporate event DJ in Memphis. Learn about pricing, requirements, and best practices for corporate entertainment in Memphis, Tennessee.',
    content: `# Memphis Corporate Event DJ Guide: What to Expect

Corporate events in Memphis require professional entertainment that matches your company's brand and event goals. Whether you're planning a holiday party, company celebration, or client appreciation event, here's everything you need to know about hiring a corporate event DJ in Memphis.

## Types of Corporate Events in Memphis

### Holiday Parties
- **Season:** November-December
- **Typical Duration:** 3-5 hours
- **Common Venues:** Hotels, event spaces, restaurants
- **Music Style:** Mix of current hits and holiday classics

### Company Celebrations
- **Occasions:** Anniversaries, milestones, achievements
- **Typical Duration:** 4-6 hours
- **Common Venues:** Event venues, hotels, unique spaces
- **Music Style:** Upbeat, celebratory

### Client Appreciation Events
- **Purpose:** Thank clients, build relationships
- **Typical Duration:** 2-4 hours
- **Common Venues:** Upscale venues, restaurants
- **Music Style:** Background music, subtle entertainment

### Team Building Events
- **Purpose:** Boost morale, team bonding
- **Typical Duration:** 2-4 hours
- **Common Venues:** Various
- **Music Style:** Energetic, interactive

## Memphis Corporate Event DJ Pricing

### Average Costs
- **Basic Package (2-3 hours):** $800-$1,500
- **Standard Package (4-5 hours):** $1,200-$2,500
- **Premium Package (6+ hours):** $2,000-$4,000

### What's Typically Included
- Professional sound system
- Microphones for speeches
- Basic lighting
- Music library
- MC services
- Setup and breakdown

### Additional Services
- **Uplighting:** +$200-$600
- **Photo booth:** +$300-$800
- **Extended hours:** +$200-$400/hour
- **Multiple locations:** +$200-$500

## Popular Memphis Corporate Event Venues

### Downtown Memphis
- **The Peabody Memphis:** Elegant, professional
- **Central Station Hotel:** Modern, versatile
- **The Cadre Building:** Industrial, unique

### East Memphis
- **Memphis Country Club:** Upscale, traditional
- **The Racquet Club:** Elegant, professional
- **Various hotels:** Convenient, flexible

### Event Spaces
- **Memphis Botanic Garden:** Unique, memorable
- **Dixon Gallery & Gardens:** Sophisticated, artistic

## What to Expect from Your Corporate DJ

### Professionalism
- Arrives early for setup
- Professional appearance
- Clear communication
- Reliable equipment

### Music Selection
- Appropriate for corporate setting
- Mix of current hits and classics
- Can adjust based on crowd
- Respects company culture

### MC Services
- Clear announcements
- Professional speaking voice
- Can handle speeches and presentations
- Manages event timeline

## Questions to Ask Your Corporate DJ

1. **Experience:** Have you worked corporate events before?
2. **References:** Can you provide corporate event references?
3. **Music Policy:** How do you handle requests?
4. **Equipment:** What's included in your package?
5. **Timeline:** Can you work with our event schedule?
6. **Insurance:** Do you have liability insurance?
7. **Backup Plan:** What's your backup equipment policy?

## Tips for Successful Corporate Events

### 1. Book Early
Corporate event dates fill up quickly, especially during holiday season.

### 2. Communicate Your Brand
Share your company culture and brand guidelines with your DJ.

### 3. Provide a Timeline
Give your DJ a detailed event timeline so they can plan accordingly.

### 4. Discuss Music Preferences
Share any must-play or do-not-play songs with your DJ.

### 5. Consider Your Audience
Think about your attendees' demographics and music preferences.

### 6. Plan for Speeches
Coordinate with your DJ for microphone needs during speeches.

## Memphis Corporate Event Best Practices

### Venue Considerations
- Confirm sound restrictions
- Check load-in access
- Verify power requirements
- Understand setup timeframes

### Budget Planning
- Get quotes from multiple DJs
- Understand what's included
- Budget for additional services
- Consider package deals

### Timeline Planning
- Allow 1-2 hours for setup
- Plan for sound check
- Schedule breaks if needed
- Coordinate with other vendors

## Conclusion

Hiring a corporate event DJ in Memphis requires careful planning and clear communication. With the right DJ, your corporate event will be memorable and successful.

**Ready to find a corporate event DJ in Memphis?** [Browse verified corporate DJs on DJ Dash](https://www.djdash.net/djdash/find-dj/memphis-tn/corporate) and compare options for your next corporate event.`
  },
  {
    title: 'Memphis School Dance DJ: Creating Unforgettable Events',
    slug: 'memphis-school-dance-dj-guide',
    excerpt: 'Complete guide to hiring a DJ for school dances in Memphis. Learn about requirements, pricing, and how to create memorable school events.',
    category: 'event_planning',
    tags: ['memphis', 'school', 'dance', 'dj', 'events'],
    seo_title: 'Memphis School Dance DJ Guide | High School Dance DJ | DJ Dash',
    seo_description: 'Everything you need to know about hiring a DJ for school dances in Memphis. Requirements, pricing, and tips for successful school events.',
    content: `# Memphis School Dance DJ: Creating Unforgettable Events

School dances are memorable events for students, and the right DJ can make all the difference. If you're planning a school dance in Memphis, here's your complete guide to hiring the perfect DJ.

## Types of School Dances in Memphis

### Homecoming
- **Season:** Fall (September-October)
- **Typical Duration:** 3-4 hours
- **Music Style:** Current hits, school spirit songs
- **Special Considerations:** School colors, theme integration

### Prom
- **Season:** Spring (April-May)
- **Typical Duration:** 4-5 hours
- **Music Style:** Current hits, slow songs, classics
- **Special Considerations:** Formal event, elegant atmosphere

### Winter Formal
- **Season:** Winter (December-February)
- **Typical Duration:** 3-4 hours
- **Music Style:** Mix of current and classic hits
- **Special Considerations:** Holiday themes possible

### Sadie Hawkins / Other Dances
- **Season:** Varies
- **Typical Duration:** 2-3 hours
- **Music Style:** Fun, upbeat
- **Special Considerations:** Theme-based

## Popular Memphis High Schools

### Public Schools
- **White Station High School**
- **Houston High School**
- **Collierville High School**
- **Germantown High School**
- **Bartlett High School**
- **Cordova High School**

### Private Schools
- **Memphis University School**
- **St. Mary's Episcopal School**
- **Hutchison School**
- **Lausanne Collegiate School**

## Memphis School Dance DJ Pricing

### Average Costs
- **Basic Package (2-3 hours):** $600-$1,200
- **Standard Package (3-4 hours):** $800-$1,500
- **Premium Package (4-5 hours):** $1,200-$2,500

### What's Typically Included
- Professional sound system
- Microphones for announcements
- Basic lighting
- Music library (age-appropriate)
- MC services
- Setup and breakdown

### Additional Services
- **Enhanced lighting:** +$200-$500
- **Photo booth:** +$300-$600
- **Fog machine:** +$100-$200
- **Extended hours:** +$150-$300/hour

## School-Specific Requirements

### Music Guidelines
- **Age-Appropriate:** All music must be school-appropriate
- **No Explicit Content:** DJs must screen all songs
- **Request Policy:** Students can request songs (subject to approval)
- **Volume Control:** Must respect school noise policies

### Equipment Requirements
- **Professional Sound System:** Appropriate for gym/auditorium size
- **Microphones:** For announcements and student speeches
- **Lighting:** Basic lighting included, enhanced available
- **Backup Equipment:** Professional DJs have backup systems

### Setup Considerations
- **Early Setup:** Usually 1-2 hours before event
- **Sound Check:** Required before students arrive
- **School Policies:** Must comply with all school rules
- **Supervision:** DJ works with school staff

## Questions to Ask Your School Dance DJ

1. **Experience:** Have you worked school dances before?
2. **References:** Can you provide school references?
3. **Music Policy:** How do you handle song requests?
4. **Age-Appropriate:** How do you ensure appropriate music?
5. **Equipment:** What's included in your package?
6. **Insurance:** Do you have liability insurance?
7. **Setup Time:** How early can you arrive?

## Tips for Successful School Dances

### 1. Book Early
Popular DJs book up quickly during prom/homecoming season.

### 2. Communicate School Policies
Share your school's music and behavior policies with your DJ.

### 3. Provide Student Input
Get song requests from students (subject to approval).

### 4. Plan the Timeline
Work with your DJ to plan announcements, special moments, etc.

### 5. Consider Themes
If your dance has a theme, discuss how the DJ can support it.

### 6. Test Equipment
Ensure sound check happens before students arrive.

## Memphis School Dance Best Practices

### Venue Considerations
- **Gymnasiums:** Large space, may need additional speakers
- **Auditoriums:** Better acoustics, may have sound systems
- **Event Spaces:** Professional setup, flexible options

### Budget Planning
- Get quotes from multiple DJs
- Understand what's included
- Budget for additional services if desired
- Consider package deals

### Student Engagement
- Allow song requests (with approval)
- Plan interactive moments
- Consider student DJ contests
- Include school spirit elements

## Conclusion

A great school dance DJ can make your event unforgettable for students. With proper planning and the right DJ, your Memphis school dance will be a success.

**Ready to find a school dance DJ in Memphis?** [Browse verified school dance DJs on DJ Dash](https://www.djdash.net/djdash/find-dj/memphis-tn/school-dance) and compare options for your next school event.`
  }
];

async function createBlogPost(post: BlogPost) {
  console.log(`\n📝 Creating blog post: ${post.title}...`);

  // Check if post already exists
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', post.slug)
    .maybeSingle();

  if (existing) {
    console.log(`  ⚠️  Blog post already exists, updating...`);
    const { data, error } = await supabase
      .from('blog_posts')
      .update({
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        seo_title: post.seo_title,
        seo_description: post.seo_description,
        featured_image_url: post.featured_image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Error updating blog post:`, error);
      return { success: false, error };
    }

    console.log(`  ✅ Blog post updated: ${data.id}`);
    return { success: true, data };
  } else {
    console.log(`  ➕ Creating new blog post...`);
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        seo_title: post.seo_title,
        seo_description: post.seo_description,
        featured_image_url: post.featured_image_url,
        is_published: true,
        published_at: new Date().toISOString(),
        author: 'DJ Dash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Error creating blog post:`, error);
      return { success: false, error };
    }

    console.log(`  ✅ Blog post created: ${data.id}`);
    return { success: true, data };
  }
}

async function main() {
  console.log('🚀 Generating Memphis blog posts for DJDash...\n');
  console.log(`📊 Total posts to create: ${MEMPHIS_BLOG_POSTS.length}\n`);

  const results = [];
  for (const post of MEMPHIS_BLOG_POSTS) {
    const result = await createBlogPost(post);
    results.push({ post: post.title, ...result });
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 BLOG POST GENERATION SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successfully created/updated: ${successful}/${MEMPHIS_BLOG_POSTS.length}`);
  console.log(`❌ Failed: ${failed}/${MEMPHIS_BLOG_POSTS.length}`);

  if (successful > 0) {
    console.log('\n✅ Created/Updated Posts:');
    results
      .filter(r => r.success)
      .forEach(r => console.log(`   - ${r.post}`));
  }

  if (failed > 0) {
    console.log('\n❌ Failed Posts:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`   - ${r.post}: ${r.error?.message || 'Unknown error'}`));
  }

  console.log('\n🌐 View blog posts at: /blog/[slug]');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

