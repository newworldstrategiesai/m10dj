# 🎯 Prospect Request Page Creation - Full Implementation Plan

## Executive Summary

**Goal**: Enable super admin to create a public request page for any prospect (from leads/contacts) and send them an email with:
- Link to their public requests page
- QR code for their page
- Link to create account and claim their page

**Current State**: TipJar has this functionality, but it's:
- Product-specific (TipJar only)
- Only for new prospects (not existing leads/contacts)
- Requires manual prospect entry

**Needed**: Universal system that works across all products (DJDash, M10DJ, TipJar) and integrates with existing CRM (leads/contacts).

---

## 1. Feature Summary

### Core Functionality
- **Super Admin Interface**: Select existing prospect from leads/contacts database
- **Request Page Creation**: Automatically create organization with public requests page
- **Email Delivery**: Send prospect email with QR code, page link, and claim link
- **Cross-Product Support**: Works for DJDash, M10DJ, and TipJar
- **Account Claiming**: Prospect can claim page later via secure token

### User Flow
1. Super admin navigates to `/admin/prospects/create-request-page`
2. Searches/selects prospect from leads or contacts
3. Fills in required fields (business name, email, product context)
4. System creates unclaimed organization with request page
5. Generates QR code, claim token, and email
6. Sends email to prospect (or shows preview first)
7. Prospect receives email, can view page immediately
8. Prospect claims page later by creating account

---

## 2. Affected Products

### Primary Impact
- **DJDash** (`djdash.net`): Create request pages for leads from marketplace
- **M10DJ** (`m10djcompany.com`): Create request pages for contacts/clients
- **TipJar** (`tipjar.live`): Extend existing batch creation to individual prospects

### Shared Infrastructure
- **Organizations Table**: Stores unclaimed organizations
- **Email System**: Sends prospect welcome emails
- **Request Pages**: Public pages at `/{slug}/requests`
- **Claim Flow**: Token-based account claiming

---

## 3. Database Changes

### No Schema Changes Required ✅
The existing schema already supports this:
- `organizations` table has:
  - `claim_token` (TEXT, UNIQUE)
  - `claim_token_expires_at` (TIMESTAMP)
  - `prospect_email` (TEXT)
  - `is_claimed` (BOOLEAN)
  - `owner_id` (UUID, NULLABLE)
  - `product_context` (TEXT)
  - `slug` (TEXT, UNIQUE)

### Data Flow
```
leads/contacts → prospect selection → organization creation (unclaimed) → email → claim flow
```

---

## 4. API Changes

### New Endpoint: `/api/admin/prospects/create-request-page`

**POST** `/api/admin/prospects/create-request-page`

**Request Body:**
```json
{
  "prospect_id": "uuid",           // Optional: ID from leads/contacts table
  "prospect_type": "lead|contact",  // Optional: Which table to query
  "email": "prospect@example.com",  // Required: Prospect email
  "business_name": "Business Name", // Required: Business/artist name
  "artist_name": "Artist Name",     // Optional: Display name
  "phone": "+1234567890",          // Optional: Phone number
  "slug": "custom-slug",           // Optional: Custom slug (auto-generated if not provided)
  "product_context": "tipjar|djdash|m10dj", // Required: Which product
  "send_email": true,              // Optional: Send email immediately (default: false)
  "configuration": {               // Optional: Custom page configuration
    "requests_header_artist_name": "Display Name",
    "requests_header_location": "Location",
    "requests_header_date": "Event Date",
    "accent_color": "#9333ea"
  }
}
```

**Response:**
```json
{
  "success": true,
  "organization": {
    "id": "uuid",
    "slug": "business-slug",
    "name": "Business Name",
    "product_context": "tipjar",
    "is_claimed": false,
    "claim_token": "secure-token",
    "claim_token_expires_at": "2025-04-01T00:00:00Z"
  },
  "urls": {
    "page_url": "https://tipjar.live/business-slug/requests",
    "claim_url": "https://tipjar.live/claim?token=secure-token",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=..."
  },
  "email": {
    "sent": true,
    "preview_available": true
  }
}
```

