# Ticket Purchase Testing Guide

## Current Status
✅ **Fixed Issues:**
- Dark mode readability (changed from navy to black)
- Error message visibility and styling
- API error handling improvements
- React hydration errors (added 'use client' directive)

## Testing the Ticket Purchase Flow

### Prerequisites
1. **Environment Variables** - Ensure these are set in `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   # OR
   STRIPE_SECRET_KEY_LIVE=your_stripe_live_key
   ```

2. **Database Setup** - Ensure `event_tickets` table exists (from migration `20251225000000_create_event_tickets.sql`)

3. **Dev Server** - Start the development server:
   ```bash
   npm run dev
   ```

### Manual Testing Steps

1. **Navigate to Event Page**
   - Go to: `http://localhost:3006/events/live/dj-ben-murray-silky-osullivans-2026-12-27`
   - Or: `http://localhost:3000/events/live/dj-ben-murray-silky-osullivans-2026-12-27`

2. **Test Form Validation**
   - Try submitting with empty fields → Should show validation errors
   - Try invalid email → Should show error
   - Try quantity > 10 → Should be limited to 10

3. **Test Ticket Purchase**
   - Fill in all required fields:
     - Name: "Test User"
     - Email: "test@example.com"
     - Phone: "(901) 555-1234" (optional)
   - Select ticket type: "General Admission - $12.00"
   - Set quantity: 1
   - Click "Buy Tickets - $12.00"
   - Should redirect to Stripe Checkout

4. **Test Error Handling**
   - Check browser console for errors
   - If API fails, should show clear error message in red box
   - Error should be visible in dark mode

5. **Test Dark Mode**
   - Toggle dark mode
   - Verify all form fields are readable
   - Verify error messages are visible
   - Verify buttons and text have proper contrast

### API Endpoint Testing

Test the API endpoint directly:

```bash
curl -X POST http://localhost:3006/api/events/tickets/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "dj-ben-murray-silky-osullivans-2026-12-27",
    "ticketType": "general_admission",
    "quantity": 1,
    "purchaserName": "Test User",
    "purchaserEmail": "test@example.com",
    "purchaserPhone": "(901) 555-1234"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Expected Response (Error):**
```json
{
  "error": "Error message here",
  "details": "Additional details (dev only)"
}
```

### Common Issues & Solutions

1. **"Payment processing is not configured"**
   - Check: `STRIPE_SECRET_KEY` or `STRIPE_SECRET_KEY_LIVE` is set
   - Solution: Add Stripe key to `.env.local`

2. **"Database connection is not configured"**
   - Check: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   - Solution: Add Supabase credentials to `.env.local`

3. **"Tickets not available"**
   - Check: Ticket availability in database
   - Check: Event capacity limits
   - Solution: Verify `event_tickets` table and ticket config

4. **React Hydration Errors**
   - Fixed: Added `'use client'` directive to `TicketPurchaseForm.js`
   - If persists: Clear `.next` cache and restart dev server

5. **Dark Mode Readability**
   - Fixed: Changed all `dark:bg-gray-900` to `dark:bg-black`
   - Fixed: Improved error message contrast

### Verification Checklist

- [ ] Form loads without errors
- [ ] All fields are readable in dark mode
- [ ] Error messages are visible and clear
- [ ] Form validation works correctly
- [ ] API endpoint responds correctly
- [ ] Stripe checkout redirects properly
- [ ] Ticket record is created in database
- [ ] QR code is generated for ticket
- [ ] No console errors in browser

### Next Steps

1. Test with actual Stripe test card: `4242 4242 4242 4242`
2. Verify ticket appears in `event_tickets` table
3. Test ticket check-in functionality
4. Test multiple ticket purchases
5. Test early bird ticket availability limits

