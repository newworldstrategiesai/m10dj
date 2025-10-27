# 💼 HoneyBook Data Import Guide

## 🎯 **WHAT THIS DOES**

Imports your **actual booked projects and payments** from HoneyBook into Supabase, including:
- ✅ Client names and emails
- ✅ Project names and dates
- ✅ Payment amounts and status
- ✅ Invoice numbers
- ✅ Transaction fees and net amounts
- ✅ Multiple payments per project
- ✅ Gratuity tracking
- ✅ Automatic event type detection

---

## 📊 **YOUR HONEYBOOK DATA**

Based on your spreadsheet, you have **19 booked projects** including:
- Weddings (Erica Roberts, Amberly, Morgan Dillard, etc.)
- Corporate/Private parties (Palm Coast Christmas, Cobb Lake Season Kickoff)
- Special events (Rock and Soul Museum gig)

**Total Revenue Tracked:** $12,894.50 with detailed payment processing info

---

## 🚀 **HOW TO EXPORT FROM HONEYBOOK**

### **Step 1: Export from HoneyBook**

1. Log into HoneyBook
2. Go to **Reports** or **Projects**
3. Select your date range (Year to Date shown: Jan-Oct 2025)
4. Click **Export** or **Download**
5. Choose **CSV** or **Excel** format
6. Save the file

### **Step 2: Convert to CSV (if needed)**

If you exported to Excel:
1. Open in Excel/Google Sheets
2. **File → Download → CSV** (or **Save As → CSV**)
3. Save as `honeybook-2025.csv`

---

## 📂 **SAVE YOUR FILE**

```bash
# Create data folder
mkdir -p /Users/benmurray/m10dj/data

# Save your HoneyBook export there
# Example: /Users/benmurray/m10dj/data/honeybook-2025.csv
```

---

## 🔧 **SETUP ENVIRONMENT**

Make sure you have Supabase credentials in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Get Service Role Key:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy "service_role" key (NOT the anon key)

---

## ▶️ **RUN THE IMPORT**

```bash
cd /Users/benmurray/m10dj
node scripts/import-honeybook-data.js data/honeybook-2025.csv
```

---

## 📋 **HONEYBOOK COLUMN MAPPING**

### **What Gets Imported:**

| HoneyBook Column | Maps To Database Field | Notes |
|------------------|------------------------|-------|
| **CLIENT_INFO** | `first_name`, `last_name`, `email_address` | Parses "Name (email)" format |
| **PROJECT_NAME** | `event_type`, `notes`, `custom_fields` | Determines wedding/corporate/etc |
| **PROJECT_DATE** | `event_date`, `expected_close_date` | When the event happens |
| **TOTAL_AMOUNT** | `final_price`, `quoted_price` | Project value |
| **NET_AMOUNT** | `deposit_amount` (if retainer) | After fees |
| **PAYMENT_STATUS** | `payment_status` | Paid/Pending |
| **PAYMENT_METHOD** | `notes`, `custom_fields` | Credit Card, ACH, Venmo, etc |
| **INVOICE** | `custom_fields.honeybook_invoice` | Invoice reference |
| **TRANSACTION_DATE** | `contract_signed_date`, `last_contacted_date` | When payment processed |
| **TRANSACTION_FEE** | `internal_notes`, `custom_fields` | Processing fees |
| **GRATUITY** | `notes`, `custom_fields` | Tips added |
| **CHARGE_NOTES** | `notes` | Additional payment notes |

### **Automatic Fields:**

- **lead_status**: Always set to `'Booked'` (these are confirmed projects)
- **lead_source**: Set to `'HoneyBook Import'`
- **priority_level**: Set to `'High'` (booked clients)
- **payment_status**: 
  - `'paid'` if all payments received
  - `'partial'` if some payments pending
- **event_type**: Auto-detected from project name
  - "wedding" → `'wedding'`
  - "corporate", "company" → `'corporate'`
  - "christmas", "holiday" → `'holiday_party'`
  - "party", "birthday" → `'private_party'`
  - "kick off", "lake" → `'private_party'`

---

## 🔍 **SMART FEATURES**

### **1. Multiple Payments Per Project**

The script handles projects with multiple payment rows:

**Example:** Cobb Lake Season Kick Off Party
- Row 5: $652.50 (1 of 1 payments / Retainer) - Apr 9
- Row 6: $200.00 (Additional payment) - May 1

**Result:** 
- Creates ONE contact
- Notes show both payments
- Calculates total paid: $852.50
- Tracks payment count: 2 payments

