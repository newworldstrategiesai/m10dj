# Requests Page Customization Feature - Brainstorming Document

## 📋 Feature Overview

Enable admins to customize their requests page through two complementary approaches:
1. **Admin Dashboard Editing** - Comprehensive form-based editing in `/admin/requests-page`
2. **Inline Editing** - Visual, context-aware editing directly on the requests page when logged in as admin

---

## 🔍 Current State Analysis

### ✅ Already Implemented in Admin Dashboard (`/admin/requests-page`)

**Cover Photos Tab:**
- `requests_cover_photo_url` (Primary)
- `requests_artist_photo_url` (Fallback)
- `requests_venue_photo_url` (Fallback)

**Social Links Tab:**
- `social_links` array (platform, url, label, enabled, order)

**Bidding Mode Tab:**
- `requests_bidding_enabled`
- `requests_bidding_minimum_bid`
- `requests_bidding_starting_bid`

### ❌ NOT Yet Editable (Available in DB but not in UI)

Based on the database schema (`20251202000000_ensure_all_requests_page_fields.sql`), these fields exist but are not yet editable:

**Header Fields:**
- `requests_header_artist_name` (TEXT)
- `requests_header_location` (TEXT)
- `requests_header_date` (TEXT)

**Page Metadata:**
- `requests_page_title` (TEXT) - SEO/browser tab
- `requests_page_description` (TEXT) - Meta description

**Main Content:**
- `requests_main_heading` (TEXT) - "What would you like to request?"
- `requests_default_request_type` (TEXT) - 'song_request' | 'shoutout'
- `requests_song_request_label` (TEXT) - "Song Request"
- `requests_shoutout_label` (TEXT) - "Shoutout"

**Feature Toggles:**
- `requests_show_audio_upload` (BOOLEAN) - Show/hide audio upload option
- `requests_show_fast_track` (BOOLEAN) - Show/hide fast track option
- `requests_show_next_song` (BOOLEAN) - Show/hide "next song" option
- `requests_show_bundle_discount` (BOOLEAN) - Show/hide bundle discount

**Music Link Section:**
- `requests_music_link_label` (TEXT)
- `requests_music_link_placeholder` (TEXT)
- `requests_music_link_help_text` (TEXT)
- `requests_manual_entry_divider` (TEXT)
- `requests_start_over_text` (TEXT)

**Song Request Fields:**
- `requests_song_title_label` (TEXT)
- `requests_song_title_placeholder` (TEXT)
- `requests_artist_name_label` (TEXT)
- `requests_artist_name_placeholder` (TEXT)

**Audio Upload Section:**
- `requests_audio_upload_label` (TEXT)
- `requests_audio_upload_description` (TEXT)
- `requests_artist_rights_text` (TEXT)
- `requests_is_artist_text` (TEXT)
- `requests_audio_fee_text` (TEXT)

**Shoutout Fields:**
- `requests_recipient_name_label` (TEXT)
- `requests_recipient_name_placeholder` (TEXT)
- `requests_message_label` (TEXT)
- `requests_message_placeholder` (TEXT)

**Buttons & Steps:**
- `requests_submit_button_text` (TEXT)
- `requests_step_1_text` (TEXT)
- `requests_step_2_text` (TEXT)

---

## 🎯 Two Approaches: Design Philosophy

### Approach 1: Enhanced Admin Dashboard (`/admin/requests-page`)

**Pros:**
- ✅ Already partially implemented
- ✅ Comprehensive view of all settings
- ✅ Better for bulk editing
- ✅ Organized by logical groups
- ✅ No impact on public page performance
- ✅ Can include validation, previews, and documentation

**Cons:**
- ❌ Requires navigating away from the page
- ❌ Less visual/wysiwyg experience
- ❌ Harder to see context of changes

**Enhancement Strategy:**
- Add new tabs/sections for missing field categories
- Organize fields into logical groups (Header, Labels, Features, Content)
- Add live preview pane (iframe or component preview)
- Add search/filter for finding specific fields
- Add "Reset to Default" functionality per field
- Add field-level documentation/help text

