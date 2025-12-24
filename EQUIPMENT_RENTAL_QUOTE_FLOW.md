# Equipment Rental Quote & Payment Flow

## Current Wedding Flow (Reference)

The wedding flow works as follows:

### 1. Contact Creation
When a wedding lead comes in via contact form:
- Creates a `contact_submissions` record
- Automatically calls `autoCreateQuoteInvoiceContract()` which creates:
  - `quote_selections` record (draft, linked to contact_id)
  - `invoices` record (draft, linked to contact_id)
  - `contracts` record (draft, linked to contact_id)

### 2. Quote Page
- URL: `/quote/[id]` where `id` = contact/submission ID
- Customer selects package/services
- Saves to `quote_selections` table

### 3. Invoice Page
- URL: `/quote/[id]/invoice`
- Displays invoice with line items
- Auto-creates invoice if needed via `ensureInvoiceExists()`

### 4. Payment Page
- URL: `/quote/[id]/payment`
- Handles Stripe payment processing
- Supports deposit or full payment
- Updates invoice status

### Key Database Structure:
```
contacts (or contact_submissions)
  └─ id (UUID) ← This is the quote ID!
      ├─ quote_selections (lead_id = contact.id)
      ├─ invoices (contact_id = contact.id)
      └─ contracts (contact_id = contact.id)
```

## Adapting for Equipment Rentals

### Flow When Customer Confirms via Email

When a customer replies "yes" to confirm equipment rental:

#### Step 1: Parse Email Reply
- Monitor email replies to the generated email
- Detect confirmation intent (keywords: "yes", "confirm", "proceed", "book", etc.)
- Extract contact_submission ID from email thread/conversation

#### Step 2: Ensure Contact Record Exists
If the lead is still in `contact_submissions` table:
- Option A: Convert to `contacts` using existing migration logic
- Option B: Use `contact_submissions` ID directly (quote system supports both)

#### Step 3: Create Quote Selection
Create a `quote_selections` record with equipment rental details:

```javascript
const quoteData = {
  lead_id: contactId, // or submissionId
  package_id: 'equipment_rental', // or specific package
  package_name: 'Equipment Rental Package', // e.g., "Basic Sound Package - $300"
  package_price: 300, // Minimum $300
  addons: [], // Additional equipment if any
  total_price: 300, // Total rental price (must be >= $300)
  status: 'pending',
  organization_id: organizationId
};
```

#### Step 4: Create Invoice
Use `ensureInvoiceExists()` function (already exists) to create invoice:

```javascript
import { ensureInvoiceExists } from '@/utils/ensure-invoice-exists';

const result = await ensureInvoiceExists(contactId, supabaseAdmin);
// This automatically:
// - Creates invoice if doesn't exist
// - Links it to quote_selection
// - Generates invoice number
// - Sets correct organization_id
```

#### Step 5: Send Quote/Invoice Link
Email them with the link:

```javascript
const quoteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${contactId}`;
const invoiceUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${contactId}/invoice`;
```

## Implementation: API Endpoint for Email Confirmation

Create: `pages/api/leads/[id]/create-equipment-quote.js`

```javascript
// This endpoint creates quote/invoice when customer confirms equipment rental
// Called when admin processes email reply or when automated system detects confirmation

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query; // contact_submission ID
  const { equipmentDetails, totalPrice } = req.body;

  // 1. Get submission/contact
  // 2. Ensure contact record exists (convert if needed)
  // 3. Create quote_selection with equipment details
  // 4. Call ensureInvoiceExists() to create invoice
  // 5. Return quote URL
}
```

## Email Template Update

Update the equipment rental email to include:

1. **Initial Email** (already generated):
   - Pricing information
   - Call to action: "Reply 'yes' to confirm" or "Call to book"

2. **Confirmation Email** (after they confirm):
   - "Great! I've prepared your quote and invoice"
   - Link to quote page: `https://m10djcompany.com/quote/[id]`
   - Link to invoice page: `https://m10djcompany.com/quote/[id]/invoice`
   - Instructions on next steps

## Integration Points

### 1. Email Reply Detection
- Option A: Gmail API webhook (if using Gmail integration)
- Option B: Manual trigger in admin panel
- Option C: Automated email parsing service

### 2. Quote Creation Trigger
- Manual: Admin clicks "Create Quote" button on lead details page
- Automated: Email reply parsing detects confirmation

### 3. Link Generation
Use existing quote system - it already supports:
- Quote selection: `/quote/[id]`
- Invoice view: `/quote/[id]/invoice`
- Payment: `/quote/[id]/payment`
- Contract: `/quote/[id]/contract`

## Key Differences: Equipment Rental vs Wedding

| Aspect | Wedding | Equipment Rental |
|--------|---------|------------------|
| Package Selection | Customer selects on quote page | Pre-defined based on email |
| Quote Creation | Auto-created on contact creation | Created when customer confirms |
| Minimum Price | Varies by package | $300 minimum |
| Contract Required | Yes (wedding contracts) | Optional (simpler agreement) |
| Invoice Timing | After quote selection | Immediately on confirmation |

## Next Steps

1. **Create API endpoint** for equipment quote creation
2. **Add "Create Quote" button** to lead details page for equipment rentals
3. **Update email generation** to include clearer confirmation instructions
4. **Build email reply parser** (optional automation)
5. **Test flow end-to-end** with a real equipment rental inquiry

