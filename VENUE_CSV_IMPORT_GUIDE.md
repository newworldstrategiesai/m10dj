# Venue CSV Import Guide

This guide explains how to import the top 100 venues CSV file into your `preferred_venues` database table.

## 📋 Overview

The system is now configured to:
1. **Prioritize local venues** from your `preferred_venues` database
2. **Fall back to Google Places API** if local venues don't match
3. **Combine results** intelligently (local venues appear first)

## 📁 CSV File Format

Your CSV file should have the following columns:

### Required Columns:
- `venue_name` - Name of the venue (e.g., "The Peabody Hotel")
- `address` - Street address (e.g., "149 Union Ave")
- `city` - City name (e.g., "Memphis")
- `state` - State abbreviation (e.g., "TN")
- `zip_code` - ZIP code (e.g., "38103")

### Optional Columns:
- `venue_type` - Type of venue (`wedding`, `hotel`, `restaurant`, `outdoor`, `historic`, `banquet_hall`, `country_club`, `corporate`, `other`)
- `website` - Venue website URL
- `description` - Description of the venue
- `capacity_min` - Minimum capacity (integer)
- `capacity_max` - Maximum capacity (integer)
- `amenities` - Comma-separated list of amenities (e.g., "parking, outdoor space, catering")

### Example CSV:

```csv
venue_name,address,city,state,zip_code,venue_type,website,description,capacity_min,capacity_max,amenities
The Peabody Hotel,149 Union Ave,Memphis,TN,38103,hotel,https://www.peabodymemphis.com,Iconic luxury hotel with historic charm,50,400,"parking, elegant decor, accommodations, catering available"
Memphis Botanic Garden,750 Cherry Rd,Memphis,TN,38117,outdoor,https://membg.org,96-acre garden oasis with indoor and outdoor venues,50,300,"outdoor space, garden, scenic views, parking"
```

**Note:** If optional columns are missing, the script will auto-detect venue types and amenities from the description.

## 🚀 Import Process

### Step 1: Prepare Your CSV File

1. Save your CSV file (e.g., `top-100-venues.csv`)
2. Ensure it follows the format above
3. Place it in a convenient location (e.g., `data/top-100-venues.csv`)

### Step 2: Set Environment Variables

Make sure you have your Supabase credentials set:

```bash
# In your .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Run the Import Script

```bash
# From the project root directory
node scripts/import-venues-csv.js data/top-100-venues.csv
```

Or with an absolute path:

```bash
node scripts/import-venues-csv.js /absolute/path/to/top-100-venues.csv
```

### Step 4: Verify Import

The script will:
- ✅ Parse your CSV file
- ✅ Check for duplicates (skips existing venues)
- ✅ Process and format venue data
- ✅ Insert venues in batches of 10
- ✅ Show a summary report

**Example output:**

```
📂 Reading CSV file: data/top-100-venues.csv
✅ Parsed CSV: 100 venues found
📋 Columns: venue_name, address, city, state, zip_code, venue_type, website, description
✅ Processed 100 venues
🔍 Checking for existing venues...
📤 Importing 100 venues in batches of 10...
✅ Batch 1/10: Imported 10 venues
✅ Batch 2/10: Imported 10 venues
...
📊 Import Summary:
   ✅ Successfully imported: 100 venues
   ⚠️  Duplicates skipped: 0 venues
   ❌ Errors: 0 batch(es)

✅ Import complete!
```

## 🔍 How It Works

### Venue Type Detection

If `venue_type` is missing, the script automatically determines it from:
- Venue name keywords (e.g., "hotel", "garden", "museum")
- Description keywords (e.g., "ballroom", "outdoor", "historic")

### Amenity Extraction

If `amenities` is missing, the script extracts them from the description:
- Keywords like "parking", "outdoor space", "catering", etc.

### Capacity Parsing

If capacity is missing, the script:
- Looks for patterns like "100 guests" in the description
- Uses default values (50-250) if no capacity is found

## 🎯 Venue Search Priority

Once imported, when users search for venues:

1. **Local Database First** - Searches `preferred_venues` table
   - Matches by venue name (partial match)
   - Matches by address or city (partial match)
   - Returns up to 5 results immediately

2. **Google Places Fallback** - If local results < 5
   - Fetches from Google Places API
   - Combines with local results
   - Prioritizes local venues in the results list

3. **Smart Deduplication** - Avoids showing the same venue twice

## 📝 Tips

### Handling Duplicates

- The script automatically skips venues that already exist (by name + city)
- No need to worry about importing the same venue twice
- To update existing venues, modify them in the database directly

### Batch Processing

- Venues are imported in batches of 10 to avoid overwhelming the database
- If one batch fails, others will still process
- Check the error log for any issues

### Data Quality

- Ensure venue names are consistent (e.g., don't mix "The Peabody" and "Peabody Hotel")
- Use full addresses when possible for better matching
- Include descriptions to help with automatic amenity detection

## 🐛 Troubleshooting

### "File not found" Error

- Check the file path is correct
- Use absolute paths if relative paths don't work
- Ensure the file exists and is readable

### "Missing Supabase credentials" Error

- Verify your `.env.local` file has the correct variables
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart your terminal/server after updating environment variables

### Import Errors

- Check the console output for specific error messages
- Verify your CSV format matches the expected structure
- Ensure all required columns are present
- Check for special characters that might break parsing (use quotes for fields with commas)

### Duplicate Detection Issues

- The script matches by `venue_name + city`
- If you have venues with the same name in different cities, they'll both be imported
- Venues with slight name variations (e.g., "The Peabody" vs "Peabody Hotel") will both be imported

## 📚 Next Steps

After importing:

1. **Verify venues** in your admin panel (`/admin/venues`)
2. **Test venue search** on the contact form
3. **Monitor search behavior** - local venues should appear first
4. **Update venue details** as needed in the database

## 🔄 Re-importing

To import additional venues:

- Simply run the script again with your updated CSV
- The script will skip duplicates automatically
- Only new venues will be added

---

**Questions?** Check the console output for detailed error messages or review the script at `scripts/import-venues-csv.js`.

