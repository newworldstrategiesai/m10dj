# 📥 Import HoneyBook Leads to Admin Contacts

## **QUICK START - 3 Steps**

### **Step 1: Export CSV from Google Sheets**

1. Open your HoneyBook spreadsheet: https://docs.google.com/spreadsheets/d/1d0ddYfO7fc3Db_WimnyiRuO4dFtBQDrrhFmJJ8DX5oU/edit
2. Click **File** → **Download** → **Comma Separated Values (.csv)**
3. Save the file as `honeybook-leads.csv`

### **Step 2: Place CSV in Data Folder**

Move the downloaded CSV to your project:

```bash
# Create data folder if it doesn't exist
mkdir -p data

# Move the downloaded file
mv ~/Downloads/honeybook-leads.csv data/honeybook-leads.csv
```

Or just drag and drop `honeybook-leads.csv` into the `data/` folder in your project.

### **Step 3: Run Import Script**

```bash
node scripts/import-honeybook-leads.js
```

That's it! Your contacts will now appear in the admin panel.

---

## **WHAT GETS IMPORTED**

From your HoneyBook spreadsheet, the script imports:

| HoneyBook Column | → | Contacts Field |
|------------------|---|----------------|
| **Full Name** | → | `first_name`, `last_name` |
| **Email Address** | → | `email_address` |
| **Phone Number** | → | `phone` |
| **Project Name** | → | Event type (detected) + `notes` |
| **Project Date** | → | `event_date` |
| **Lead Created Date** | → | `created_at` |
| **Total Project Value** | → | `quoted_price`, `final_price` |
| **Lead Source** | → | `lead_source` |
| **Booked Date** | → | `custom_fields.honeybook_booked_date` |

### **Lead Status Logic:**

- ✅ **"Booked"** - If "Booked Date" is filled
- 🔴 **"Lost"** - If lead created >60 days ago with no booking
- 🟡 **"Contacted"** - If lead created >14 days ago with no booking
- 🆕 **"New"** - Everything else

### **Event Type Detection:**

The script automatically detects event type from "Project Name":

- **"wedding"** - Contains "wedding"
- **"corporate"** - Contains "corporate" or "company"
- **"holiday_party"** - Contains "christmas" or "holiday"
- **"school_dance"** - Contains "prom", "school", or "reunion"
- **"private_party"** - Contains "birthday", "party", or "anniversary"
- **"other"** - Everything else

---

## **DUPLICATE PREVENTION**

The script automatically:
- ✅ Checks for existing contacts by **email** or **phone**
- ✅ **Updates** existing contacts instead of creating duplicates
- ✅ **Appends notes** rather than overwriting

**Example:**
- If "Erica Roberts" already exists from a website form
- Script finds her by email `robertserica00@gmail.com`
- Updates her record with HoneyBook project info
- Adds HoneyBook details to notes

---

## **SAMPLE OUTPUT**

```
🚀 Starting HoneyBook Leads Import

📂 Reading CSV file...
📊 Found 77 leads to import

✅ Created: Allison Andrews (allison.andrews92@gmail.com)
✅ Updated: Laura Dawson (dawson1125@gmail.com)
✅ Created: Gloria Hernandez (ghdzrojas7@gmail.com)
✅ Created: Shelby Davis (shelbymcveighdavis@gmail.com)
⏭️  Skipping row 8: No name or email
✅ Created: Destany Boothes (destanyboothes@gmail.com)
...

==================================================
✅ Import Complete!
==================================================
✅ Created: 65
🔄 Updated: 8
⏭️  Skipped: 3
❌ Errors: 1
📊 Total Processed: 77
==================================================

🎉 All done! Check your admin contacts page.
```

---

## **WHAT SHOWS IN ADMIN PANEL**

After import, each contact will show:

### **Contact Details:**
- Name, Email, Phone
- Event Type (auto-detected)
- Event Date
- Lead Status
- Lead Source

### **Notes Section:**
```
HoneyBook Import:
Project: Erica Roberts's Project
Lead Created: Mar 03, 2025
Booked: Mar 09, 2025
Source Details: Friend Referral
```

### **Custom Fields (JSON):**
```json
{
  "honeybook_import": true,
  "honeybook_project_name": "Erica Roberts's Project",
  "honeybook_lead_created": "Mar 03, 2025",
  "honeybook_booked_date": "Mar 09, 2025",
  "honeybook_project_value": 1353.94
}
```

