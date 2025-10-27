# ⚡ Quick Setup: Payments Table

## **🎯 WHAT TO DO NOW (5 minutes)**

### **Step 1: Create Payments Table in Supabase**

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy **ALL** the SQL from: `supabase/migrations/20250127000001_create_payments_table.sql`
5. Paste into the SQL editor
6. Click **"Run"** (or press Cmd+Enter)

**Expected result:** "Success. No rows returned"

---

### **Step 2: Import Your Payments**

```bash
# Make sure you're in the project directory
cd /Users/benmurray/m10dj

# Run the import
export $(cat .env.local | grep -v '^#' | xargs) && node scripts/import-honeybook-payments.js
```

**Expected result:**
```
💰 Starting HoneyBook Payments Import
📊 Found 18 payments to import
✅ Imported: Marq Cobb - $250 (1 of 1 payments / Retainer)
✅ Imported: Erica Roberts - $1353.94 (1 of 1 payments / Retainer)
...
✅ Import Complete!
✅ Created: 18
💰 FINANCIAL SUMMARY:
   Gross Revenue: $13,436.07
   Processing Fees: $541.57 (4.03%)
   Net Revenue: $12,894.50
```

---

## **✅ WHAT YOU'LL GET**

### **1. Payments Table** 
Complete financial transaction tracking with:
- All payment details (amounts, dates, methods)
- Processing fees breakdown
- Tax information
- Links to contacts
- Payment plans tracking (1 of 2, 2 of 2, etc.)

### **2. SQL Views**
Ready-to-use financial reports:
- `outstanding_balances` - Who owes what
- `monthly_revenue` - Revenue by month with fees
- `payment_method_stats` - Fee analysis by payment method
- `client_payment_summary` - Per-client payment history

### **3. Auto-Updates**
- Contact `final_price` updates automatically when payments received
- Overdue payment detection
- Payment status tracking

---

## **📊 AFTER IMPORT - CHECK YOUR DATA**

### **Query Your Payments:**

```sql
-- See all payments
SELECT 
  payment_name,
  total_amount,
  net_amount,
  transaction_fee,
  payment_method,
  transaction_date
FROM payments
ORDER BY transaction_date DESC;

-- Monthly revenue
SELECT * FROM monthly_revenue;

-- Outstanding balances
SELECT * FROM outstanding_balances
WHERE balance_due > 0;

-- Fee analysis by payment method
SELECT * FROM payment_method_stats;
```

---

## **🎯 NEXT STEPS (I'll do these)**

Once the table is created and data imported, I'll add:

✅ Payment history to contact detail pages  
✅ Financial dashboard for admin  
✅ Revenue charts and analytics  
✅ Fee optimization recommendations  

---

## **❓ TROUBLESHOOTING**

### **"relation 'payments' does not exist"**
→ You need to run the SQL migration first (Step 1 above)

### **"permission denied for table payments"**
→ Make sure you're using the service role key in .env.local

### **"No contact found for email@example.com"**
→ Normal! Some payments don't have matching contacts yet
→ They'll still import, just without contact link

---

## **📝 SQL TO RUN (Copy This)**

Go to Supabase SQL Editor and run this entire file:
`supabase/migrations/20250127000001_create_payments_table.sql`

It's ~250 lines but creates everything you need in one go!

---

**Let me know once you've run the SQL migration and I'll continue with the UI components!** 🚀

