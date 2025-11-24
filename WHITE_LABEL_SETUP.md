# White-Label Branding Setup Guide

## Overview

The white-label branding feature allows organizations to fully customize their branding on public-facing pages, including:
- Custom logo and favicon
- Brand colors (primary, secondary, background, text)
- Custom typography
- Future: Custom domain support

## Subscription Tiers

White-label branding is available for:
- **White-Label Plan** ($99/month) - Dedicated white-label package
- **Enterprise Plan** ($149/month) - Includes white-label as a feature

## Database Setup

Run the migration to add branding fields:

```bash
# Run the migration
supabase migration up 20250125000001_add_white_label_branding
```

This adds the following fields to the `organizations` table:
- `white_label_enabled` - Boolean flag
- `custom_logo_url` - URL to uploaded logo
- `custom_favicon_url` - URL to uploaded favicon
- `primary_color` - Hex color code
- `secondary_color` - Hex color code
- `background_color` - Hex color code
- `text_color` - Hex color code
- `font_family` - CSS font family string
- `custom_domain` - For future custom domain support

## Storage Bucket Setup

**⚠️ IMPORTANT**: Storage policies **cannot** be created via migrations. See **`STORAGE_SETUP_INSTRUCTIONS.md`** for detailed step-by-step instructions.

### Quick Setup Summary

1. **Create Storage Bucket**:
   - Go to Supabase Dashboard → Storage → New bucket
   - Name: `organization-assets`
   - Public: ✅ **Yes**
   - File size limit: 5MB
   - Allowed MIME types: `image/*`

2. **Create Storage Policies**:
   - **Recommended**: Use Supabase Dashboard UI (see `STORAGE_SETUP_INSTRUCTIONS.md`)
   - **Alternative**: Run SQL from `supabase/migrations/20250125000003_storage_policies_manual.sql` in SQL Editor

### Storage Policies Required

You need to create 5 policies:

```sql
-- Allow authenticated users to upload to their organization folder
CREATE POLICY "Users can upload to their organization folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets' AND
  (storage.foldername(name))[1] = 'organizations' AND
  (storage.foldername(name))[2] = (
    SELECT id::text FROM organizations WHERE owner_id = auth.uid()
  )
);

-- Allow public read access to organization assets
CREATE POLICY "Public can read organization assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-assets');
```

## API Routes

### Upload Branding Asset
`POST /api/organizations/branding/upload`

**Body:**
```json
{
  "fileType": "logo" | "favicon",
  "fileData": "data:image/png;base64,...",
  "fileName": "logo.png"
}
```

### Update Branding Settings
`POST /api/organizations/branding/update`

**Body:**
```json
{
  "primaryColor": "#8B5CF6",
  "secondaryColor": "#EC4899",
  "backgroundColor": "#FFFFFF",
  "textColor": "#1F2937",
  "fontFamily": "system-ui, sans-serif",
  "whiteLabelEnabled": true
}
```

### Get Branding Settings
`GET /api/organizations/branding/get`

**Response:**
```json
{
  "branding": {
    "whiteLabelEnabled": true,
    "customLogoUrl": "https://...",
    "customFaviconUrl": "https://...",
    "primaryColor": "#8B5CF6",
    "secondaryColor": "#EC4899",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1F2937",
    "fontFamily": "system-ui, sans-serif",
    "customDomain": null,
    "subscriptionTier": "white_label",
    "hasAccess": true
  }
}
```

## Admin UI Component

The `WhiteLabelBranding` component (`components/admin/WhiteLabelBranding.tsx`) provides a full UI for:
- Uploading logo and favicon
- Setting brand colors with color pickers
- Choosing font family
- Previewing changes
- Saving settings

## Integration with Public Pages

To apply custom branding to public request pages:

1. Fetch organization branding using `getOrganizationBranding()` from `utils/organization-branding.ts`
2. Apply CSS custom properties using `brandingToStyles()`
3. Replace logo/favicon URLs when available

Example:
```typescript
import { getOrganizationBranding, brandingToStyles } from '@/utils/organization-branding';

const branding = await getOrganizationBranding(supabaseUrl, serviceKey, slug);
if (branding?.whiteLabelEnabled) {
  const styles = brandingToStyles(branding);
  // Apply styles to page
  // Replace logo with branding.customLogoUrl
}
```

## Pricing Update

Add the White-Label plan to your pricing:

- **Starter**: $19/month
- **Professional**: $49/month
- **Enterprise**: $149/month (includes white-label)
- **White-Label**: $99/month (dedicated white-label package)

## Next Steps

1. ✅ Database migration created
2. ✅ API routes created
3. ✅ Admin UI component created
4. ⏳ Update public request pages to use branding
5. ⏳ Create storage bucket and policies
6. ⏳ Add white-label plan to subscription selection
7. ⏳ Test full branding flow

