# Admin Search Implementation Plan

## Overview
Implement a comprehensive search function that works with the existing search field in `AdminNavbar.tsx` and displays results on `/admin/search`.

## Current State
- ✅ Search input field exists in `AdminNavbar.tsx` (line 409-426)
- ✅ Search form submits to `/admin/search?q={query}`
- ❌ Search page (`pages/admin/search.tsx`) is just a placeholder
- ❌ No API endpoint for unified search
- ❌ No results display

## Architecture

### 1. API Endpoint
**File:** `pages/api/admin/search.ts` (new)

**Purpose:** Unified search across multiple tables with proper RLS enforcement

**Searchable Tables:**
- `contacts` - name, email, phone, venue_name, notes
- `events` (projects) - event_name, client_name, client_email, venue_name
- `invoices` - invoice_number, invoice_title, client name (via contact join)

**Search Strategy:**
- Use PostgreSQL full-text search for `contacts` (already has `search_vector`)
- Use `ILIKE` pattern matching for other tables
- Combine results with type indicators
- Limit results per category (e.g., 10 contacts, 10 projects, 10 invoices)
- Respect RLS policies (user can only see their own data unless admin)

**Response Format:**
```typescript
{
  query: string,
  results: {
    contacts: Array<{
      id: string,
      first_name: string,
      last_name: string,
      email_address: string,
      phone: string,
      event_type: string,
      lead_status: string,
      matchField: string // Which field matched
    }>,
    projects: Array<{
      id: string,
      event_name: string,
      client_name: string,
      event_date: string,
      status: string,
      matchField: string
    }>,
    invoices: Array<{
      id: string,
      invoice_number: string,
      invoice_title: string,
      client_name: string,
      total_amount: number,
      invoice_status: string,
      matchField: string
    }>
  },
  total: number,
  counts: {
    contacts: number,
    projects: number,
    invoices: number
  }
}
```

### 2. Search Page Component
**File:** `pages/admin/search.tsx` (update existing)

**Features:**
- Display search query from URL parameter
- Show loading state while searching
- Display results grouped by type (Contacts, Projects, Invoices)
- Each result item should be clickable and link to detail page
- Show "No results" state
- Show result counts
- Support dark mode
- Use ShadCN UI components for consistency

**Result Card Design:**
- Contact: Name, email, phone, event type, lead status, link to `/admin/contacts/[id]`
- Project: Event name, client name, date, status, link to `/admin/projects` (filtered)
- Invoice: Invoice number, title, client name, amount, status, link to `/admin/invoices/[id]`

### 3. Search Performance
- Debounce search requests (300ms)
- Limit results per category to prevent overwhelming UI
- Use database indexes (already exist for most fields)
- Consider adding composite indexes if needed

### 4. Security & Permissions
- ✅ Use existing RLS policies
- ✅ Check user authentication
- ✅ Platform admins can see all results
- ✅ Regular users only see their own data
- ✅ Sanitize search query to prevent SQL injection

## Implementation Steps

### Step 1: Create API Endpoint
1. Create `pages/api/admin/search.ts`
2. Implement authentication check
3. Implement search logic for each table
4. Combine and format results
5. Return JSON response

### Step 2: Update Search Page
1. Read query from URL
2. Call API endpoint
3. Display results in organized sections
4. Add loading and error states
5. Style with Tailwind (light/dark mode)

### Step 3: Enhance AdminNavbar (Optional)
- Add keyboard shortcut (Cmd/Ctrl + K) to focus search
- Add search suggestions/autocomplete (future enhancement)

### Step 4: Testing
- Test with various search queries
- Test with different user roles
- Test RLS enforcement
- Test empty results
- Test special characters in search

## Cross-Product Considerations
- ✅ Search respects `user_id` filtering (single-brand users)
- ✅ Platform admins can search across all data
- ✅ No cross-brand data leakage
- ✅ Works for DJDash, M10DJ, and TipJar contexts

## Files to Create/Modify

### New Files:
1. `pages/api/admin/search.ts` - Search API endpoint

### Modified Files:
1. `pages/admin/search.tsx` - Update to show actual results

### Optional Enhancements (Future):
1. Add search filters (search by type, date range, etc.)
2. Add search history
3. Add keyboard navigation
4. Add search analytics

## Database Queries Strategy

### Contacts Search:
```sql
-- Use full-text search vector (already exists)
SELECT * FROM contacts 
WHERE search_vector @@ plainto_tsquery('english', $1)
AND user_id = $2
AND deleted_at IS NULL
LIMIT 10;
```

### Projects/Events Search:
```sql
SELECT * FROM events
WHERE (
  event_name ILIKE $1 OR
  client_name ILIKE $1 OR
  client_email ILIKE $1 OR
  venue_name ILIKE $1
)
AND user_id = $2
LIMIT 10;
```

### Invoices Search:
```sql
SELECT i.*, c.first_name, c.last_name
FROM invoices i
JOIN contacts c ON i.contact_id = c.id
WHERE (
  i.invoice_number ILIKE $1 OR
  i.invoice_title ILIKE $1 OR
  c.first_name ILIKE $1 OR
  c.last_name ILIKE $1
)
AND c.user_id = $2
LIMIT 10;
```

## UI/UX Considerations

1. **Result Grouping:** Use tabs or sections to separate result types
2. **Highlighting:** Highlight matching text in results
3. **Empty States:** Friendly messages when no results
4. **Loading States:** Skeleton loaders or spinners
5. **Error Handling:** Clear error messages
6. **Accessibility:** Proper ARIA labels, keyboard navigation

## Success Metrics
- Search completes in < 500ms for typical queries
- Results are relevant and accurate
- No security vulnerabilities
- Works across all user roles
- Responsive on mobile devices
