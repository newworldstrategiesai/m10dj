# Product Sync Guide

## Overview

This guide explains how to keep TipJar.live, DJDash.net, and M10DJCompany.com in sync using shared components and patterns.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Shared Infrastructure                    │
├─────────────────────────────────────────────────────────────┤
│  Database (Supabase)  │  Auth  │  Stripe  │  API Routes    │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   TipJar.live   │  │   DJDash.net    │  │ M10DJCompany.com│
│                 │  │                 │  │   (Flagship)    │
│ - Tips & Tipping│  │ - DJ Directory  │  │ - Requests Page │
│ - Song Requests │  │ - Lead Capture  │  │ - Bookings      │
│ - Live Streaming│  │ - DJ Profiles   │  │ - Services      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Shared Components                          │
│  components/shared/  │  components/ui/  │  components/...   │
└─────────────────────────────────────────────────────────────┘
```

## Shared Components Directory

### Location: `components/shared/`

```
components/shared/
├── index.ts                 # Main exports
├── marketing/
│   ├── index.ts            # Marketing component exports
│   ├── FeatureCard.tsx     # Product-aware feature cards
│   ├── TestimonialCard.tsx # Product-aware testimonials
│   └── StructuredData.tsx  # JSON-LD SEO components
└── (future)
    ├── HeroSection.tsx
    ├── PricingCard.tsx
    ├── CTASection.tsx
    └── SocialProofBar.tsx
```

## Using Shared Components

### Import Pattern

```tsx
// Option 1: Import from shared index
import { 
  FeatureCard, 
  TestimonialCard, 
  ProductStructuredData 
} from '@/components/shared';

// Option 2: Import from marketing subfolder
import { FeatureCard } from '@/components/shared/marketing';
```

### Product-Aware Components

All shared marketing components accept a `product` prop:

```tsx
<FeatureCard
  product="tipjar"  // or "djdash" or "m10dj"
  title="Instant Tips"
  description="Get paid instantly"
  icon={<DollarSign className="w-8 h-8" />}
/>
```

This automatically applies the correct brand colors:

| Product | Primary | Icon Color |
|---------|---------|------------|
| tipjar | Emerald/Green | `text-emerald-500` |
| djdash | Blue/Cyan | `text-blue-500` |
| m10dj | Yellow/Gold | `text-yellow-500` |

### Structured Data (SEO)

Add structured data to any product page:

```tsx
import { ProductStructuredData } from '@/components/shared/marketing/StructuredData';

export default function MyPage() {
  return (
    <>
      <ProductStructuredData 
        product="tipjar"
        includeOrganization={true}
        includeSoftwareApp={true}
        includeWebsite={true}
        faqQuestions={[
          { question: "How does it work?", answer: "..." }
        ]}
        softwareAppProps={{
          offers: { price: '0', priceCurrency: 'USD' },
          aggregateRating: { ratingValue: '4.9', reviewCount: '1200' },
        }}
      />
      {/* Page content */}
    </>
  );
}
```

## Payment Components

The flagship `pages/requests.js` uses payment components from `components/crowd-request/`. These can be reused in TipJar:

### Available Payment Components

```tsx
// Import from shared or directly from crowd-request
import { 
  PaymentAmountSelector,
  PaymentMethodSelection,
  PaymentSuccessScreen,
  LoadingSpinner,
} from '@/components/shared';

// Or directly:
import PaymentAmountSelector from '@/components/crowd-request/PaymentAmountSelector';
```

### Component Details

| Component | Purpose | Props |
|-----------|---------|-------|
| `PaymentAmountSelector` | Tip/payment amount buttons | `amounts`, `selectedAmount`, `onSelect`, `customAmount` |
| `PaymentMethodSelection` | Card/CashApp/Venmo selector | `methods`, `selected`, `onSelect` |
| `PaymentSuccessScreen` | Post-payment confirmation | `amount`, `message`, `receiptUrl` |
| `LoadingSpinner` | Loading indicator | `size`, `color` |

### Example: Adding Payment to TipJar Component

```tsx
'use client';

import { useState } from 'react';
import PaymentAmountSelector from '@/components/crowd-request/PaymentAmountSelector';
import PaymentMethodSelection from '@/components/crowd-request/PaymentMethodSelection';
import PaymentSuccessScreen from '@/components/crowd-request/PaymentSuccessScreen';

