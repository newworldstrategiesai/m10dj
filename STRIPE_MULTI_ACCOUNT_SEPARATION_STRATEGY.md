# Stripe Multi-Account Brand Separation Strategy

## Problem Statement

When logging into Stripe Express dashboards for TipJar.live users, the UI shows "M10 DJ Company" branding throughout. This occurs because:

1. **Platform-level branding** in Stripe Dashboard → Settings → Connect → Express accounts → Branding applies to ALL Express accounts under that Stripe account
2. **Account-level branding** (which we set in code) only affects checkout pages, NOT the Express dashboard
3. All products (TipJar, DJ Dash, M10 DJ) currently share the same Stripe account

**Result**: TipJar users see "M10 DJ Company" when managing their bank accounts, which creates brand confusion and trust issues.

---

## Solution: Separate Stripe Accounts Per Product

### ✅ Recommended Approach

Create separate Stripe accounts for each product:
- **M10 DJ Company** → Keep existing Stripe account (`STRIPE_SECRET_KEY`)
- **TipJar.live** → New Stripe account (`STRIPE_SECRET_KEY_TIPJAR`)
- **DJ Dash** → New Stripe account (`STRIPE_SECRET_KEY_DJDASH`) - optional, can share with M10 DJ if preferred

### Benefits

1. ✅ **Complete Brand Separation**
   - Each product's Express dashboards show correct branding
   - No cross-product brand confusion
   - Professional appearance for each brand

2. ✅ **Legal/Compliance Separation**
   - Separate tax reporting per product
   - Clear financial boundaries
   - Better for future business structures

3. ✅ **Risk Isolation**
   - Issues with one product's Stripe account don't affect others
   - Easier to audit and manage
   - Independent dispute handling

4. ✅ **Financial Clarity**
   - Separate revenue streams
   - Easier accounting per product
   - Clear P&L separation

### Trade-offs

- ⚠️ **Additional Setup**: Need to create and verify new Stripe accounts
- ⚠️ **Code Changes**: Need to route Stripe calls to correct account based on product context
- ⚠️ **Webhook Management**: Separate webhook endpoints per product (or route based on account)

---

## Implementation Plan

### Phase 1: Stripe Account Setup (Manual)

