# 🎯 Onboarding Strategy: URL Structure & Embed Options

## Overview

DJs need multiple ways to share their request pages:
1. **Dedicated hosted URL** (subdomain or path-based)
2. **Embed code** for their own website
3. **QR codes** for events

---

## URL Structure Options

### Option 1: Subdomain-Based (Recommended for Enterprise)

**Format**: `{organization-slug}.yourplatform.com`

**Examples**:
- `m10dj.yourplatform.com/requests` - Public requests page
- `m10dj.yourplatform.com/event/wedding-2025-01-15` - Event-specific page
- `m10dj.yourplatform.com/admin` - Admin dashboard

**Pros**:
- ✅ Professional, branded experience
- ✅ Easy to remember
- ✅ White-label feel (Enterprise tier)
- ✅ SEO benefits (separate domain)

**Cons**:
- ❌ Requires DNS configuration
- ❌ More complex setup
- ❌ SSL certificate management

**Implementation**:
- Use Next.js middleware to detect subdomain
- Route to appropriate organization
- Enterprise tier only (or Professional+)

---

### Option 2: Path-Based (Recommended for Starter/Professional)

**Format**: `yourplatform.com/{organization-slug}/...`

**Examples**:
- `yourplatform.com/m10dj/requests` - Public requests page
- `yourplatform.com/m10dj/event/wedding-2025-01-15` - Event-specific page
- `yourplatform.com/m10dj/admin` - Admin dashboard

**Pros**:
- ✅ Simple to implement
- ✅ No DNS configuration needed
- ✅ Works immediately
- ✅ Easy to share

**Cons**:
- ❌ Less "white-label" feel
- ❌ Shows your platform name in URL

**Implementation**:
- Use Next.js dynamic routes: `/[slug]/requests`
- Lookup organization by slug
- Available for all tiers

---

### Option 3: Custom Domain (Enterprise Only)

**Format**: `requests.djname.com` (CNAME to your platform)

**Examples**:
- `requests.m10djcompany.com` - Fully branded
- `songrequests.djname.com` - Custom subdomain

**Pros**:
- ✅ Fully white-labeled
- ✅ Maximum professionalism
- ✅ Best for established DJ companies

**Cons**:
- ❌ Requires DNS knowledge
- ❌ SSL certificate setup
- ❌ More support needed

**Implementation**:
- Store custom domain in `organization_branding` table
- Use Next.js middleware to detect custom domain
- Enterprise tier only

---

## Recommended Approach: Hybrid

### Starter & Professional Tiers
- **Path-based URLs**: `yourplatform.com/{slug}/requests`
- **Embed code**: Full iframe embed
- **QR codes**: Link to path-based URL

### Enterprise Tier
- **Subdomain URLs**: `{slug}.yourplatform.com/requests` (optional)
- **Custom domain**: `requests.djname.com` (optional)
- **Embed code**: Full iframe embed
- **QR codes**: Link to preferred URL

---

## Embed Code Implementation

### Basic Embed (All Tiers)

```html
<!-- DJ adds this to their website -->
<iframe 
  src="https://yourplatform.com/m10dj/requests/embed"
  width="100%" 
  height="800" 
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
></iframe>
```

### Responsive Embed (Recommended)

```html
<div style="position: relative; padding-bottom: 100%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe 
    src="https://yourplatform.com/m10dj/requests/embed"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allowfullscreen
  ></iframe>
</div>
```

### Customizable Embed (Enterprise)

```html
<!-- DJ can customize colors, height, etc. -->
<iframe 
  src="https://yourplatform.com/m10dj/requests/embed?theme=dark&height=600"
  width="100%" 
  height="600" 
  frameborder="0"
></iframe>
```

---

## Onboarding Flow

### Step 1: Sign Up
- Email/password or social login
- Basic info (name, business name)

### Step 2: Create Organization
- Business name → auto-generate slug
- Choose subscription tier
- 14-day free trial starts

### Step 3: Get Your URLs & Embed Code
- Show dedicated URL: `yourplatform.com/{slug}/requests`
- Show embed code (copy-paste ready)
- Show QR code generator
- Quick setup guide

### Step 4: First Event Setup (Optional)
- Create first event
- Generate event-specific QR code
- Test the flow

---

## Onboarding Page Design

### After Sign Up → Organization Created

```
┌─────────────────────────────────────────┐
│  🎉 Welcome to [Platform Name]!          │
│                                           │
│  Your DJ business is ready to go!        │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ Your Request Page URL            │    │
│  │                                  │    │
│  │ yourplatform.com/m10dj/requests │    │
│  │                                  │    │
│  │ [Copy URL] [Test Link]          │    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ Embed Code for Your Website      │    │
│  │                                  │    │
│  │ <iframe src="..."></iframe>     │    │
│  │                                  │    │
│  │ [Copy Code] [Preview]            │    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ Quick Actions                   │    │
│  │                                  │    │
│  │ [Create First Event]            │    │
│  │ [Generate QR Code]              │    │
│  │ [Customize Settings]            │    │
│  └─────────────────────────────────┘    │
│                                           │
│  [Skip for Now] [Continue Setup]         │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### 1. Path-Based Routing

**File Structure**:
```
pages/
  [slug]/
    requests.js          # Public requests page
    event/
      [code].js          # Event-specific page
    admin/               # Admin dashboard
    embed/
      requests.js        # Embed version (no header/footer)
