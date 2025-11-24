# 🛠️ SaaS Implementation Guide: Multi-Tenant Conversion

## Quick Start: Critical Database Changes

### Step 1: Create Organizations Table

```sql
-- Run this migration first
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own organizations
CREATE POLICY "Users can view own organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy: Users can update their own organizations
CREATE POLICY "Users can update own organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());
```

### Step 2: Add organization_id to All Tables

**Priority Order (Most Critical First):**

1. **crowd_requests** (Your core feature)
2. **contacts** (Lead management)
3. **events** (Event tracking)
4. **admin_settings** (Per-org settings)
5. **messages** (SMS/communication)
6. **api_keys** (Twilio, etc.)

```sql
-- Example for crowd_requests
ALTER TABLE crowd_requests 
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Make it NOT NULL after backfilling data
-- First, create a default organization for existing data
INSERT INTO organizations (name, slug, owner_id, subscription_tier, subscription_status)
VALUES ('M10 DJ Company', 'm10dj', (SELECT id FROM auth.users LIMIT 1), 'enterprise', 'active')
RETURNING id;

-- Backfill existing data (replace with actual organization ID)
UPDATE crowd_requests 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'm10dj')
WHERE organization_id IS NULL;

-- Now make it required
ALTER TABLE crowd_requests 
ALTER COLUMN organization_id SET NOT NULL;

-- Create index
CREATE INDEX idx_crowd_requests_organization_id ON crowd_requests(organization_id);
```

### Step 3: Update RLS Policies

**Critical**: Every RLS policy must filter by `organization_id`:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Admins can view all crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Admins can update crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON crowd_requests;

-- New organization-scoped policies
CREATE POLICY "Users can view their organization's crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert crowd requests for their organization"
  ON crowd_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's crowd requests"
  ON crowd_requests
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );
```

### Step 4: Create Organization Context Utility

```typescript
// utils/organization-context.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_ends_at?: string;
}

export async function getCurrentOrganization(
  supabase: SupabaseClient
): Promise<Organization | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: org, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (error || !org) return null;

  return org;
}

export async function requireActiveOrganization(
  supabase: SupabaseClient
): Promise<Organization> {
  const org = await getCurrentOrganization(supabase);
  
  if (!org) {
    throw new Error('No organization found');
  }

  if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
    throw new Error('Organization subscription is not active');
  }

  return org;
}
```

### Step 5: Update All API Routes

**Example: Update `/api/crowd-request/submit`**

```typescript
// pages/api/crowd-request/submit.js
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { requireActiveOrganization } from '@/utils/organization-context';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  
  // Get user's organization
  const org = await requireActiveOrganization(supabase);
  if (!org) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check subscription limits (for starter tier)
  if (org.subscription_tier === 'starter') {
    // Count events this month
    const { count } = await supabase
      .from('crowd_requests')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if (count >= 5) {
      return res.status(403).json({ 
        error: 'Event limit reached. Upgrade to Professional for unlimited events.' 
      });
    }
  }

  // Create request with organization_id
  const { data, error } = await supabase
    .from('crowd_requests')
    .insert({
      ...req.body,
      organization_id: org.id, // CRITICAL: Always include organization_id
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ requestId: data.id, ...data });
}
```

### Step 6: Update Frontend Components

**Example: Update Admin Dashboard**

```typescript
// pages/admin/crowd-requests.tsx
import { getCurrentOrganization } from '@/utils/organization-context';