### Approach 2: Inline Editing on Requests Page

**Pros:**
- ✅ Visual, context-aware editing
- ✅ See changes in real-time on actual page
- ✅ Faster iteration (no page navigation)
- ✅ Better UX for quick tweaks
- ✅ See how changes look with actual content

**Cons:**
- ❌ More complex implementation
- ❌ Potential performance impact on public page
- ❌ Requires careful permission checks
- ❌ Need to handle editing state management
- ❌ Could clutter UI if not designed well

**Design Patterns to Consider:**
- **Edit Mode Toggle**: Banner/button to enter "Edit Mode" (only visible to admins)
- **Floating Edit Buttons**: Small edit icons that appear on hover (only in edit mode)
- **Inline Inputs**: Replace text with input fields when clicked
- **Save Indicators**: Visual feedback for saved/unsaved changes
- **Field Grouping**: Group related fields together
- **Edit Mode Banner**: Clear visual indicator that you're in edit mode

---

## 📊 Field Categorization & Prioritization

### Priority 1: High-Impact, Frequently Changed

**Header Section** (Hero area):
- `requests_header_artist_name` ⭐⭐⭐
- `requests_header_location` ⭐⭐⭐
- `requests_header_date` ⭐⭐⭐

**Main Heading:**
- `requests_main_heading` ⭐⭐⭐

**Request Type Labels:**
- `requests_song_request_label` ⭐⭐
- `requests_shoutout_label` ⭐⭐

**Rationale**: These are the most visible and frequently changed fields. Admins likely want to customize these for each event.

### Priority 2: Important but Less Frequently Changed

**Feature Toggles:**
- `requests_show_audio_upload` ⭐⭐
- `requests_show_fast_track` ⭐⭐
- `requests_show_next_song` ⭐⭐
- `requests_show_bundle_discount` ⭐⭐

**Form Labels:**
- `requests_song_title_label` ⭐⭐
- `requests_artist_name_label` ⭐⭐
- `requests_recipient_name_label` ⭐⭐
- `requests_message_label` ⭐⭐

**Rationale**: Important for customization but typically set once and changed infrequently.

### Priority 3: Nice-to-Have, Detailed Customization

**Placeholders:**
- All placeholder text fields ⭐

**Help Text:**
- All help text fields ⭐

**Button Text:**
- `requests_submit_button_text` ⭐
- `requests_step_1_text` ⭐
- `requests_step_2_text` ⭐

**SEO Fields:**
- `requests_page_title` ⭐
- `requests_page_description` ⭐

**Rationale**: These are nice for full white-label customization but may be overkill for most users.

---

## 🎨 UI/UX Design Patterns

### Pattern 1: Edit Mode Toggle Banner

```
┌─────────────────────────────────────────────────┐
│ 🎨 EDIT MODE - Click fields to customize        │
│    [Exit Edit Mode] [Save All Changes]          │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Only visible when `isOwner === true` and user is authenticated
- Sticky banner at top of page (or floating)
- Click to enter/exit edit mode
- Shows save indicator (saved/unsaved changes count)

### Pattern 2: Hover Edit Buttons

```
┌─────────────────────────────┐
│ Artist Name          [✏️]   │  ← Edit button appears on hover
└─────────────────────────────┘
```

**Implementation:**
- Small edit icon (pencil) appears on hover when in edit mode
- Positioned near the field (right-aligned or top-right)
- Click opens inline editor

### Pattern 3: Inline Editor

**Option A: Click to Edit (Single Field)**
```
Before: "DJ Ben Murray"
After:  [DJ Ben Murray______] [✓] [✗]
```

**Option B: Modal/Popover Editor**
```
Click edit → Opens small modal with:
- Field label
- Input field
- Help text (if available)
- [Save] [Cancel]
```

**Option C: Sidebar Editor**
```
Edit mode → Right sidebar opens
- Lists all editable fields
- Grouped by section
- Quick search
- Live preview updates
```

### Pattern 4: Visual Indicators

- **Unedited Field**: No indicator
- **Edited (unsaved)**: Yellow/orange highlight
- **Saving**: Spinner/pulse animation
- **Saved**: Green checkmark (fades after 2s)
- **Error**: Red border + error message

---

## 🏗️ Technical Implementation Considerations

### Authentication & Permissions

**Key Requirements:**
1. Only organization owners/admins can edit
2. Check `isOwner` prop or verify `owner_id === user.id`
3. Consider team members with edit permissions (check `organization_members` table)
4. Don't expose edit UI to public users (performance + security)

**Implementation:**
```typescript
// In requests page component
const canEdit = isOwner || (user && await hasEditPermission(organizationId, user.id));