### **2. Duplicate Prevention**

**Checks:**
1. Email address match
2. Invoice number (won't import same invoice twice)

**Behavior:**
- **New client + new project** → Creates new contact
- **Existing client + new project** → Updates contact, adds project to `additional_projects`
- **Existing client + same project** → Skips (already imported)

### **3. Project Grouping**

Groups rows by `CLIENT_INFO` + `PROJECT_NAME` to handle:
- Multiple payment installments
- Retainer + balance payments
- Payment plan tracking

---

## 📊 **EXAMPLE IMPORT OUTPUT**

```bash
🚀 Starting HoneyBook data import...

📂 Reading HoneyBook CSV file...
✅ Found 19 HoneyBook projects to import

📊 Found 16 unique projects (some with multiple payments)

✅ Project 1: Imported Marq Cobb - "Marq Cobb" ($250.00) [abc-123-def]
✅ Project 2: Imported Maija White - "Palm Coast Christmas Party" ($145.40) [def-456-ghi]
✅ Project 3: Imported Erica Roberts - "Erica Roberts's Project" ($1,314.43) [ghi-789-jkl]
✅ Project 4: Imported Marq Cobb - "Cobb Lake Season Kick Off Party" ($810.75) [jkl-012-mno]
✅ Project 5: Imported April Eva - "Amberly Wedding" ($1,816.04) [mno-345-pqr]
...

============================================================
📊 HONEYBOOK IMPORT SUMMARY
============================================================
✅ New projects imported: 14
🔄 Existing contacts updated: 2
⏭️  Skipped (duplicates/empty): 0
❌ Errors: 0
📝 Total projects processed: 16
============================================================

🎉 Import completed! You can now view your projects in the admin dashboard.
💰 Total revenue tracked: Look for booked contacts with payment details

✨ Done!
```

---

## 🎨 **WHAT YOU'LL SEE IN ADMIN DASHBOARD**

After import, each contact will have:

**Basic Info:**
- ✅ Client name and email
- ✅ Event type (wedding, corporate, etc.)
- ✅ Event date
- ✅ Lead status: "Booked"

**Financial Details:**
- ✅ Quoted price (from PAYMENT_BEFORE_DISCOUNT or TOTAL_AMOUNT)
- ✅ Final price (from TOTAL_AMOUNT)
- ✅ Deposit amount (from retainer payments)
- ✅ Payment status (Paid/Partial)

**Notes Section:**
```
Project: Amberly Wedding
Invoice: #000048-002
Payment Method: Credit Card
Notes: 1 of 1 payments / Retainer
Gratuity: $200

---

Transaction Fee: $55.06
Net Amount: $1816.04
Total Payments: 1
Total Paid: $1816.04
```

**Custom Fields (JSON):**
```json
{
  "honeybook_invoice": "#000048-002",
  "honeybook_project_name": "Amberly Wedding",
  "payment_method": "Credit Card",
  "transaction_fee": 55.06,
  "net_amount": 1816.04,
  "gratuity": 200,
  "tax_amount": 0
}
```

---

## 🔄 **UPDATING EXISTING DATA**

### **If You Need to Re-Import:**

**Option 1: Import New Projects Only**
- Script automatically skips duplicates
- Only imports new invoices

**Option 2: Clear HoneyBook Imports and Re-import**
```sql
-- Delete all HoneyBook imports
DELETE FROM contacts 
WHERE lead_source = 'HoneyBook Import';
```

**Option 3: Soft Delete**
```sql
-- Soft delete instead
UPDATE contacts 
SET deleted_at = NOW() 
WHERE lead_source = 'HoneyBook Import';
```

---

## 📈 **REVENUE REPORTING**

After import, run queries to analyze your business:

### **Total Revenue by Event Type:**
```sql
SELECT 
  event_type,
  COUNT(*) as project_count,
  SUM(final_price) as total_revenue,
  AVG(final_price) as avg_project_value
FROM contacts
WHERE lead_status = 'Booked'
  AND deleted_at IS NULL
GROUP BY event_type
ORDER BY total_revenue DESC;
```

### **Upcoming Events:**
```sql
SELECT 
  first_name,
  last_name,
  email_address,
  event_type,
  event_date,
  final_price,
  payment_status
FROM contacts
WHERE lead_status = 'Booked'
  AND event_date >= CURRENT_DATE
  AND deleted_at IS NULL
ORDER BY event_date ASC;
```

### **Payment Status Overview:**
```sql
SELECT 
  payment_status,
  COUNT(*) as count,
  SUM(final_price) as total_value
FROM contacts
WHERE lead_status = 'Booked'
  AND deleted_at IS NULL
GROUP BY payment_status;
```

---

## ⚠️ **COMMON ISSUES & FIXES**

### **Issue 1: "File not found"**

**Fix:**
```bash
# Check file exists
ls -la data/honeybook-2025.csv

# Use full path if needed
node scripts/import-honeybook-data.js /Users/benmurray/m10dj/data/honeybook-2025.csv
```

### **Issue 2: CSV parsing errors**

**Cause:** HoneyBook uses tab-separated values (TSV), not comma-separated

**Fix:** 
- Save as "Tab Delimited Text (.txt)"
- Or ensure proper delimiter in CSV export

### **Issue 3: Client names not parsing**

**Expected format:** `Name (email@example.com)`

**If different format:**
Edit `parseClientInfo()` function in script:
```javascript
function parseClientInfo(clientInfo) {
  // Add custom parsing logic here
}
```

### **Issue 4: Event types wrong**

**Customize detection:**
```javascript
function determineEventType(projectName) {
  const name = (projectName || '').toLowerCase();
  // Add your custom rules
  if (name.includes('gala')) return 'corporate';
  if (name.includes('reunion')) return 'private_party';
  // etc...
}
```

---

## 🎯 **POST-IMPORT CHECKLIST**

- [ ] Verify all 16-19 projects imported
- [ ] Check revenue totals match HoneyBook
- [ ] Confirm payment statuses are correct
- [ ] Review upcoming events (event_date >= today)
- [ ] Check for duplicate contacts
- [ ] Verify invoice numbers in custom_fields
- [ ] Set up follow-up reminders for upcoming events
- [ ] Review payment status for pending balance collections
- [ ] Export backup of imported data

---

## 💡 **PRO TIPS**

### **Regular Imports:**
Set up monthly imports to keep your CRM in sync:
```bash
# Monthly routine
# 1. Export from HoneyBook
# 2. Save as data/honeybook-YYYY-MM.csv
# 3. Run import
node scripts/import-honeybook-data.js data/honeybook-2025-01.csv
```

### **Revenue Tracking:**
Create a dashboard view showing:
- Total booked value
- Payments received vs outstanding
- Average project value by type
- Monthly booking trends

### **Client Follow-up:**
After import, use admin dashboard to:
- Send pre-event reminders (1 week before)
- Request testimonials (1 week after)
- Follow up on partial payments
- Send thank you emails

---

## 🆘 **TROUBLESHOOTING**

### **Script Won't Run:**
```bash
# Check Node.js version
node --version  # Should be 16+

# Install dependencies
npm install @supabase/supabase-js

# Check file permissions
chmod +x scripts/import-honeybook-data.js
```

### **All Rows Skipped:**
```bash
# Check if already imported
# Run in Supabase SQL editor:
SELECT COUNT(*) 
FROM contacts 
WHERE lead_source = 'HoneyBook Import';
```

### **Debug Mode:**
Add logging to script:
```javascript
// In honeyBookRowToContact function
console.log('Processing:', row.PROJECT_NAME, row.CLIENT_INFO);
```

---

## 📊 **YOUR CURRENT DATA (from screenshot)**

Based on your HoneyBook export, you have:

**Total Projects:** 19 payment records (likely 16 unique projects)
**Date Range:** Dec 2024 - Oct 2025
**Total Amount:** $13,436.07 (before fees)
**Net Amount:** $12,894.50 (after fees)
**Payment Methods:** Credit Card, ACH, Venmo

**Sample Projects:**
1. ✅ Marq Cobb - Dec 31, 2024 - $250
2. ✅ Palm Coast Christmas Party - Dec 19, 2024 - $145.40
3. ✅ Erica Roberts's Project - Apr 26, 2025 - $1,314.43
4. ✅ Amberly Wedding - May 24, 2025 - $1,816.04
5. ✅ Morgan Dillard's Project - May 31, 2025 - $2,143.25
... and more

---

## 🎉 **READY TO IMPORT!**

```bash
# Quick start
cd /Users/benmurray/m10dj
node scripts/import-honeybook-data.js data/honeybook-2025.csv
```

**All your booked projects will be in your CRM with full payment tracking! 💼**

---

**Created:** January 27, 2025  
**Script:** `/scripts/import-honeybook-data.js`  
**Status:** Ready for your 19 HoneyBook projects