export default function CrowdRequestsPage() {
  const supabase = createClientComponentClient();
  const [org, setOrg] = useState<Organization | null>(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    async function load() {
      const organization = await getCurrentOrganization(supabase);
      setOrg(organization);
      
      if (organization) {
        // Always filter by organization_id
        const { data } = await supabase
          .from('crowd_requests')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false });
        
        setRequests(data || []);
      }
    }
    load();
  }, []);

  // ... rest of component
}
```

---

## Stripe Subscription Integration

### Step 1: Create Subscription Products

In Stripe Dashboard, create:
- **Starter**: $49/month recurring
- **Professional**: $99/month recurring  
- **Enterprise**: $199/month recurring

### Step 2: Subscription Creation API

```typescript
// pages/api/subscriptions/create.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { priceId, organizationId } = req.body;
  const supabase = createServerSupabaseClient({ req, res });
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .eq('owner_id', user.id)
    .single();

  if (!org) {
    return res.status(404).json({ error: 'Organization not found' });
  }

  // Create or get Stripe customer
  let customerId = org.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        organization_id: organizationId,
      },
    });
    customerId = customer.id;

    // Save customer ID
    await supabase
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', organizationId);
  }

  // Create subscription with trial
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14, // 14-day free trial
    metadata: {
      organization_id: organizationId,
    },
  });

  // Update organization
  await supabase
    .from('organizations')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: 'trial',
      trial_ends_at: new Date(subscription.trial_end * 1000).toISOString(),
    })
    .eq('id', organizationId);

  return res.status(200).json({ 
    subscriptionId: subscription.id,
    clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
  });
}
```

### Step 3: Webhook Handler

```typescript
// pages/api/webhooks/stripe.js
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const supabase = createServerSupabaseClient({ req, res });

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      const orgId = subscription.metadata.organization_id;

      // Determine tier from price
      const priceId = subscription.items.data[0].price.id;
      let tier = 'starter';
      if (priceId === process.env.STRIPE_PROFESSIONAL_PRICE_ID) tier = 'professional';
      if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) tier = 'enterprise';

      await supabase
        .from('organizations')
        .update({
          subscription_tier: tier,
          subscription_status: subscription.status === 'active' ? 'active' : 'trial',
          stripe_subscription_id: subscription.id,
        })
        .eq('id', orgId);
      break;

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object;
      const deletedOrgId = deletedSub.metadata.organization_id;

      await supabase
        .from('organizations')
        .update({
          subscription_status: 'cancelled',
        })
        .eq('id', deletedOrgId);
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object;
      const failedOrgId = invoice.subscription_details?.metadata?.organization_id;

      if (failedOrgId) {
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'past_due',
          })
          .eq('id', failedOrgId);
      }
      break;
  }

  res.json({ received: true });
}
```

---

## Onboarding Flow

### Step 1: Sign Up → Create Organization

```typescript
// pages/signup.tsx
export default function SignUpPage() {
  const handleSignUp = async (email: string, password: string, orgName: string) => {
    // 1. Create user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // 2. Create organization
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug: slug,
        owner_id: authData.user.id,
        subscription_tier: 'starter',
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // 3. Redirect to subscription selection
    router.push('/onboarding/select-plan');
  };
}
```

### Step 2: Plan Selection

```typescript
// pages/onboarding/select-plan.tsx
export default function SelectPlanPage() {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      features: ['5 events/month', 'Basic requests', 'Stripe payments'],
    },
    {
      name: 'Professional',
      price: 99,
      features: ['Unlimited events', 'All features', 'All payment methods'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 199,
      features: ['Everything + White-label', 'Custom domain', 'API access'],
    },
  ];

  const handleSelectPlan = async (priceId: string) => {
    // Create Stripe checkout session
    const response = await fetch('/api/subscriptions/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
    
    const { url } = await response.json();
    window.location.href = url;
  };
}
```

---

## Testing Checklist

### Data Isolation Tests
- [ ] User A cannot see User B's crowd requests
- [ ] User A cannot see User B's contacts
- [ ] User A cannot see User B's events
- [ ] API routes filter by organization_id
- [ ] RLS policies work correctly

### Subscription Tests
- [ ] Trial period works (14 days)
- [ ] Subscription creation works
- [ ] Webhook updates organization status
- [ ] Cancellation works
- [ ] Payment failure handling works
- [ ] Tier limits enforced (starter = 5 events/month)

### Feature Tests
- [ ] Crowd request creation works
- [ ] Payment processing works
- [ ] Admin dashboard shows only org data
- [ ] Settings are per-organization
- [ ] QR codes work per organization

---

## Migration Strategy for Existing Data

### Option 1: Single Organization (Recommended for Start)

```sql
-- Create one organization for existing data
INSERT INTO organizations (name, slug, owner_id, subscription_tier, subscription_status)
VALUES (
  'M10 DJ Company',
  'm10dj',
  (SELECT id FROM auth.users WHERE email = 'djbenmurray@gmail.com' LIMIT 1),
  'enterprise',
  'active'
)
RETURNING id;

-- Backfill all existing data
UPDATE crowd_requests 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'm10dj')
WHERE organization_id IS NULL;

-- Repeat for all tables...
```

### Option 2: Clean Slate (If Starting Fresh)

- Keep existing app running
- Build new multi-tenant version
- Migrate when ready
- Or run both in parallel

---

## Environment Variables Needed

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# App
NEXT_PUBLIC_SITE_URL=https://yourplatform.com
```

---

## Critical Reminders

1. **ALWAYS filter by organization_id** in every query
2. **Test RLS policies** thoroughly - data isolation is critical
3. **Backup before migrations** - database changes are irreversible
4. **Start with one organization** - migrate existing data first
5. **Test subscription flow** end-to-end before launch
6. **Monitor webhooks** - Stripe events must update database
7. **Handle edge cases** - cancelled subscriptions, failed payments, etc.

---

## Next Steps

1. **This Week**: Create organizations table, add organization_id to crowd_requests
2. **Next Week**: Update RLS policies, test data isolation
3. **Week 3**: Stripe integration, subscription flow
4. **Week 4**: Onboarding flow, plan selection
5. **Week 5**: Testing, bug fixes
6. **Week 6**: Beta launch with 5-10 DJs

Good luck! 🚀

