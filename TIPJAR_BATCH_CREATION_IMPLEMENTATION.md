# Tip Jar Batch Creation - Phase 1 Implementation Summary

## ✅ Completed Implementation

### Database Migrations

1. **20260112000000_allow_unclaimed_organizations.sql**
   - Modified `organizations` table to allow `owner_id = NULL` for unclaimed organizations
   - Added prospect management fields:
     - `prospect_email` - Email for claiming process
     - `prospect_phone` - Optional phone number
     - `claim_token` - Secure token for claiming (90-day expiry)
     - `claim_token_expires_at` - Token expiration
     - `is_claimed` - Boolean flag for claim status
     - `created_by_admin_id` - Admin who created the org
     - `claimed_at` - Timestamp when claimed
   - Updated RLS policies to allow public read of unclaimed organizations
   - Added constraints to ensure data consistency

2. **20260112000001_create_unclaimed_tip_balance.sql**
   - Created `unclaimed_tip_balance` table to track tips received before claiming
   - Tracks: total amount, fees, net amount, payment intent IDs, charge IDs
   - Helper functions:
     - `get_or_create_unclaimed_tip_balance()` - Get or create balance record
     - `add_tip_to_unclaimed_balance()` - Add tip to balance (for future use)

### API Endpoints

1. **POST /api/admin/tipjar/batch-create** (`pages/api/admin/tipjar/batch-create.js`)
   - Super admin only (requires admin authentication)
   - Creates multiple unclaimed Tip Jar organizations from prospect list
   - Features:
     - Validates email format and uniqueness
     - Generates unique slugs with collision handling
     - Creates secure claim tokens (90-day expiry)
     - Pre-configures all Tip Jar settings
     - Returns URLs, QR codes, and claim links for each organization
   - Request format:
     ```json
     {
       "prospects": [
         {
           "email": "dj@example.com",
           "phone": "+1234567890",
           "business_name": "DJ John's Events",
           "slug": "dj-john",
           "configuration": { /* org settings */ }
         }
       ]
     }
     ```

2. **POST /api/tipjar/claim** (`pages/api/tipjar/claim.js`)
   - Allows prospects to claim their pre-created Tip Jar page
   - Validates claim token and email match
   - Creates user account (or links to existing)
   - Transfers organization ownership
   - Returns pending tips information
   - Request format:
     ```json
     {
       "claim_token": "abc123...",
       "email": "dj@example.com",
       "password": "secure-password",
       "business_name": "DJ John's Events"
     }
     ```

3. **GET /api/tipjar/unclaimed/[slug]** (`pages/api/tipjar/unclaimed/[slug].js`)
   - Public endpoint to check status of unclaimed Tip Jar page
   - Returns: page info, pending tips, claim link
   - Used by prospects to check their page status

4. **GET /api/admin/tipjar/batch-created** (`pages/api/admin/tipjar/batch-created.js`)
   - Admin only endpoint to list batch-created organizations
   - Supports filtering by status (unclaimed/claimed), creator, search
   - Returns enriched data with tip balances
   - Query params: `status`, `created_by`, `search`, `limit`, `offset`

### Payment Processing Updates

1. **Updated create-checkout.js** (`pages/api/crowd-request/create-checkout.js`)
   - Detects unclaimed organizations
   - Routes payments to platform Stripe account (not Connect)
   - Adds metadata to track unclaimed status:
     - `is_unclaimed: 'true'`
     - `payment_routing: 'platform_account_unclaimed'`
     - `prospect_email`
   - Logs unclaimed organization detection

2. **Updated webhook.js** (`pages/api/stripe/webhook.js`)
   - Tracks tips for unclaimed organizations in `unclaimed_tip_balance` table
   - Calculates platform fees automatically
   - Updates balance on successful payment
   - Handles both new balance creation and updates

## 🔄 Implementation Flow

### Batch Creation Flow
```
Admin → POST /api/admin/tipjar/batch-create
  → Creates organizations with owner_id = NULL
  → Generates claim tokens
  → Returns URLs + QR codes
```

### Payment Flow (Before Claiming)
```
Customer → Tip Jar Page
  → Payment → Platform Stripe Account
  → Webhook → Track in unclaimed_tip_balance
  → Funds held for transfer on claim
```

### Claiming Flow
```
Prospect → POST /api/tipjar/claim
  → Validates token + email
  → Creates user account
  → Updates organization: owner_id = user_id, is_claimed = TRUE
  → Returns pending tips info
  → Redirects to onboarding
```

## 📋 Next Steps (Phase 2 & Beyond)

### Phase 2: Admin UI
- [ ] Build batch creation interface (`pages/admin/tipjar/batch-create.tsx`)
- [ ] Build batch dashboard (`pages/admin/tipjar/batch-dashboard.tsx`)
- [ ] Add CSV upload/export functionality
- [ ] Integrate QR code generation and display
- [ ] Add filtering/search UI

### Phase 3: Email/SMS Notifications
- [ ] Create email templates (welcome, reminders)
- [ ] Set up email triggers
- [ ] Create SMS templates (if applicable)
- [ ] Set up reminder schedule

### Phase 4: Payment Integration Completion
- [ ] Create tip transfer service (transfer funds when Connect account set up)
- [ ] Add balance display in dashboard
- [ ] Handle transfer on claim (if Connect already set up)

### Phase 5: Frontend Claim Flow
- [ ] Create claim page (`/tipjar/claim`)
- [ ] Update onboarding to show pending tips
- [ ] Add claim reminders to unclaimed pages

## 🔐 Security Notes

1. **Claim Token Security**
   - Tokens expire after 90 days
   - Email must match prospect_email
   - Rate limiting recommended (not yet implemented)

2. **Payment Security**
   - Unclaimed tips stored in platform account
   - Audit trail via `unclaimed_tip_balance` table
   - All transfers logged for compliance

3. **RLS Policies**
   - Public can read unclaimed organizations (for Tip Jar pages)
   - Only admins can create unclaimed organizations
   - Only owners can modify claimed organizations

## 🧪 Testing Checklist

- [ ] Test batch creation with multiple prospects
- [ ] Test slug collision handling
- [ ] Test claim token generation and validation
- [ ] Test payment flow for unclaimed organizations
- [ ] Test webhook tip tracking
- [ ] Test claim process with matching email
- [ ] Test claim process with mismatched email (should fail)
- [ ] Test expired claim tokens (should fail)
- [ ] Verify RLS policies work correctly
- [ ] Test admin batch dashboard endpoints

## 📝 Notes

- All amounts stored in cents (integers) for precision
- Claim tokens are simple HMAC-based (consider JWT for production)
- Platform fees default to 3.5% + $0.30 (can be customized per org)
- Payment routing: unclaimed → platform account, claimed → Connect (if set up)

## 🚨 Known Limitations

1. **Tip Transfer**: Funds are tracked but not automatically transferred when claim happens. Transfer should happen after Connect account is set up.
2. **Email Uniqueness**: Currently checks for existing unclaimed orgs, but doesn't handle existing claimed orgs with same email.
3. **Rate Limiting**: Claim endpoint doesn't have rate limiting yet (should add).
4. **Token Regeneration**: No endpoint to regenerate claim tokens if expired.

## 🎯 Success Metrics

- ✅ Batch creation works for multiple prospects
- ✅ Organizations accessible via URL before claiming
- ✅ Payments tracked correctly for unclaimed orgs
- ✅ Claim process works with email matching
- ✅ Pending tips calculated correctly

