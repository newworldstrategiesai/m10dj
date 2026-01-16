# Invoice Preview API 404 Fix

## Problem
The `/api/invoices/[id]/preview` endpoint returns 404 HTML in production but works on localhost.

## Root Cause
The route file exists and works locally, but Next.js isn't finding it in production. This could be due to:
1. Build/deployment issue where the file isn't included
2. Route not being recognized in production build
3. Content-Type not being set early enough, causing Next.js to return HTML 404

## Fixes Applied

### 1. Set Content-Type Header Early
Added `res.setHeader('Content-Type', 'application/json')` at the very beginning of the handler to ensure JSON responses even if errors occur.

### 2. Validate Invoice ID Format
Added validation to handle cases where `req.query.id` might be an array:
```javascript
const invoiceIdString = Array.isArray(invoiceId) ? invoiceId[0] : invoiceId;
```

### 3. Ensure JSON Responses on All Paths
Added Content-Type header in both success and error responses to prevent HTML 404 pages.

## Testing
1. Test the route in production: `POST /api/invoices/[id]/preview`
2. Verify it returns JSON (not HTML)
3. Check server logs for any build/deployment errors

## Next Steps if Issue Persists
1. Verify the file is in the production build
2. Check Vercel/build logs for any errors
3. Consider adding a simple test endpoint to verify routing works
4. Check if there are any build exclusions that might affect this file