### New Endpoint: `/api/admin/prospects/get-prospect`

**GET** `/api/admin/prospects/get-prospect?email=prospect@example.com&type=lead|contact`

Fetches prospect data from leads or contacts table for pre-populating form.

---

## 5. Frontend Changes

### New Admin Page: `/admin/prospects/create-request-page`

**Location**: `pages/admin/prospects/create-request-page.tsx`

**Features**:
1. **Prospect Selection**:
   - Search leads/contacts by email, name, phone
   - Display prospect details (event date, venue, etc.)
   - Pre-fill form from prospect data

2. **Form Fields**:
   - Email (required, from prospect)
   - Business Name (required)
   - Artist Name (optional)
   - Phone (optional)
   - Product Context (dropdown: TipJar, DJDash, M10DJ)
   - Custom Slug (optional, auto-generated)
   - Page Configuration (optional):
     - Header Artist Name
     - Header Location
     - Header Date
     - Accent Color

3. **Actions**:
   - Preview Email (before sending)
   - Create Page (without sending email)
   - Create & Send Email
   - Generate QR Code

4. **Results Display**:
   - Show created organization details
   - Display QR code
   - Show page URL and claim URL
   - Copy links buttons
   - View page button

### Navigation Integration

Add to `components/admin/AdminNavbar.tsx`:
```typescript
{
  label: 'Prospects',
  items: [
    { 
      label: 'Create Request Page', 
      href: '/admin/prospects/create-request-page', 
      icon: <PlusCircle className="w-4 h-4" />, 
      description: 'Create page for prospect',
      adminOnly: true // Super admin only
    },
  ]
}
```

### Email Preview Component

Reuse/modify existing email preview from TipJar batch creation:
- Extract `EmailPreviewModal` component
- Make it product-agnostic
- Support all product contexts

---

## 6. Email System Changes

### Update Email Templates

**File**: `lib/email/prospect-welcome-email.ts` (new, extracted from TipJar)

Make email templates product-agnostic:
- Support all product contexts (tipjar, djdash, m10dj)
- Dynamic product branding
- QR code embedding
- Claim link generation

**Email Includes**:
1. Welcome message with product name
2. QR code image (embedded or linked)
3. Public page URL (clickable button)
4. Claim account link (clickable button)
5. Instructions for next steps

### Product-Specific Email Configuration

Use existing `lib/email/product-email-config.ts`:
- `getProductBaseUrl(productContext)` - Get base URL for product
- `getProductFromEmail(productContext)` - Get from email address
- `getProductName(productContext)` - Get product display name

---

## 7. QR Code Generation

### Existing Implementation ✅
- API endpoint: `/api/qr-code/generate` (already exists)
- External service: `api.qrserver.com`
- Alternative: Can use `qrcode` library server-side