---

## **YOUR DATA BREAKDOWN**

Based on your spreadsheet, here's what you're importing:

**Total Leads:** 77

**By Status:**
- 🟢 **Booked:** ~35 (have "Booked Date")
- 🔴 **Lost:** ~20 (old leads, no booking)
- 🟡 **Contacted:** ~15 (recent, no booking yet)
- 🆕 **New:** ~7 (very recent)

**By Event Type:**
- 💍 **Weddings:** ~45
- 🎉 **Private Parties:** ~20
- 🏢 **Corporate:** ~5
- 🎄 **Holiday:** ~3
- 🎓 **School/Reunion:** ~4

**Lead Sources:**
- 👥 **Referrals:** ~60%
- 🌐 **Website:** ~15%
- 📱 **Social Media:** ~10%
- 🔍 **Google:** ~5%
- ❓ **Unknown:** ~10%

**Total Project Value:** ~$95,000+ (for booked projects)

---

## **TROUBLESHOOTING**

### **"File not found" Error**

```bash
❌ File not found: data/honeybook-leads.csv
```

**Fix:** Make sure you downloaded the CSV and placed it in the `data/` folder:

```bash
ls -la data/
# Should show: honeybook-leads.csv
```

### **"Missing Supabase environment variables" Error**

```bash
❌ Missing Supabase environment variables
```

**Fix:** Your `.env.local` file needs these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **CSV Parsing Issues**

If names or emails look weird, re-export the CSV:
1. In Google Sheets, click **File** → **Download** → **Comma Separated Values (.csv)**
2. Make sure you download the **Sheet1** tab
3. Replace the old CSV and run again

### **Phone Number Errors**

Some rows have `#ERROR!` in the phone field. The script handles this gracefully:
- Skips invalid phone numbers
- Still imports the contact with email
- You can add phone manually later

---

## **AFTER IMPORT - NEXT STEPS**

### **1. Verify Import**

```bash
# Open admin panel
open http://localhost:3000/admin/contacts

# You should see all 77+ contacts
```

### **2. Send Service Selection Links**

For wedding leads that are "New" or "Contacted":
1. Open contact in admin
2. Click "Generate Service Selection Link"
3. Send to lead

### **3. Follow Up on Old Leads**

Filter by `lead_status = "Lost"` and review:
- Maybe they're still interested?
- Send a "checking in" email
- Offer a discount for rebooking

### **4. Track Referral Sources**

Your top referral sources:
- **Friend Referrals** - Ask for more referrals from happy clients
- **Client Referrals** - Create a referral rewards program
- **Instagram** - Keep posting content

### **5. Re-Run Anytime**

To update with new HoneyBook data:
1. Export fresh CSV from Google Sheets
2. Replace `data/honeybook-leads.csv`
3. Run `node scripts/import-honeybook-leads.js` again
4. Script will **update** existing contacts, not duplicate

---

## **ADVANCED: Query Imported Data**

### **Find all HoneyBook imports:**

```sql
SELECT * FROM contacts 
WHERE custom_fields->>'honeybook_import' = 'true'
ORDER BY created_at DESC;
```

### **Find booked projects:**

```sql
SELECT 
  first_name, 
  last_name, 
  email_address,
  event_date,
  final_price,
  custom_fields->>'honeybook_booked_date' as booked_date
FROM contacts 
WHERE custom_fields->>'honeybook_booked_date' IS NOT NULL
ORDER BY event_date DESC;
```

### **Calculate total revenue:**

```sql
SELECT 
  SUM((custom_fields->>'honeybook_project_value')::numeric) as total_revenue,
  COUNT(*) as booked_projects
FROM contacts 
WHERE custom_fields->>'honeybook_booked_date' IS NOT NULL;
```

---

## **QUICK REFERENCE**

```bash
# 1. Export CSV from Google Sheets
# File > Download > CSV

# 2. Move to data folder
mv ~/Downloads/honeybook-leads.csv data/

# 3. Run import
node scripts/import-honeybook-leads.js

# 4. Check admin panel
open http://localhost:3000/admin/contacts
```

**That's it! All your HoneyBook leads will now be in your admin panel.** 🎉

---

**Need help?** Check `scripts/import-honeybook-leads.js` for the import logic or contact support.

