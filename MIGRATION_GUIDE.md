# 🔄 Contact Submissions Migration Guide

This guide helps you migrate existing form submissions from the `contact_submissions` table to the new comprehensive `contacts` table.

## 📋 Overview

The migration process will:
- ✅ Convert all existing form submissions to contact records
- ✅ Parse names into first_name and last_name
- ✅ Standardize event types (wedding, corporate, school_dance, etc.)
- ✅ Map submission status to lead status
- ✅ Assign all contacts to your admin user account
- ✅ Skip duplicates based on email/phone number
- ✅ Preserve original timestamps and data

## 🚀 Migration Steps

### Step 1: Preview Migration
First, preview what will be migrated without making any changes:

```bash
# Visit in browser or use curl:
GET http://localhost:3001/api/preview-submissions-migration
```

This will show you:
- How many submissions will be migrated
- How many duplicates will be skipped
- Sample of the data transformation
- Existing contacts count

### Step 2: Set Environment Variable
Make sure your admin user ID is set in `.env.local`:

```bash
DEFAULT_ADMIN_USER_ID=aa23eed5-de23-4b28-bc5d-26e72077e7a8
```

### Step 3: Run Migration
Execute the migration:

```bash
# Using curl:
curl -X POST http://localhost:3001/api/migrate-submissions-to-contacts

# Or visit in browser and use developer tools console:
fetch('/api/migrate-submissions-to-contacts', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);
```

## 🎯 Data Mapping

### Contact Submissions → Contacts
| From (contact_submissions) | To (contacts) | Transformation |
|----------------------------|---------------|----------------|
| `name` | `first_name`, `last_name` | Split on first space |
| `email` | `email_address` | Direct copy |
| `phone` | `phone` | Direct copy |
| `event_type` | `event_type` | Standardized values |
| `event_date` | `event_date` | Direct copy |
| `location` | `venue_name` | Direct copy |
| `message` | `special_requests` | Direct copy |
| `status` | `lead_status` | Mapped values |
| `created_at` | `created_at` | Preserved |

### Status Mapping
| Submission Status | Lead Status |
|------------------|-------------|
| `new` | `New` |
| `contacted` | `Contacted` |
| `quoted` | `Proposal Sent` |
| `booked` | `Booked` |
| `completed` | `Completed` |
| `cancelled` | `Lost` |

### Event Type Standardization
| Input | Standardized |
|-------|-------------|
| "Wedding", "wedding", "Wedding Reception" | `wedding` |
| "Corporate", "corporate event", "company party" | `corporate` |
| "School dance", "prom", "homecoming" | `school_dance` |
| "Holiday party", "Christmas party" | `holiday_party` |
| "Private party", "birthday", "anniversary" | `private_party` |
| Everything else | `other` |

## 🔍 Duplicate Detection

The migration will skip creating contacts if:
- **Email match**: Same email already exists in contacts (case-insensitive)
- **Phone match**: Same phone number already exists (digits only comparison)

Skipped records will be reported in the migration results.

## 📊 Additional Fields Set

The migration automatically sets these additional fields:

```javascript
{
  // Lead Management
  lead_source: 'Website',
  lead_stage: 'Initial Inquiry', 
  lead_temperature: 'Hot|Warm|Cold', // Based on submission age
  lead_quality: 'Medium',
  lead_score: 50,
  
  // Business Tracking
  assigned_to: adminUserId,
  priority_level: 'Medium',
  
  // Communication
  communication_preference: phone ? 'any' : 'email',
  
  // Metadata
  tags: [event_type, 'migrated_from_submissions']
}
```

## 📈 Expected Results

After migration, you'll have:
- ✅ All form submissions converted to full contact records
- ✅ Enhanced CRM data for better lead management
- ✅ Integrated data in the contacts system
- ✅ Preserved original submission data
- ✅ Chat system integration ready
- ✅ Advanced filtering and search capabilities

## 🛠️ Troubleshooting

### Missing Environment Variable
```
Error: DEFAULT_ADMIN_USER_ID not configured
```
**Solution**: Add `DEFAULT_ADMIN_USER_ID=aa23eed5-de23-4b28-bc5d-26e72077e7a8` to `.env.local`

### Database Permission Errors
```
Error: permission denied for table contacts
```
**Solution**: The migration uses server-side Supabase client with service role permissions

### Duplicate Contacts
The migration automatically skips duplicates, but you can also manually check:
```sql
-- Check for potential duplicates before migration
SELECT email_address, phone, COUNT(*) 
FROM contacts 
WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' 
GROUP BY email_address, phone 
HAVING COUNT(*) > 1;
```

## 🎉 Post-Migration

After successful migration:

1. **Test the contacts system**: Visit `/admin/contacts`
2. **Verify data**: Check a few migrated contacts for accuracy
3. **Test chat integration**: Try creating new messages from contacts
4. **Update workflows**: Train users on the new contact management features

## 🔐 Safety Notes

- ✅ **Non-destructive**: Original submissions remain unchanged
- ✅ **Duplicate safe**: Won't create duplicate contacts
- ✅ **Rollback ready**: Can delete migrated contacts if needed
- ✅ **Logged**: All operations are logged for debugging

## 📞 Support

If you encounter issues:
1. Check the browser developer console for errors
2. Verify environment variables are set correctly
3. Check Supabase logs for database errors
4. Review the migration results for specific error details

---

**Ready to migrate?** Start with the preview endpoint to see what will happen! 🚀