### Usage
```typescript
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pageUrl)}`;
```

### Enhancement (Optional)
- Store QR codes in Supabase Storage
- Generate branded QR codes with logo
- Track QR code scans

---

## 8. Claim Flow Integration

### Existing Claim System ✅
- Endpoint: `/api/tipjar/claim` (needs to be product-agnostic)
- Claim page: `/tipjar/claim` (needs product routing)
- Token verification: Already implemented

### Updates Needed

1. **Make Claim Endpoint Product-Agnostic**:
   - Rename `/api/tipjar/claim` → `/api/organizations/claim`
   - Determine product context from organization
   - Route to appropriate onboarding flow

2. **Product-Specific Claim Pages**:
   - `/tipjar/claim` (existing)
   - `/djdash/claim` (new)
   - `/m10dj/claim` (new)
   - Or unified: `/claim?product=tipjar&token=xxx`

3. **Onboarding Redirects**:
   - TipJar: `/tipjar/onboarding?claimed=true`
   - DJDash: `/djdash/onboarding?claimed=true`
   - M10DJ: `/admin/dashboard` (if already in system)

---

## 9. Cross-Product Risks & Mitigation

### Risk 1: Data Isolation
**Issue**: Prospect from DJDash might get TipJar organization
**Mitigation**: 
- Require explicit `product_context` selection
- Validate prospect exists in correct product context
- Add confirmation dialog

### Risk 2: Duplicate Organizations
**Issue**: Creating multiple request pages for same prospect
**Mitigation**:
- Check for existing unclaimed organizations by email + product_context
- Warn admin if prospect already has page
- Allow regenerating claim token for existing page

### Risk 3: Email Deliverability
**Issue**: Emails might not reach prospect
**Mitigation**:
- Validate email format
- Use product-specific email providers (Mailgun for TipJar, Resend for others)
- Show email preview before sending
- Log email delivery status

### Risk 4: Claim Token Security
**Issue**: Tokens might be compromised
**Mitigation**:
- Use secure token generation (HMAC)
- Set expiration (90 days)
- Verify email matches when claiming
- Rate limit claim attempts

### Risk 5: Public Page Access
**Issue**: Unclaimed pages should be publicly accessible
**Mitigation**:
- Ensure `/[slug]/requests` works for unclaimed orgs
- Only require authentication for admin features
- Handle unclaimed org state gracefully

---

## 10. Edge Cases

### Edge Case 1: Prospect Already Has Account
**Scenario**: Prospect email already exists in auth.users
**Handling**:
- Check for existing user account
- If exists, link organization to existing account
- If not, create new account on claim

### Edge Case 2: Prospect Has Existing Organization
**Scenario**: Prospect already owns a claimed organization
**Handling**:
- Warn admin: "Prospect already has an organization"
- Option to create additional organization
- Or regenerate claim token for existing org

### Edge Case 3: Slug Conflict
**Scenario**: Generated slug already exists
**Handling**:
- Use existing `ensureUniqueSlug()` function
- Append counter: `slug-1`, `slug-2`
- Fallback to timestamp-based slug

### Edge Case 4: Invalid Product Context
**Scenario**: Invalid or missing product_context
**Handling**:
- Validate product_context against allowed values
- Default to prospect's source product (if from lead/contact)
- Show error if cannot determine product

### Edge Case 5: Email Send Failure
**Scenario**: Email fails to send
**Handling**:
- Organization still created
- Log error but don't fail request
- Show "Email failed" warning with retry option
- Allow manual email resend

---

## 11. Implementation Steps

### Phase 1: Backend API (Priority: High)
1. ✅ Create `/api/admin/prospects/create-request-page` endpoint
2. ✅ Create `/api/admin/prospects/get-prospect` endpoint
3. ✅ Extract and generalize email template system
4. ✅ Make claim endpoint product-agnostic
5. ✅ Add product context validation

### Phase 2: Frontend UI (Priority: High)
1. ✅ Create `/admin/prospects/create-request-page` page
2. ✅ Build prospect search/selection component
3. ✅ Create form with validation
4. ✅ Add email preview modal
5. ✅ Build results display with QR code
6. ✅ Add navigation menu item

### Phase 3: Email System (Priority: Medium)
1. ✅ Extract email templates to shared module
2. ✅ Support all product contexts
3. ✅ Test email delivery across products
4. ✅ Add email preview functionality

### Phase 4: Claim Flow (Priority: Medium)
1. ✅ Make claim endpoint product-agnostic
2. ✅ Create product-specific claim pages (or unified)
3. ✅ Update onboarding redirects
4. ✅ Test full claim flow

### Phase 5: Testing & Polish (Priority: Low)
1. ✅ Test across all products
2. ✅ Handle edge cases
3. ✅ Add loading states and error handling
4. ✅ Add success notifications
5. ✅ Documentation and user guide

---

## 12. Files to Create/Modify

### New Files
```
pages/admin/prospects/create-request-page.tsx    # Main admin page
pages/api/admin/prospects/create-request-page.js # API endpoint
pages/api/admin/prospects/get-prospect.js        # Prospect lookup API
lib/email/prospect-welcome-email.ts              # Shared email templates
components/admin/ProspectSearch.tsx              # Prospect search component
components/admin/EmailPreviewModal.tsx           # Email preview component
```

### Modified Files
```
pages/api/tipjar/claim.js                        # Make product-agnostic
pages/api/organizations/claim.js                 # New unified claim endpoint (or rename)
lib/email/tipjar-batch-emails.ts                 # Extract shared email logic
components/admin/AdminNavbar.tsx                 # Add navigation item
lib/email/product-email-config.ts                # Ensure all products supported
```

### Database Migrations
```
# None required - existing schema supports this
```

---

## 13. Testing Strategy

### Unit Tests
- Token generation/verification
- Slug uniqueness
- Email template generation
- Product context validation

### Integration Tests
- Full flow: Create page → Send email → Claim account
- Cross-product isolation
- Email delivery across products
- QR code generation

### Manual Testing
- Create page for TipJar prospect
- Create page for DJDash lead
- Create page for M10DJ contact
- Test email delivery
- Test claim flow
- Test duplicate prevention
- Test edge cases

---

## 14. Security Considerations

### Access Control
- ✅ Super admin only (use `requireSuperAdmin()`)
- ✅ Validate prospect ownership (if applicable)
- ✅ Rate limit API calls

### Token Security
- ✅ Use HMAC for claim tokens
- ✅ Set expiration dates
- ✅ Verify email on claim
- ✅ One-time use tokens (clear after claim)

### Data Privacy
- ✅ Only expose prospect data to authorized admins
- ✅ Validate email belongs to prospect
- ✅ Log all actions for audit

---

## 15. Success Metrics

### Adoption
- Number of request pages created per week
- Distribution across products (TipJar vs DJDash vs M10DJ)
- Email open rates
- Claim conversion rates

### Performance
- Page creation time (target: < 2 seconds)
- Email delivery time (target: < 5 seconds)
- API response time (target: < 1 second)

### Quality
- Zero duplicate organizations
- 100% email delivery success
- Zero claim token security issues

---

## 16. Future Enhancements

### Short Term
- Bulk creation (multiple prospects at once)
- Email scheduling (send at specific time)
- Custom email templates per product
- QR code customization (logo, colors)

### Long Term
- Prospect analytics (page views, requests)
- Automated follow-up emails
- Integration with CRM workflows
- White-label email branding

---

## 17. Rollback Plan

### If Issues Arise
1. **Disable Feature**: Remove navigation item (no code changes)
2. **API Rate Limit**: Add very low rate limit to prevent abuse
3. **Database Rollback**: Organizations table has no schema changes (safe)
4. **Email Disable**: Comment out email sending (pages still created)

### Monitoring
- Monitor error rates in API endpoints
- Track email delivery failures
- Watch for duplicate organization creation
- Monitor claim token usage

---

## Implementation Timeline

**Week 1**: Backend API development
- Create endpoints
- Email system extraction
- Claim flow updates

**Week 2**: Frontend UI development
- Admin page creation
- Prospect search
- Form and validation

**Week 3**: Integration & Testing
- Full flow testing
- Cross-product testing
- Edge case handling

**Week 4**: Polish & Deploy
- UI/UX improvements
- Documentation
- Production deployment

---

## Questions to Resolve

1. **Claim Flow**: Unified `/claim` endpoint or product-specific routes?
2. **Prospect Source**: Should we auto-detect product context from lead/contact source?
3. **Email Timing**: Always require preview, or allow instant send?
4. **Duplicate Handling**: Block duplicates entirely or allow multiple pages per prospect?
5. **Onboarding**: Should unclaimed page owners see different onboarding than regular signups?

---

## Conclusion

This feature leverages existing infrastructure (organizations, claim tokens, email system) and extends it to work across all products. The main work is:

1. **Extracting shared logic** from TipJar-specific implementation
2. **Creating universal admin interface** for prospect selection
3. **Making claim flow product-agnostic**
4. **Testing across all product contexts**

The system is designed to be **safe, scalable, and maintainable** while respecting product boundaries and data isolation.

