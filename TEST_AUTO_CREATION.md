# 🧪 Testing Auto-Creation of Quote, Invoice, and Contract

## Quick Test Instructions

### Option 1: Test via API Endpoint (Recommended)

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **In another terminal, run the test:**
   ```bash
   curl -X POST http://localhost:3000/api/test-auto-creation \
     -H "Content-Type: application/json"
   ```

3. **Or use a tool like Postman/Insomnia:**
   - Method: POST
   - URL: `http://localhost:3000/api/test-auto-creation`
   - Headers: `Content-Type: application/json`

### Option 2: Test via Contact Form

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Submit a contact form** on your website (or via API):
   ```bash
   curl -X POST http://localhost:3000/api/contact \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@example.com",
       "phone": "9015551234",
       "eventType": "Wedding",
       "eventDate": "2025-06-15",
       "location": "Memphis, TN"
     }'
   ```

3. **Check the database** for the created records:
   - Contact in `contacts` table
   - Quote in `quote_selections` table
   - Invoice in `invoices` table
   - Contract in `contracts` table

### Option 3: Check Database Directly

After creating a contact, run these SQL queries in Supabase:

```sql
-- Find the most recent contact
SELECT id, first_name, last_name, email_address, created_at 
FROM contacts 
ORDER BY created_at DESC 
LIMIT 1;

-- Check for quote (replace CONTACT_ID with the ID from above)
SELECT * FROM quote_selections WHERE lead_id = 'CONTACT_ID';

-- Check for invoice
SELECT * FROM invoices WHERE contact_id = 'CONTACT_ID';

-- Check for contract
SELECT * FROM contracts WHERE contact_id = 'CONTACT_ID';

-- Verify links
SELECT 
  q.id as quote_id,
  q.invoice_id,
  q.contract_id,
  i.id as invoice_id_check,
  c.id as contract_id_check
FROM quote_selections q
LEFT JOIN invoices i ON q.invoice_id = i.id
LEFT JOIN contracts c ON q.contract_id = c.id
WHERE q.lead_id = 'CONTACT_ID';
```

## Expected Results

### ✅ Success Indicators

1. **Contact Created** - Contact record exists in `contacts` table
2. **Quote Created** - Quote record in `quote_selections` with:
   - `status` = 'pending'
   - `package_name` = 'Service Selection Pending'
   - `total_price` = 0
3. **Invoice Created** - Invoice record in `invoices` with:
   - `invoice_status` = 'Draft'
   - `invoice_number` = 'INV-YYYYMM-###' (auto-generated)
   - `total_amount` = 0
4. **Contract Created** - Contract record in `contracts` with:
   - `status` = 'draft'
   - `contract_number` = 'CONTRACT-YYYYMM-###' (auto-generated)
5. **All Linked** - Quote has `invoice_id` and `contract_id` set

### ❌ Common Issues

- **Quote not created**: Check console logs for errors
- **Invoice not created**: Verify `invoices` table exists and has correct schema
- **Contract not created**: Verify `contracts` table exists and has correct schema
- **Links missing**: Check that all three records were created before linking

## Manual Verification Checklist

- [ ] Contact created successfully
- [ ] Quote selection record exists
- [ ] Invoice record exists with auto-generated number
- [ ] Contract record exists with auto-generated number
- [ ] Quote links to invoice (`invoice_id` set)
- [ ] Quote links to contract (`contract_id` set)
- [ ] Contract links to invoice (`invoice_id` set)
- [ ] All records have correct `contact_id` or `lead_id`

## Debugging

If something fails:

1. **Check server logs** for error messages
2. **Check database permissions** - ensure service role key has access
3. **Verify table schemas** match expected structure
4. **Check console output** - the function logs detailed information

## Test Endpoint Response

The test endpoint returns:

```json
{
  "success": true,
  "test": {
    "contact": { "exists": true, "id": "..." },
    "quote": { "exists": true, "id": "...", "linked": true },
    "invoice": { "exists": true, "id": "...", "invoice_number": "INV-..." },
    "contract": { "exists": true, "id": "...", "contract_number": "CONTRACT-..." },
    "allCreated": true,
    "allLinked": true
  },
  "message": "✅ All records created and linked successfully!"
}
```

