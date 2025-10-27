# 🚨 URGENT: Run This SQL to Create Invoices Table

## Why No Invoices Are Showing

The `invoices` table hasn't been created yet! You need to run the SQL migration.

## HOW TO FIX (2 minutes):

### Option 1: Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. **Go to SQL Editor** (left sidebar)
3. **Click "New Query"**
4. **Copy and paste** the entire contents of this file:
   ```
   supabase/migrations/20250127000002_create_invoices_table_fixed.sql
   ```
5. **Click "Run"** (or press Cmd+Enter)
6. **Wait for "Success"** message

### Option 2: Copy SQL Directly

Open `supabase/migrations/20250127000002_create_invoices_table_fixed.sql` in your editor, copy ALL 318 lines, and paste into Supabase SQL Editor.

## After Running the SQL:

Run this command to generate invoices:

```bash
cd /Users/benmurray/m10dj
export $(cat .env.local | grep -v '^#' | xargs)
node scripts/generate-invoices-from-payments.js
```

This will create ~39 invoices from your HoneyBook data!

## What the SQL Creates:

✅ `invoices` table - Main invoice records
✅ `invoice_line_items` table - Detailed line items for each invoice
✅ `invoice_summary` view - Powers the /admin/invoices dashboard
✅ `overdue_invoices` view - Shows overdue invoices
✅ `monthly_invoice_stats` view - Monthly invoice analytics
✅ Automatic functions and triggers for invoice management

## Then Visit:

- `/admin/invoices` - Beautiful invoices dashboard
- `/admin/invoices/[id]` - Individual invoice details
- `/admin/projects` - 39 projects already there! ✅
- `/admin/financial` - Financial dashboard with revenue stats ✅

---

**The SQL file is in your project at:**
`/Users/benmurray/m10dj/supabase/migrations/20250127000002_create_invoices_table_fixed.sql`

