# 📊 Leads CSV Import Guide

## 🎯 **WHAT THIS DOES**

Imports your leads/projects data from CSV into Supabase contacts table, automatically:
- ✅ Parses names, phones, emails
- ✅ Converts dates to proper format
- ✅ Determines event types from project names
- ✅ Sets lead status (Booked, Qualified, Lost)
- ✅ Prevents duplicate entries
- ✅ Maps your CSV columns to database fields

---

## 📂 **YOUR CSV STRUCTURE**

Your CSV should have these columns (case-sensitive):
1. `Project Name` - Name/description of the event
2. `Full Name` - Client's full name
3. `Email Address` - Client's email
4. `Phone Number` - Client's phone
5. `Project Date` - Date of the event
6. `Lead Created Date` - When the lead was created
7. `Total Project Value` - Dollar amount
8. `Lead Source` - Where the lead came from
9. `Lead Source Open Text` - Additional source details
10. `Booked Date` - When they booked (if applicable)

---

## 🚀 **HOW TO IMPORT**

### **Step 1: Save Your CSV File**

Save your CSV to the project:
```bash
# Create data folder if it doesn't exist
mkdir -p /Users/benmurray/m10dj/data

# Save your CSV there
# Example: /Users/benmurray/m10dj/data/leads.csv
```

### **Step 2: Set Up Environment Variables**

Make sure you have these in your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important:** You need the SERVICE ROLE KEY (not the anon key) because this script bypasses RLS to bulk insert data.

### **Step 3: Run the Import**

```bash
cd /Users/benmurray/m10dj
node scripts/import-leads-from-csv.js data/your-leads.csv
```

---

## 📋 **WHAT GETS MAPPED**

### **CSV → Database Mapping:**

| CSV Column | Maps To | Notes |
|------------|---------|-------|
| Full Name | `first_name` + `last_name` | Automatically splits name |
| Email Address | `email_address` | Used for duplicate detection |
| Phone Number | `phone` | Cleaned (removes formatting) |
| Project Date | `event_date` | Converted to ISO date |
| Lead Created Date | `created_at` | When lead entered system |
| Total Project Value | `quoted_price` + `final_price` | If booked, also sets `final_price` |
| Lead Source | `lead_source` | Direct mapping |
| Lead Source Open Text | `how_heard_about_us` | Additional source info |
| Booked Date | `contract_signed_date` | Triggers "Booked" status |
| Project Name | `event_type` + `notes` | Determines wedding/corporate/etc + saved as note |

### **Automatic Field Population:**

**Event Type Detection** (from Project Name):
- Contains "wedding" → `event_type: 'wedding'`
- Contains "corporate" → `event_type: 'corporate'`
- Contains "birthday" or "party" → `event_type: 'private_party'`
- Contains "school" → `event_type: 'school_dance'`
- Contains "holiday" → `event_type: 'holiday_party'`
- Default → `event_type: 'other'`

**Lead Status** (automatic):
- Has Booked Date → `lead_status: 'Booked'`
- Project Date passed → `lead_status: 'Lost'`
- Otherwise → `lead_status: 'Qualified'`

**Payment Status:**
- Has Booked Date → `payment_status: 'pending'`
- No Booked Date → `payment_status: 'pending'`

**Priority Level:**
- Booked → `priority_level: 'High'`
- Not Booked → `priority_level: 'Medium'`

---

## ✅ **DUPLICATE DETECTION**

The script prevents duplicates by checking:
1. **Email address** - If exists, skip
2. **Phone number** - If exists (and no email match), skip

**What Happens:**
```
⚠️  Row 5: John Smith already exists (abc-123-xyz)
⏭️  Skipped (duplicates/empty): 3
```

---

## 📊 **EXAMPLE IMPORT OUTPUT**

```bash
🚀 Starting lead import...

📂 Reading CSV file...
✅ Found 27 leads to import

✅ Row 2: Imported Sarah Johnson (abc-123-def)
✅ Row 3: Imported Mike Williams (def-456-ghi)
⚠️  Row 4: John Doe already exists (ghi-789-jkl)
✅ Row 5: Imported Emily Davis (jkl-012-mno)
⏭️  Row 6: Skipping empty row
✅ Row 7: Imported Chris Miller (mno-345-pqr)

============================================================
📊 IMPORT SUMMARY
============================================================
✅ Successfully imported: 23
⏭️  Skipped (duplicates/empty): 4
❌ Errors: 0
📝 Total rows processed: 27
============================================================

🎉 Import completed! You can now view your leads in the admin dashboard.

✨ Done!
```

---

## 🔍 **VERIFYING IMPORTED DATA**

### **Option 1: Admin Dashboard**
Visit: https://www.m10djcompany.com/admin/contacts

### **Option 2: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Table Editor" → "contacts"
4. Verify your imported leads

### **Option 3: SQL Query**
```sql
SELECT 
  first_name,
  last_name,
  email_address,
  phone,
  event_type,
  lead_status,
  created_at
FROM contacts
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## ⚠️ **COMMON ISSUES & FIXES**

### **Issue 1: "Missing Supabase environment variables"**

**Fix:**
```bash
# Check if .env.local exists
cat .env.local | grep SUPABASE