```

**Middleware** (detect organization from slug):
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const slugMatch = path.match(/^\/([^\/]+)/);
  
  if (slugMatch) {
    const slug = slugMatch[1];
    // Lookup organization by slug
    // Add to request headers for use in pages
  }
}
```

### 2. Embed Page

**Features**:
- No header/footer
- Minimal styling
- Responsive design
- Works in iframe
- Customizable via query params

**URL**: `/[slug]/embed/requests?theme=dark&height=600`

### 3. Organization Settings

**Store in database**:
- Preferred URL format (path vs subdomain)
- Custom domain (Enterprise)
- Embed preferences (theme, height)
- Branding (logo, colors)

---

## User Experience Flow

### Scenario 1: DJ Adds to Website

1. DJ signs up → Gets embed code
2. DJ copies embed code
3. DJ pastes into their website (WordPress, Wix, etc.)
4. Requests page appears on their site
5. Visitors can request songs directly

### Scenario 2: DJ Uses QR Code at Event

1. DJ creates event in admin dashboard
2. DJ generates QR code for event
3. DJ prints QR code or displays on screen
4. Event attendees scan QR code
5. Opens event-specific request page
6. Attendees request songs/shoutouts

### Scenario 3: DJ Shares Link

1. DJ gets dedicated URL: `yourplatform.com/m10dj/requests`
2. DJ shares on social media, email, etc.
3. People click link → Request page opens
4. Works on mobile and desktop

---

## Embed Code Generator UI

### In Admin Dashboard

```
┌─────────────────────────────────────────┐
│  Embed Code                              │
│                                           │
│  Add this to your website:               │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ <iframe src="..."               │    │
│  │   width="100%"                  │    │
│  │   height="800"                  │    │
│  │   frameborder="0">              │    │
│  │ </iframe>                        │    │
│  └─────────────────────────────────┘    │
│                                           │
│  [Copy Code] [Preview] [Customize]       │
│                                           │
│  Options:                                 │
│  ☐ Remove header/footer                  │
│  ☐ Dark theme                            │
│  ☐ Custom height: [800] px              │
│  ☐ Auto-resize                           │
└─────────────────────────────────────────┘
```

---

## Benefits of Embed Approach

### For DJs
- ✅ **No coding required** - Just copy/paste
- ✅ **Works on any website** - WordPress, Wix, Squarespace, custom
- ✅ **Maintains their branding** - Appears as part of their site
- ✅ **Mobile responsive** - Works on all devices
- ✅ **Easy to update** - Changes reflect automatically

### For You (Platform)
- ✅ **Lower barrier to entry** - Easy onboarding
- ✅ **Higher adoption** - DJs can use immediately
- ✅ **Viral potential** - DJs share on their sites
- ✅ **SEO benefits** - More exposure
- ✅ **Reduced support** - Self-service setup

---

## Implementation Priority

### Phase 1: MVP (Week 1-2)
- [x] Path-based URLs: `/[slug]/requests`
- [ ] Basic embed page (no header/footer)
- [ ] Embed code generator in admin
- [ ] Copy-to-clipboard functionality

### Phase 2: Enhanced (Week 3-4)
- [ ] Embed customization (theme, height)
- [ ] Responsive embed wrapper
- [ ] Preview functionality
- [ ] QR code generation with embed URL

### Phase 3: Advanced (Month 2)
- [ ] Subdomain support (Enterprise)
- [ ] Custom domain support (Enterprise)
- [ ] White-label embed (remove branding)
- [ ] Analytics for embed usage

---

## Example Embed Codes by Tier

### Starter/Professional
```html
<!-- Standard embed with platform branding -->
<iframe 
  src="https://yourplatform.com/m10dj/requests/embed"
  width="100%" 
  height="800" 
  frameborder="0"
></iframe>
```

### Enterprise (White-Label)
```html
<!-- No branding, fully customizable -->
<iframe 
  src="https://m10dj.yourplatform.com/requests/embed?whiteLabel=true"
  width="100%" 
  height="800" 
  frameborder="0"
  style="border: none;"
></iframe>
```

---

## Security Considerations

### Embed Security
- ✅ **X-Frame-Options**: Allow embedding from any origin (or whitelist)
- ✅ **CSP Headers**: Configure for iframe embedding
- ✅ **CORS**: Allow cross-origin requests if needed
- ✅ **Rate Limiting**: Prevent abuse

### URL Security
- ✅ **Slug validation**: Prevent malicious slugs
- ✅ **Organization verification**: Ensure slug belongs to org
- ✅ **Rate limiting**: Prevent URL enumeration
- ✅ **Access control**: Verify subscription status

---

## Next Steps

1. **Implement path-based routing** (`/[slug]/requests`)
2. **Create embed page** (minimal version)
3. **Build embed code generator** in admin dashboard
4. **Add to onboarding flow** (show URLs/embed after signup)
5. **Test with real DJs** (get feedback)

---

## Success Metrics

- **Time to first request**: < 10 minutes from signup
- **Embed adoption rate**: % of DJs using embed vs direct link
- **Website integration rate**: % of DJs who add to their site
- **Support tickets**: Should be minimal (self-service)

---

This approach gives DJs maximum flexibility while keeping implementation simple. The embed code is the key differentiator - most competitors don't offer this!