// Show edit mode banner only if canEdit
{canEdit && (
  <EditModeBanner 
    isEditMode={isEditMode}
    onToggleEditMode={setIsEditMode}
    unsavedChangesCount={unsavedChanges.size}
    onSave={handleSaveAll}
  />
)}
```

### Data Persistence Strategy

**Option 1: Optimistic Updates (Recommended)**
- Update local state immediately
- Show "saving" indicator
- Save to database in background
- Handle errors gracefully

**Option 2: Batch Save**
- Collect all changes in state
- Save all at once when "Save All" clicked
- Show unsaved changes indicator

**Option 3: Auto-save**
- Save after field blur (3 second debounce)
- No manual save button needed
- Simpler UX but more API calls

**Recommendation**: **Option 1** (Optimistic) for inline editing, **Option 2** (Batch) for admin dashboard.

### API Endpoint Design

**Single Field Update:**
```
PATCH /api/admin/organization/requests-field
Body: { field: 'requests_header_artist_name', value: 'DJ Ben Murray' }
Response: { success: true, organization: {...} }
```

**Batch Update:**
```
PATCH /api/admin/organization/requests-fields
Body: { 
  requests_header_artist_name: 'DJ Ben Murray',
  requests_header_location: 'Chicago, IL',
  requests_header_date: 'December 31, 2024'
}
Response: { success: true, organization: {...} }
```

**Validation:**
- Validate field names (prevent arbitrary field updates)
- Validate data types (TEXT, BOOLEAN, etc.)
- Sanitize input (XSS prevention)
- Check permissions (organization ownership)

### State Management

**For Inline Editing:**
```typescript
const [editMode, setEditMode] = useState(false);
const [editingField, setEditingField] = useState<string | null>(null);
const [unsavedChanges, setUnsavedChanges] = useState<Map<string, any>>(new Map());
const [savingField, setSavingField] = useState<string | null>(null);
const [organization, setOrganization] = useState(organizationData);
```

**Field Update Handler:**
```typescript
const handleFieldUpdate = async (field: string, value: any) => {
  // Optimistic update
  setOrganization(prev => ({ ...prev, [field]: value }));
  setSavingField(field);
  
  try {
    const response = await fetch('/api/admin/organization/requests-field', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value })
    });
    
    if (!response.ok) throw new Error('Save failed');
    
    // Remove from unsaved changes
    setUnsavedChanges(prev => {
      const next = new Map(prev);
      next.delete(field);
      return next;
    });
  } catch (error) {
    // Revert on error
    setOrganization(prev => ({ ...prev, [field]: organizationData[field] }));
    toast.error(`Failed to save ${field}`);
  } finally {
    setSavingField(null);
  }
};
```

### Performance Considerations

**Lazy Loading:**
- Only load edit UI when `isOwner === true`
- Don't render edit buttons until edit mode is enabled
- Use React.lazy for edit mode components

**Debouncing:**
- Debounce auto-save operations (if using auto-save)
- Debounce field validation

**Memoization:**
- Memoize editable field components
- Memoize organization data to prevent unnecessary re-renders

**Bundle Size:**
- Code-split edit mode components
- Only load when needed

---

## 🔄 Cross-Product Implications

### Products Affected

**TipJar.live:**
- ✅ Uses requests page (via organizations)
- ⚠️ **CRITICAL**: Ensure TipJar organizations can't edit M10/DJDash fields
- ⚠️ Check `product_context` before showing edit UI
- ⚠️ Validate organization belongs to correct product

**DJDash.net:**
- ✅ Uses requests page
- ⚠️ May have different field requirements
- ⚠️ Check subscription tier (white-label feature?)

**M10DJCompany.com:**
- ✅ Uses requests page
- ✅ Primary use case

### Data Isolation Strategy

**Organization-Level Editing:**
- All edits are scoped to `organization_id`
- No cross-organization data leakage
- RLS policies should prevent unauthorized access

**Product Context Validation:**
```typescript
// Before allowing edits
if (organization.product_context !== userProductContext) {
  throw new Error('Organization belongs to different product');
}
```

### Feature Flags & Subscription Tiers

**Consider:**
- Is inline editing a premium feature?
- Should it be behind a subscription tier?
- Feature flag: `requests_page_inline_editing_enabled`

**Implementation:**
```typescript
const canUseInlineEditing = 
  isOwner && 
  organization.subscription_tier !== 'starter' &&
  (organization.product_context === 'm10' || organization.product_context === 'djdash');