# If missing, add:
echo "NEXT_PUBLIC_SUPABASE_URL=your_url_here" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_key_here" >> .env.local
```

### **Issue 2: "File not found"**

**Fix:**
```bash
# Check file path
ls -la data/your-leads.csv

# Use absolute path if needed
node scripts/import-leads-from-csv.js /Users/benmurray/m10dj/data/leads.csv
```

### **Issue 3: "Error: permission denied"**

**Cause:** Using anon key instead of service role key

**Fix:** Get service role key from Supabase:
1. Go to Supabase Dashboard
2. Settings → API
3. Copy "service_role" key (not "anon" key)
4. Update `.env.local`

### **Issue 4: CSV parsing errors**

**Fix:**
- Ensure UTF-8 encoding
- No extra commas in data
- Wrap values with commas in quotes: `"Company, Inc."`
- Use Excel "Save As" → CSV UTF-8

---

## 🎨 **CUSTOMIZING THE IMPORT**

### **Change Event Type Detection:**

Edit `scripts/import-leads-from-csv.js`:

```javascript
function determineEventType(projectName) {
  const name = (projectName || '').toLowerCase();
  if (name.includes('wedding')) return 'wedding';
  if (name.includes('corporate')) return 'corporate';
  // Add your custom rules:
  if (name.includes('bar mitzvah')) return 'other';
  if (name.includes('reunion')) return 'private_party';
  return 'other';
}
```

### **Change Lead Status Logic:**

```javascript
function determineLeadStatus(bookedDate, projectDate) {
  if (bookedDate) return 'Booked';
  if (projectDate && new Date(projectDate) < new Date()) return 'Lost';
  // Add custom logic:
  if (projectDate && new Date(projectDate) < new Date(Date.now() + 30*24*60*60*1000)) {
    return 'Hot Lead'; // Events within 30 days
  }
  return 'Qualified';
}
```

### **Add Custom Fields:**

In `csvRowToContact()` function:

```javascript
return {
  // ... existing fields
  
  // Add custom fields:
  venue_name: row['Venue Name'] || null,
  guest_count: row['Guest Count'] ? parseInt(row['Guest Count']) : null,
  special_requests: row['Special Requests'] || null,
};
```

---

## 🔄 **RE-IMPORTING / UPDATING**

### **If You Need to Re-Import:**

**Option 1: Delete All Contacts First**
```sql
-- ⚠️ CAUTION: This deletes ALL contacts
DELETE FROM contacts WHERE lead_source = 'Your CSV Source';
```

**Option 2: Soft Delete (Recommended)**
```sql
-- Soft delete instead
UPDATE contacts 
SET deleted_at = NOW() 
WHERE lead_source = 'Your CSV Source';
```

**Option 3: Update Existing**
Modify the script to update instead of skip duplicates.

---

## 📈 **POST-IMPORT CHECKLIST**

After successful import:

- [ ] Verify lead count in admin dashboard
- [ ] Check a few random contacts for accuracy
- [ ] Confirm event types are correct
- [ ] Verify booked leads show "Booked" status
- [ ] Check that prices imported correctly
- [ ] Set up follow-up dates for qualified leads
- [ ] Assign leads to team members (if applicable)
- [ ] Review "Lost" leads for potential re-engagement
- [ ] Export a backup of imported data

---

## 🆘 **TROUBLESHOOTING**

### **Script Won't Run:**

```bash
# Check Node.js installed
node --version  # Should be 16+

# Install dependencies
npm install @supabase/supabase-js

# Check file permissions
chmod +x scripts/import-leads-from-csv.js
```

### **All Rows Skipped:**

**Possible Causes:**
1. Data already imported (check duplicates)
2. CSV format incorrect (check column names)
3. Empty rows (check CSV has data)

**Debug:**
```bash
# Check CSV format
head -n 5 data/your-leads.csv

# Check for duplicates in database
# Run in Supabase SQL editor:
SELECT email_address, phone, COUNT(*) 
FROM contacts 
GROUP BY email_address, phone 
HAVING COUNT(*) > 1;
```

### **Dates Not Importing:**

**Fix:** Ensure date format is:
- `MM/DD/YYYY`
- `YYYY-MM-DD`
- `MM-DD-YYYY`

**Test:**
```javascript
// Add to script for debugging
console.log('Parsed date:', parseDate('01/15/2025'));
```

---

## 📞 **SUPPORT**

If you encounter issues:

1. Check error messages in terminal
2. Review `.env.local` variables
3. Verify CSV format matches expected columns
4. Check Supabase logs (Dashboard → Logs)
5. Run with debug mode: `NODE_DEBUG=* node scripts/import-leads-from-csv.js data/leads.csv`

---

## 🎉 **SUCCESS!**

Once imported, your leads will be available in:
- ✅ Admin Contacts Dashboard
- ✅ Supabase contacts table
- ✅ Lead management system
- ✅ Follow-up tracking
- ✅ Revenue reporting

**Next Steps:**
1. Review imported leads
2. Set follow-up dates
3. Reach out to qualified leads
4. Update lead status as you progress

---

**Created:** January 27, 2025  
**Script:** `/scripts/import-leads-from-csv.js`  
**Status:** Ready to use