1. **Create TipJar.live Stripe Account**
   - Go to [stripe.com](https://stripe.com) and create new account
   - Use business name: "TipJar Live" or "TipJar.live"
   - Complete business verification
   - Enable Stripe Connect → Express accounts
   - Configure Express account branding:
     - Logo: TipJar logo
     - Colors: TipJar brand colors
     - Platform name: "TipJar.live"

2. **Get API Keys**
   - Test mode keys: `sk_test_...` and `pk_test_...`
   - Live mode keys: `sk_live_...` and `pk_live_...`

3. **Set Up Webhooks**
   - Create webhook endpoints pointing to your API
   - Use same webhook handler, but route based on account

### Phase 2: Code Updates

#### 2.1 Update Stripe Configuration (`utils/stripe/config.ts`)

```typescript
import Stripe from 'stripe';

// Product-specific Stripe keys
const m10djStripeKey = process.env.STRIPE_SECRET_KEY_LIVE ?? process.env.STRIPE_SECRET_KEY ?? '';
const tipjarStripeKey = process.env.STRIPE_SECRET_KEY_TIPJAR_LIVE ?? process.env.STRIPE_SECRET_KEY_TIPJAR ?? '';
const djdashStripeKey = process.env.STRIPE_SECRET_KEY_DJDASH_LIVE ?? process.env.STRIPE_SECRET_KEY_DJDASH ?? '';

// Create Stripe instances per product
const createStripeInstance = (apiKey: string, appName: string, appUrl: string) => {
  if (!apiKey) return null;
  
  return new Stripe(apiKey, {
    apiVersion: '2025-07-30.preview' as any,
    appInfo: {
      name: appName,
      version: '1.0.0',
      url: appUrl
    }
  });
};

export const stripeM10DJ = createStripeInstance(m10djStripeKey, 'M10 DJ Platform', 'https://m10djcompany.com');
export const stripeTipJar = createStripeInstance(tipjarStripeKey, 'TipJar Platform', 'https://tipjar.live');
export const stripeDJDash = createStripeInstance(djdashStripeKey, 'DJ Dash Platform', 'https://djdash.net') ?? stripeM10DJ; // Fallback to M10 DJ if not configured

/**
 * Get the appropriate Stripe instance based on product context
 */
export function getStripeInstance(productContext?: 'tipjar' | 'djdash' | 'm10dj' | null): Stripe | null {
  switch (productContext) {
    case 'tipjar':
      return stripeTipJar;
    case 'djdash':
      return stripeDJDash;
    case 'm10dj':
    default:
      return stripeM10DJ;
  }
}

// Default export for backward compatibility (M10 DJ)
export const stripe = stripeM10DJ;
```

#### 2.2 Update Connect Account Creation (`utils/stripe/connect.ts`)

Update `createConnectAccount` to use product-specific Stripe instance:

```typescript
export async function createConnectAccount(
  // ... existing parameters
  productContext?: 'tipjar' | 'djdash' | 'm10dj' | null
): Promise<Stripe.Account> {
  // Get product-specific Stripe instance
  const stripeInstance = getStripeInstance(productContext);
  if (!stripeInstance) {
    throw new Error(`Stripe not configured for product: ${productContext}`);
  }
  
  // Use stripeInstance instead of stripe for all API calls
  // ... rest of implementation
}
```

#### 2.3 Update All Stripe API Calls

Identify all places where Stripe is used and route to correct instance:
- Connect account creation
- Payment intent creation
- Checkout session creation
- Webhook handling
- Account updates

#### 2.4 Environment Variables

Add to `.env.local` and Vercel:

```bash
# M10 DJ Company (existing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY_LIVE=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...

# TipJar.live (new)
STRIPE_SECRET_KEY_TIPJAR=sk_test_...
STRIPE_SECRET_KEY_TIPJAR_LIVE=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TIPJAR=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TIPJAR_LIVE=pk_live_...

# DJ Dash (optional - can use M10 DJ keys if preferred)
STRIPE_SECRET_KEY_DJDASH=sk_test_...
STRIPE_SECRET_KEY_DJDASH_LIVE=sk_live_...
```

### Phase 3: Migration Strategy

#### Option A: Clean Slate (Recommended for Test Mode)
- Create new accounts under TipJar Stripe account going forward
- Old accounts remain under M10 DJ account
- No migration needed

#### Option B: Migrate Existing Accounts (For Live Mode)
- Export existing TipJar Connect accounts from M10 DJ Stripe
- Re-create under TipJar Stripe account
- Update `stripe_connect_account_id` in database
- **Note**: This is complex - Stripe doesn't support transferring accounts between platform accounts

**Recommendation**: For existing test accounts, Option A is fine. For live accounts, evaluate if migration is necessary based on transaction volume.

---

## Alternative: Single Account with Acceptable Limitation

If separate accounts are not feasible right now:

### Keep Single Account
- Accept that Express dashboards show "M10 DJ Company" branding
- Account-level branding still works for checkout pages (customer-facing)
- Dashboard branding only affects TipJar users when they log in (not customers)

**Pros**:
- No code changes needed
- Simpler to manage

**Cons**:
- Brand confusion for TipJar users
- Less professional appearance
- Potential trust issues

---

## Recommendation

**Yes, create a separate Stripe account for TipJar.live.**

The brand separation is important for:
- User trust and professionalism
- Clear product identity
- Future scalability
- Compliance and accounting clarity

The implementation is straightforward and the benefits outweigh the setup effort.

---

## Next Steps

1. **Decide**: Separate accounts or accept limitation?
2. **If separate**: Create TipJar Stripe account and get API keys
3. **Implementation**: Update code to support product-specific Stripe instances
4. **Testing**: Test in test mode with separate accounts
5. **Migration**: Decide on existing accounts (new vs. migrate)

---

## Questions to Consider

1. **Existing TipJar accounts**: Do you have many existing Connect accounts that would need migration?
2. **Transaction volume**: Is there enough volume to justify separate accounts?
3. **Timeline**: Do you need this fixed immediately or can it wait?
4. **DJ Dash**: Should DJ Dash also get its own Stripe account, or share with M10 DJ?

---

## Support

Once you decide, I can help implement the code changes to support product-specific Stripe accounts.