```

---

## ⚠️ Edge Cases & Risks

### Security Risks

1. **XSS Injection**
   - Risk: User enters malicious script in text fields
   - Mitigation: Sanitize all inputs, use React's built-in XSS protection

2. **Unauthorized Access**
   - Risk: User edits organization they don't own
   - Mitigation: Strict permission checks, RLS policies, verify ownership

3. **Data Validation**
   - Risk: Invalid data types, field names
   - Mitigation: Server-side validation, whitelist allowed fields

### UX Edge Cases

1. **Concurrent Editing**
   - Scenario: Two admins edit same field simultaneously
   - Solution: Last-write-wins (acceptable for this use case), or show conflict warning

2. **Unsaved Changes Navigation**
   - Scenario: User edits fields, then navigates away
   - Solution: Warn before leaving if unsaved changes exist

3. **Network Failures**
   - Scenario: Save fails due to network error
   - Solution: Show error, allow retry, maintain changes in local state

4. **Large Text Fields**
   - Scenario: Long text in header fields breaks layout
   - Solution: Character limits, preview truncation, responsive design

5. **Mobile Editing**
   - Scenario: Editing on mobile device
   - Solution: Touch-friendly edit buttons, full-screen modals for editing

### Performance Edge Cases

1. **Many Fields Visible**
   - Scenario: Edit mode shows 50+ edit buttons
   - Solution: Virtualize or lazy-render edit buttons, group fields

2. **Frequent Auto-saves**
   - Scenario: Auto-save triggers too often
   - Solution: Debounce, batch updates

3. **Large Organization Object**
   - Scenario: Organization object is very large
   - Solution: Only update specific fields, not entire object

---

## 🚀 Implementation Phases

### Phase 1: Enhanced Admin Dashboard (Week 1-2)

**Goal**: Make all fields editable in admin dashboard

**Tasks:**
1. ✅ Audit existing fields (already done)
2. Create new tabs/sections in `/admin/requests-page`:
   - Header Settings tab
   - Labels & Text tab
   - Feature Toggles tab
   - SEO & Metadata tab
3. Add form fields for all missing fields
4. Add validation and help text
5. Add "Reset to Default" buttons
6. Test across all products

**Deliverables:**
- Complete admin dashboard editing
- All 40+ fields editable
- Organized, searchable interface

### Phase 2: Inline Editing - Core Infrastructure (Week 2-3)

**Goal**: Build foundation for inline editing

**Tasks:**
1. Create API endpoint for field updates
2. Create edit mode banner component
3. Add permission checks to requests page
4. Create inline editor component (reusable)
5. Add state management for edit mode
6. Add save/error handling

**Deliverables:**
- Edit mode toggle works
- Can edit at least 1 field inline
- Basic save/error handling

### Phase 3: Inline Editing - Priority Fields (Week 3-4)

**Goal**: Enable inline editing for high-priority fields

**Tasks:**
1. Add edit buttons to header fields (artist name, location, date)
2. Add edit buttons to main heading
3. Add edit buttons to request type labels
4. Polish UX (animations, indicators)
5. Test on mobile

**Deliverables:**
- Top 5-10 fields editable inline
- Smooth UX
- Mobile-friendly

### Phase 4: Inline Editing - Feature Toggles & Labels (Week 4-5)

**Goal**: Enable inline editing for remaining important fields

**Tasks:**
1. Add inline editing for feature toggles (checkboxes)
2. Add inline editing for form labels
3. Add inline editing for placeholders
4. Add field grouping/organization
5. Add search/filter for fields

**Deliverables:**
- All Priority 1 & 2 fields editable inline
- Organized field groups
- Search functionality

### Phase 5: Polish & Advanced Features (Week 5-6)

**Goal**: Add advanced features and polish

**Tasks:**
1. Add bulk edit mode
2. Add field templates/presets
3. Add undo/redo
4. Add change history/audit log
5. Add field-level help tooltips
6. Performance optimization
7. Comprehensive testing

**Deliverables:**
- Production-ready feature
- Documentation
- Test coverage

---

## 💡 Advanced Feature Ideas (Future Enhancements)

### Templates & Presets
- Save field configurations as templates
- Apply template to quickly set up new events
- Share templates between organizations

### Field Validation Rules
- Set character limits per field
- Define validation patterns (e.g., date format)
- Custom validation messages

### A/B Testing
- Test different field values
- Track conversion rates
- Auto-select best-performing variants

### Version History
- View previous field values
- Revert to previous version
- See who changed what and when

### Bulk Operations
- Copy fields from one organization to another
- Export/import field configurations
- Reset all fields to defaults

### Rich Text Editing
- For fields that support HTML (if needed)
- WYSIWYG editor for description fields
- Formatting options

---

## 📝 Questions to Resolve

1. **Subscription Tier**: Should inline editing be a premium feature?
2. **Auto-save vs Manual Save**: Which is better UX?
3. **Field Validation**: What are the character limits/validation rules?
4. **Mobile Experience**: Should inline editing be available on mobile?
5. **Team Permissions**: Can team members edit, or only owners?
6. **Audit Logging**: Do we need to track who changed what?
7. **Field Dependencies**: Do any fields depend on others? (e.g., show audio upload only if feature is enabled)
8. **Default Values**: Where do defaults come from? Hard-coded or database?
9. **Internationalization**: Do we need i18n support for these fields?
10. **Performance Budget**: What's the acceptable performance impact on public page?

---

## 🎯 Success Metrics

**Adoption:**
- % of organizations using customization features
- Average number of fields customized per organization
- Frequency of edits (daily/weekly/monthly)

**Usage Patterns:**
- Which fields are edited most frequently?
- Do users prefer dashboard or inline editing?
- How long does customization take?

**Performance:**
- Page load time impact (should be < 100ms)
- Edit mode activation time (should be < 200ms)
- Save operation time (should be < 500ms)

**User Satisfaction:**
- User feedback/surveys
- Support tickets related to customization
- Feature request follow-ups

---

## 📚 References

- Current Admin Dashboard: `pages/admin/requests-page.tsx`
- Requests Page Component: `pages/requests.js`
- Database Schema: `supabase/migrations/20251202000000_ensure_all_requests_page_fields.sql`
- Organization Helpers: `utils/organization-helpers.ts`
- Permissions: `utils/permissions.ts`
- Similar Patterns: `components/admin/FloatingAdminAssistant.tsx` (inline editing)

---

**Document Version**: 1.0  
**Last Updated**: 2024-12-19  
**Status**: Brainstorming/Planning

