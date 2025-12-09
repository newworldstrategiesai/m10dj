# Stripe Connect Onboarding Improvements

## Overview
Enhanced the Stripe Connect onboarding flow to be seamless and follow official Stripe API best practices.

## Key Improvements

### 1. **Enhanced Error Detection & Handling**

#### Added Detection for "Cannot Create Connected Accounts" Error
- **Location**: `pages/api/stripe-connect/create-account.js`
- **What it does**: Detects when the platform Stripe account cannot create connected accounts
- **User Experience**: Shows clear error message with direct link to Stripe support

#### Improved Error Messages
- Distinguishes between:
  - Platform account not enabled for Connect (critical)
  - Platform verification required (standard)
  - Other Stripe errors
- Provides specific guidance for each error type

### 2. **Improved Account Creation**

#### Enhanced Express Account Parameters
- **Location**: `utils/stripe/connect.ts`
- **Improvements**:
  - Added proper business profile with name
  - Set daily payout schedule by default
  - Added metadata for tracking (`created_via: 'm10dj_platform'`)
  - Better branding support (merges with existing settings)
  - Follows official Stripe API documentation exactly

#### Account Creation Parameters (v1 Express API)
```typescript
{
  type: 'express',
  country: 'US',
  email: email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_type: 'individual',
  business_profile: {
    url: businessProfileUrl,
    name: organizationName,
  },
  settings: {
    payouts: {
      schedule: {
        interval: 'daily',
      },
    },
    branding: { ... }, // If provided
  },
  metadata: {
    organization_name: organizationName,
    organization_slug: organizationSlug,
    created_via: 'm10dj_platform',
  },
}
```

### 3. **Improved Account Link Creation**

#### Enhanced Account Links
- **Location**: `utils/stripe/connect.ts`
- **Improvements**:
  - Uses `collect: 'currently_due'` for upfront collection
  - Proper fallback from v2 to v1 API
  - Follows official API documentation

### 4. **Better Account Status Retrieval**

#### Enhanced Status Checking
- **Location**: `utils/stripe/connect.ts`
- **Improvements**:
  - Properly checks capabilities status
  - Handles both v1 and v2 API responses
  - Better error handling for invalid account IDs
  - Extracts requirements (currently_due, eventually_due, past_due)

### 5. **Improved UI Components**

#### Updated Error Display
- **Components**:
  - `components/subscription/StripeConnectSetup.tsx` (Admin dashboard)
  - `components/onboarding/StripeConnectSetup.tsx` (Onboarding flow)
- **Improvements**:
  - Clear error messages for "cannot create accounts"
  - Step-by-step instructions
  - Direct links to Stripe support
  - Reassurance that payments still work

### 6. **Added Helper Function**

#### Platform Capability Check
- **Location**: `utils/stripe/connect.ts`
- **Function**: `canCreateConnectedAccounts()`
- **Purpose**: Pre-check if platform can create accounts (optional, for better UX)

## API References Used

All implementations follow official Stripe documentation:

- **Accounts API**: https://docs.stripe.com/api/accounts/create
- **Account Links API**: https://docs.stripe.com/api/account_links/create
- **Account Retrieval**: https://docs.stripe.com/api/accounts/retrieve
- **Capabilities API**: https://docs.stripe.com/api/capabilities/retrieve

## Error Handling Flow

1. **Account Creation Attempt**
   - Tries to create Express account
   - Catches Stripe errors

2. **Error Detection**
   - Checks for "cannot create connected accounts"
   - Checks for platform verification errors
   - Checks for other Stripe errors

3. **User-Friendly Messages**
   - Shows appropriate error message
   - Provides actionable steps
   - Links to relevant Stripe resources

## Best Practices Implemented

✅ **Follows Official API Documentation**
- Uses correct parameters from Stripe docs
- Proper error handling
- Type-safe implementation

✅ **Graceful Fallbacks**
- v2 API → v1 API fallback
- Comprehensive error catching

✅ **User Experience**
- Clear error messages
- Step-by-step guidance
- Direct links to solutions

✅ **Developer Experience**
- Comprehensive logging
- Type safety
- Well-documented code

## Testing Recommendations

1. **Test Account Creation**
   - With platform account enabled for Connect
   - With platform account NOT enabled for Connect
   - With incomplete platform verification

2. **Test Error Handling**
   - Verify error messages are clear
   - Check links work correctly
   - Ensure fallbacks work

3. **Test Onboarding Flow**
   - Complete onboarding successfully
   - Test with various error scenarios
   - Verify account status updates

## Next Steps (Optional Enhancements)

1. **Pre-flight Check**: Use `canCreateConnectedAccounts()` before attempting creation
2. **Webhook Integration**: Listen for account status changes
3. **Retry Logic**: Automatic retry for transient errors
4. **Progress Tracking**: Show onboarding progress to users
5. **Email Notifications**: Notify users when onboarding is complete

