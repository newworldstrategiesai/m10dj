# TipJar Onboarding Flow

## Complete User Journey for New TipJar Users

### 1. **Sign Up** (`/tipjar/signup`)

**Location:** `app/api/auth/signup/route.ts`

**What happens:**
1. User fills out signup form (email, password, business name)
2. System creates user account with `product_context: 'tipjar'` in user metadata
3. User metadata is stored: `auth.users.raw_user_meta_data->>'product_context' = 'tipjar'`

**Database Trigger (Automatic):**
- When user is created, trigger `handle_new_user_organization()` fires
- Automatically creates an organization for the user
- Sets organization's `product_context` from user metadata
- Generates slug from email or business name
- Creates organization with default settings

**After Signup:**
- If session exists (no email confirmation required): Redirects to `/tipjar/dashboard`
- If email confirmation required: Shows success message, user must confirm email

---

### 2. **Email Confirmation** (if required)

**Location:** `app/auth/callback/route.ts`

**What happens:**
1. User clicks confirmation link in email
2. Supabase confirms email and creates session
3. System checks `product_context` from user metadata
4. Calls `getProductBasedRedirectUrl()` to determine where to send user

**Redirect Logic:**
- Checks if organization exists
- If organization exists: Redirects to `/admin/crowd-requests`
- If organization missing: Redirects to `/tipjar/onboarding`

---

### 3. **Dashboard Check** (`/tipjar/dashboard`)

**Location:** `app/(marketing)/tipjar/dashboard/page.tsx`

**What happens:**
1. Checks if user is authenticated
2. Verifies `product_context === 'tipjar'`
3. Gets user's organization
4. **Decision:**
   - If no organization: Redirects to `/tipjar/onboarding`
   - If organization exists: Redirects to `/admin/crowd-requests`

**Note:** This page is essentially a router - it almost always redirects users to either onboarding or the admin panel.

---

### 4. **Onboarding Page** (`/tipjar/onboarding`)

**Location:** `app/(marketing)/tipjar/onboarding/page.tsx` (Server Component)

**What happens:**
1. Checks if user is authenticated
2. Verifies `product_context === 'tipjar'`
3. Gets user's organization
4. **Decision:**
   - If organization exists AND has `requests_header_artist_name`: Redirects to `/admin/crowd-requests` (already completed onboarding)
   - Otherwise: Shows onboarding wizard (organization exists but needs setup, OR organization doesn't exist yet)

**Client Component:** `OnboardingPageClient.tsx`

**What happens:**
1. If organization doesn't exist, waits for it (checks every 3 seconds, max 20 attempts = 1 minute)
2. If organization still doesn't exist after 1 minute, creates it via API
3. Once organization exists, shows `TipJarOnboardingWizard` component

---

### 5. **Onboarding Wizard** (5 Steps)

**Location:** `components/tipjar/OnboardingWizard.tsx`

**Steps:**

#### Step 1: Welcome
- Introduces TipJar and explains what they'll get
- Shows value props (collect tips, share page, customize)
- "Get Started" button → Step 2

#### Step 2: Basic Info
- **Display Name** (required): What customers see
- **Location** (optional): Where they perform
- **URL Slug**: Auto-generated from display name, can edit
- Real-time slug availability checking
- Live preview of page URL
- "Continue" button → Step 3

#### Step 3: Payment Setup
- Option to set up Stripe Connect (recommended)
- Option to skip for now
- Shows benefits of payment setup
- Security badges (Stripe, PCI Compliant)
- "Set up payments now" or "Skip for now" → Step 4

#### Step 4: QR Code Screenshot ⭐
- **Confetti animation** when QR code appears
- **Dismissible notification**: "Perfect Screenshot Opportunity!"
- Large QR code prominently displayed
- Page URL with copy button
- Download QR code button
- Footer text: "Song Requests, Shout Outs, and Tips at tipjar.live/[slug]"
- Screenshot-optimized design
- "View Live Page" button → Step 5

#### Step 5: Full Page Preview
- Shows live page in iframe preview
- "Open in New Tab" button
- Page URL display
- "Next Steps" checklist
- "Go to Dashboard" button → Completes onboarding

**On Completion:**
- Saves organization data (display name, slug, location)
- Redirects to `/admin/crowd-requests?onboarding=complete`

---

## Complete Flow Diagram

```
New User Signs Up
       ↓
[Signup API] → Sets product_context: 'tipjar'
       ↓
[Database Trigger] → Auto-creates organization
       ↓
Email Confirmation? (if required)
       ↓
[Auth Callback] → getProductBasedRedirectUrl()
       ↓
Organization exists?
       ├─ YES → /admin/crowd-requests ✅
       └─ NO → /tipjar/onboarding
              ↓
       Organization exists + has basic info?
       ├─ YES → /admin/crowd-requests ✅
       └─ NO → Show Onboarding Wizard
              ↓
       [Wait for org creation if needed]
              ↓
       [Onboarding Wizard - 5 Steps]
              ↓
       Step 1: Welcome
              ↓
       Step 2: Basic Info (display name, location, slug)
              ↓
       Step 3: Payment Setup (Stripe Connect or skip)
              ↓
       Step 4: QR Code Screenshot ⭐ (confetti, screenshot tip)
              ↓
       Step 5: Full Page Preview
              ↓
       Save data → /admin/crowd-requests ✅
```

---

## Key Decision Points

### When does onboarding wizard trigger?

1. **User signs up** → Organization auto-created → Redirected to onboarding
2. **User signs in** → No organization → Redirected to onboarding
3. **User signs in** → Organization exists but no `requests_header_artist_name` → Shows onboarding
4. **User manually visits** `/tipjar/onboarding` → Shows onboarding if not complete

### When does user skip onboarding?

1. **Organization exists** AND `requests_header_artist_name` is set → Redirects to admin dashboard
2. **User already completed** onboarding → Skips wizard

### Organization Creation

**Automatic (via Database Trigger):**
- Triggered when user is created
- Creates organization with:
  - Name from email prefix or business name
  - Slug auto-generated
  - `product_context` from user metadata
  - Default subscription tier: 'starter'
  - Trial period: 14 days

**Manual (via API):**
- If trigger fails or delays, `OnboardingPageClient` creates it after 1 minute
- Calls `/api/organizations/create` endpoint

---

## Environment & Configuration

### Required Settings
- Supabase auth configured
- Database trigger enabled: `handle_new_user_organization()`
- Product context set during signup

### Redirect Logic
- Uses `getProductBasedRedirectUrl()` helper
- Checks `product_context` from user metadata
- Falls back to role-based redirect if needed

---

## Testing the Flow

### Test Scenario 1: New Signup (No Email Confirmation)
1. Sign up at `/tipjar/signup`
2. Should immediately redirect to `/tipjar/dashboard`
3. Dashboard should redirect to `/tipjar/onboarding` (if org not ready)
4. Wizard should appear once organization exists
5. Complete all 5 steps
6. Should redirect to `/admin/crowd-requests`

### Test Scenario 2: New Signup (With Email Confirmation)
1. Sign up at `/tipjar/signup`
2. See "check your email" message
3. Click confirmation link
4. Auth callback should redirect to onboarding or dashboard
5. Complete wizard

### Test Scenario 3: Existing User (Incomplete Onboarding)
1. Sign in with account that has organization but no `requests_header_artist_name`
2. Should see onboarding wizard
3. Complete steps
4. Should redirect to admin dashboard

### Test Scenario 4: Existing User (Completed Onboarding)
1. Sign in with account that has completed onboarding
2. Should redirect directly to `/admin/crowd-requests`
3. Should NOT see onboarding wizard

