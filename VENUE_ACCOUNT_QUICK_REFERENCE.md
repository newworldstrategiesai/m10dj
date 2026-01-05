# 🎪 Venue Account Feature - Quick Reference

## Core Concept

**Venues** (bars, restaurants, clubs) can create accounts and invite **Performers** (DJs, bands, musicians) to set up individual tip pages under the venue's brand.

**URL Structure:**
- `tipjar.live/silkys` → Venue landing page (roster)
- `tipjar.live/silkys/dj1` → DJ1's tip page
- `tipjar.live/silkys/dj2` → DJ2's tip page

---

## 🎯 Key Design Decisions

### 1. Hierarchical Organization Model
- **Parent:** Venue organization (`organization_type = 'venue'`)
- **Children:** Performer organizations (`organization_type = 'performer'`, `parent_organization_id` set)
- **Slug Structure:** Venue has main slug, performers have `performer_slug` unique within venue

### 2. Billing Model: **Venue Pays** ✅
- Venue subscribes to plan (Professional/Enterprise)
- All performers under venue get access automatically
- Simple, centralized billing
- Venue controls budget

### 3. Invitation Flow
- Venue invites via email
- Performer receives invitation link
- Performer signs up/signs in
- Performer organization auto-created with venue as parent
- Performer gets their own tip page at nested URL

### 4. Permissions Model
- **Venue:** Can view aggregated analytics, manage roster, invite/remove performers
- **Performer:** Full control of own tip page, cannot see other performers' data
- **Isolation:** Strict data separation between performers

---

## 📊 Database Changes Summary

### New Columns (organizations table)
```sql
organization_type TEXT ('individual' | 'venue' | 'performer')
parent_organization_id UUID (references organizations)
performer_slug TEXT (unique within parent venue)
is_active BOOLEAN
billing_covered_by_parent BOOLEAN
```

### New Table (venue_invitations)
```sql
- venue_organization_id
- invited_email
- performer_slug
- invitation_token
- status ('pending' | 'accepted' | 'expired' | 'cancelled')
- expires_at
```

---

## 🛣️ Routing Logic

### URL Patterns
1. `/[venue-slug]` → Venue landing page
2. `/[venue-slug]/[performer-slug]` → Performer tip page
3. `/[venue-slug]/[performer-slug]/requests` → Performer requests page

### Middleware Flow
```
1. Extract path parts: [venue-slug, performer-slug, ...]
2. Lookup venue by slug (organization_type = 'venue')
3. Lookup performer by parent_organization_id + performer_slug
4. Route to appropriate page
5. Set organization context headers
```

---

## 🔄 User Flows

### Venue Onboarding
```
Sign Up → Select "I'm a venue" → Choose slug → Complete profile → Dashboard
```

### Invite Performer
```
Venue Dashboard → "Invite Performer" → Enter email/name/slug → Send invitation
```

### Performer Acceptance
```
Receive Email → Click Link → Sign Up/Sign In → Accept Invitation → 
Organization Created → Onboarding → Tip Page Ready
```

---

## 💡 Key Features

### For Venues
- ✅ Roster management (view all performers)
- ✅ Invite performers via email
- ✅ Aggregated analytics (total tips, requests, events)
- ✅ Manage performer slugs
- ✅ Activate/deactivate performers

### For Performers
- ✅ Own tip page at nested URL
- ✅ Full control of profile and settings
- ✅ Own analytics dashboard
- ✅ Venue branding context (optional)
- ✅ Link back to venue roster

### For Public
- ✅ Browse venue roster
- ✅ Visit individual performer pages
- ✅ Tip and request songs
- ✅ See venue context on performer pages

---

## 🚨 Critical Considerations

### Data Isolation
- ✅ Venue accounts are TipJar-only (`product_context = 'tipjar'`)
- ✅ Performers inherit venue's product context
- ✅ No cross-contamination with DJ Dash or M10 DJ Company

### Security
- ✅ RLS policies enforce isolation
- ✅ Venue cannot access individual performer data
- ✅ Performers cannot see each other's data
- ✅ Invitation tokens are secure and time-limited

### Scalability
- ✅ Indexed foreign keys for fast lookups
- ✅ Composite unique constraint for performer slugs
- ✅ Efficient nested routing
- ✅ Cached venue rosters

---

## 📈 Success Metrics

- Number of venue accounts
- Average performers per venue
- Invitation acceptance rate
- Revenue from venue accounts
- Tips per performer (venue vs. individual)

---

## 🎨 UI Highlights

### Venue Dashboard
- Roster list with performer cards
- Quick stats per performer
- "Invite Performer" button
- Aggregated analytics widget

### Performer Page
- Standard tip page layout
- Venue branding header/footer (optional)
- "Performing at [Venue]" context
- Link to venue roster

### Venue Landing Page
- Roster grid/list
- Venue info and branding
- Links to each performer
- Call-to-action for performers to join

---

## 🔮 Future Enhancements

1. **Venue Branding Customization** - Customize all performer pages
2. **Bulk Invitations** - CSV upload for multiple performers
3. **Venue Events** - Shared event QR codes
4. **Revenue Sharing** - Venue gets percentage of tips
5. **Multi-Venue Support** - Performers can belong to multiple venues

---

## ⚡ Quick Implementation Checklist

- [ ] Database migrations (organization_type, parent_organization_id, etc.)
- [ ] Venue invitations table
- [ ] RLS policy updates
- [ ] Middleware routing updates
- [ ] Venue landing page
- [ ] Nested performer pages
- [ ] Invitation API endpoints
- [ ] Email templates
- [ ] Venue dashboard roster management
- [ ] Performer onboarding with venue context
- [ ] Billing integration (venue subscription covers performers)
- [ ] Analytics aggregation
- [ ] Testing & security audit

---

**See `VENUE_ACCOUNT_FEATURE_PLAN.md` for full details.**