export function TipPaymentFlow({ streamerId }) {
  const [amount, setAmount] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [success, setSuccess] = useState(false);

  if (success) {
    return <PaymentSuccessScreen amount={amount} message="Thanks for the tip!" />;
  }

  return (
    <div>
      <PaymentAmountSelector
        amounts={[5, 10, 20, 50]}
        selectedAmount={amount}
        onSelect={setAmount}
        customAmount={true}
      />
      <PaymentMethodSelection
        methods={['card', 'cashapp']}
        selected={paymentMethod}
        onSelect={setPaymentMethod}
      />
    </div>
  );
}
```

## Running the Sync Audit

Check sync status anytime:

```bash
# Formatted console output
npm run audit:sync

# JSON output (for CI/automation)
npm run audit:sync:json

# Markdown report
npm run audit:sync:md
```

### Understanding Audit Results

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Synced | Feature exists in both products | Verify implementations match |
| 🔴 Missing in TipJar | Flagship has it, TipJar doesn't | Consider adding to TipJar |
| 🔵 TipJar Only | TipJar has it, flagship doesn't | Consider adding to flagship |

### Priority Actions from Audit

1. **HIGH**: Shared components not being used
2. **MEDIUM**: Components exist in both but may differ
3. **LOW**: Nice-to-have improvements

## Feature Parity Checklist

### Currently Synced Features ✅
- [x] Hero sections
- [x] Social proof metrics
- [x] Testimonials
- [x] CTA sections
- [x] Payment processing (Stripe)
- [x] Authentication
- [x] Dark mode support
- [x] Mobile responsive
- [x] SEO metadata

### Flagship-Only Features (Consider Adding to TipJar)
- [ ] Bidding/Auction requests
- [ ] Shoutout messages
- [ ] Bundle pricing
- [ ] Advanced branding options

### TipJar-Only Features
- [x] Live streaming
- [x] Real-time chat
- [x] Stream alerts
- [x] Tip overlays

## Best Practices

### 1. When Adding New Features

Ask: "Could this be used by other products?"

If yes, create in `components/shared/` with product prop:

```tsx
// Good: Shared component
<FeatureCard product="tipjar" {...props} />

// Avoid: Product-specific when shared is possible
<TipJarFeatureCard {...props} />
```

### 2. When Updating Flagship

After updating `pages/requests.js`, run:

```bash
npm run audit:sync
```

Check if TipJar needs similar updates.

### 3. When Creating Components

1. Check if a shared version exists first
2. If creating new, consider making it product-aware
3. Use the theme system from `components/marketing/themes.ts`

### 4. Structured Data

Always add structured data to public marketing pages:

```tsx
<ProductStructuredData product="tipjar" />
```

## Theme System

Located at `components/marketing/themes.ts`:

```ts
export const productThemes = {
  tipjar: {
    primary: 'purple', // Note: Actually emerald in components
    secondary: 'pink',
    accent: 'purple',
    logo: '/tipjar-logo.svg',
    brandName: 'TipJar.Live',
    domain: 'tipjar.live',
  },
  djdash: { ... },
  m10dj: { ... },
};
```

## Migration Path

### For Existing TipJar Components

To migrate `components/tipjar/FeatureCard.tsx` to shared:

1. The shared version already exists at `components/shared/marketing/FeatureCard.tsx`
2. Update imports in TipJar pages:

```tsx
// Before
import { FeatureCard } from '@/components/tipjar/FeatureCard';

// After
import { FeatureCard } from '@/components/shared/marketing';

// Usage
<FeatureCard product="tipjar" title="..." />
```

3. The old component can remain for backward compatibility or be deprecated

## File Structure Reference

```
components/
├── shared/                    # Cross-product components
│   ├── index.ts
│   └── marketing/
│       ├── FeatureCard.tsx
│       ├── TestimonialCard.tsx
│       └── StructuredData.tsx
├── tipjar/                    # TipJar-specific
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ...
├── djdash/                    # DJDash-specific
│   ├── Header.tsx
│   └── ...
├── company/                   # M10DJ-specific
│   ├── Header.js
│   └── ...
├── crowd-request/             # Shared payment (legacy location)
│   ├── PaymentAmountSelector.js
│   └── ...
├── marketing/                 # Theme definitions
│   ├── themes.ts
│   └── types.ts
└── ui/                        # ShadCN UI components
    └── ...
```

## Questions?

- Run `npm run audit:sync` to see current sync status
- Check `audit-reports/` for detailed reports
- Review this guide for patterns and best practices

