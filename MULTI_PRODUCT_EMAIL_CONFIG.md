# 📧 Multi-Product Email Configuration Guide

## Overview

The email system is now **product-aware** and automatically uses the correct sender address and branding based on the organization's `product_context`. This supports all three products:
- **TipJar.live** (`product_context: 'tipjar'`)
- **DJ Dash** (`product_context: 'djdash'`)
- **M10 DJ Company** (`product_context: 'm10dj'`)

---

## 🔧 Environment Variables

### Required
```bash
# Resend API Key (shared across all products)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

### Product-Specific (Recommended)
```bash
# TipJar.live emails
RESEND_FROM_EMAIL_TIPJAR=TipJar <noreply@tipjar.live>

# DJ Dash emails
RESEND_FROM_EMAIL_DJDASH=DJ Dash <noreply@djdash.net>

# M10 DJ Company emails
RESEND_FROM_EMAIL_M10DJ=M10 DJ Company <noreply@m10djcompany.com>
```

### Fallback (Optional)
```bash
# Used if product-specific variable not set
RESEND_FROM_EMAIL=TipJar <noreply@tipjar.live>
```

### Product URLs (Optional)
```bash
# Base URLs for email links
NEXT_PUBLIC_TIPJAR_URL=https://tipjar.live
NEXT_PUBLIC_DJDASH_URL=https://djdash.net
NEXT_PUBLIC_M10DJ_URL=https://m10djcompany.com
```

---

## 🎯 How It Works

### Automatic Product Detection

The email system automatically detects the product context from:
1. **Organization's `product_context` field** (primary)
2. **User's `user_metadata.product_context`** (fallback)
3. **Default to 'tipjar'** if not specified

### Email Address Selection

```typescript
// Example: Venue invitation email
const fromEmail = getProductFromEmail(organization.product_context);

// Results:
// - 'tipjar' → RESEND_FROM_EMAIL_TIPJAR or 'TipJar <noreply@tipjar.live>'
// - 'djdash' → RESEND_FROM_EMAIL_DJDASH or 'DJ Dash <noreply@djdash.net>'
// - 'm10dj' → RESEND_FROM_EMAIL_M10DJ or 'M10 DJ Company <noreply@m10djcompany.com>'
```

### Email Content Branding

Email templates automatically use:
- **Product name** (TipJar, DJ Dash, M10 DJ Company)
- **Product domain** (tipjar.live, djdash.net, m10djcompany.com)
- **Product base URL** (for links)

---

## 📝 Implementation Details

### Helper Functions (`lib/email/product-email-config.ts`)

```typescript
// Get "from" email address
getProductFromEmail(productContext: ProductContext): string

// Get product name for content
getProductName(productContext: ProductContext): string

// Get product domain
getProductDomain(productContext: ProductContext): string

// Get product base URL
getProductBaseUrl(productContext: ProductContext): string
```

### Usage in Email Functions

```typescript
// Venue invitation email
await sendVenueInvitationEmail({
  // ... other params
  productContext: venueOrg.product_context, // Automatically uses correct sender
});

// Acceptance confirmation
await sendVenueInvitationAcceptedEmail(
  venueEmail,
  venueName,
  performerName,
  performerSlug,
  tipPageUrl,
  venueOrg.product_context // Automatically uses correct sender
);
```

---

## ✅ Benefits

1. **Automatic Branding** - Emails use correct product name and domain
2. **Domain Verification** - Each product can use its verified domain
3. **Flexible Configuration** - Override per product or use fallback
4. **Future-Proof** - Easy to add new products
5. **Backward Compatible** - Falls back to `RESEND_FROM_EMAIL` if product-specific not set

---

## 🧪 Testing

### Test Each Product

1. **TipJar**
   - Create venue with `product_context = 'tipjar'`
   - Send invitation
   - Verify email from `TipJar <noreply@tipjar.live>`

2. **DJ Dash**
   - Create venue with `product_context = 'djdash'`
   - Send invitation
   - Verify email from `DJ Dash <noreply@djdash.net>`

3. **M10 DJ Company**
   - Create venue with `product_context = 'm10dj'`
   - Send invitation
   - Verify email from `M10 DJ Company <noreply@m10djcompany.com>`

---

## 🔒 Security & Best Practices

1. **Domain Verification**
   - Verify all three domains in Resend
   - Configure SPF, DKIM, DMARC records
   - Use verified domains in email addresses

2. **Fallback Strategy**
   - Always set `RESEND_FROM_EMAIL` as fallback
   - Product-specific variables override fallback
   - System defaults to TipJar if nothing set

3. **Testing**
   - Test emails from each product
   - Verify sender addresses are correct
   - Check email deliverability

---

## 📚 Related Files

- `lib/email/product-email-config.ts` - Product-aware email configuration
- `lib/email/venue-invitation-email.ts` - Venue invitation emails (uses product config)
- `app/api/tipjar/venue/invite-performer/route.ts` - Passes product context
- `app/api/tipjar/venue/accept-invitation/route.ts` - Passes product context

---

**Status:** ✅ **IMPLEMENTED**  
**Last Updated:** 2025-02-21



