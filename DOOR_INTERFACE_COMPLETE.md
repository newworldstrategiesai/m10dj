# 🚪 Door Interface - Unified Check-In & Sales UI

## ✅ Complete Door Staff Interface

A streamlined, mobile-optimized interface specifically designed for door staff to handle check-ins and on-the-spot ticket sales during events.

---

## 🎯 Key Features

### 1. **Unified Interface**
- **Single Page:** Combines check-in and ticket sales in one simple interface
- **Mode Toggle:** Easy switch between "Check-In" and "Sell Ticket" modes
- **Real-Time Stats:** Live updates showing total tickets, checked-in count, and revenue

### 2. **Check-In Functionality**

#### QR Code Scanning
- **One-Tap Camera:** Large, prominent button to start QR scanner
- **Automatic Check-In:** Scans QR code and checks in immediately
- **Visual Feedback:** Clear success/error messages with ticket details
- **Optimized for Mobile:** Full-screen scanner with clear viewfinder

#### Name-Based Search
- **Quick Search:** Enter customer name to find tickets
- **Partial Match:** Finds tickets even with partial name matches
- **Multiple Results:** Shows all matching tickets for same name
- **One-Click Check-In:** Button to check in each found ticket
- **Already Checked-In Indicator:** Shows which tickets are already checked in

#### Check-In Methods (Configurable)
- QR Code scanning (default: enabled)
- Name search (default: enabled)
- Admin can configure which methods are available per event (future enhancement)

### 3. **Ticket Sales**

#### Streamlined Form
- **Required Fields Only:** Name is required, email/phone optional
- **Quick Selection:** Ticket type and quantity in one row
- **Payment Method:** Large buttons for Cash or Card
- **Live Total:** Real-time price calculation
- **Fast Submission:** Large, prominent "Create Ticket" button

#### Success Flow
- **Instant Feedback:** Success message with QR code
- **Auto-Reset:** Form clears after successful sale
- **Stats Update:** Revenue and totals update automatically

### 4. **Mobile Optimization**

#### Design Principles
- **Large Touch Targets:** All buttons optimized for finger taps
- **High Contrast:** Dark theme with bright accent colors for visibility
- **Readable Text:** Large font sizes for easy reading
- **No Scrolling Required:** Key actions visible without scrolling
- **Fast Loading:** Minimal dependencies for quick page loads

#### Responsive Layout
- **Stats Grid:** 3-column layout for quick stats overview
- **Full-Width Buttons:** Easy to tap on mobile devices
- **Modal Scanner:** Full-screen QR scanner overlay
- **Touch-Friendly:** Adequate spacing between interactive elements

---

## 📱 User Experience

### Check-In Flow

1. **Start Check-In Mode** (default on load)
2. **Choose Method:**
   - **QR Code:** Tap "Scan QR Code" → Camera opens → Scan ticket → Auto check-in
   - **Name Search:** Type name → Tap search → Select ticket → Tap "Check In"
3. **Confirmation:** Green success message shows ticket details
4. **Auto-Continue:** Message clears after 3 seconds, ready for next customer

### Sales Flow

1. **Switch to Sell Mode:** Tap "Sell Ticket" button
2. **Enter Customer Name:** Type name (required)
3. **Select Ticket Type:** Choose from available types
4. **Set Quantity:** Enter number of tickets
5. **Choose Payment:** Tap Cash or Card button
6. **Review Total:** See calculated price
7. **Create Ticket:** Tap "Create Ticket" button
8. **Success:** QR code displayed, form resets automatically

---

## 🔧 Technical Implementation

### Files Created

#### `pages/admin/events/[eventId]/door.js`
- Main door interface component
- Unified check-in and sales functionality
- Real-time stats updates
- QR scanner integration
- Name search integration

#### `pages/api/events/tickets/search.js`
- API endpoint for name-based ticket search
- Case-insensitive partial matching
- Returns up to 10 matching tickets
- Filters by event ID and valid payment status

### Components Used

- **QRCodeScanner:** Existing component for camera-based QR scanning
- **Standard UI Elements:** Large buttons, forms, modals

### Integration Points

- **Event Config:** Uses `getEventTicketConfig()` for ticket types/prices
- **Event Info:** Uses `getEventInfo()` for event display name
- **Validation API:** Uses existing `/api/events/tickets/validate/[ticketId]`
- **Ticket Creation:** Uses Supabase directly for fast door sales
- **Stats:** Real-time query of ticket data

---

## 🎨 Design Highlights

### Color Scheme
- **Background:** Dark gray (`bg-gray-900`) for low-light event environments
- **Primary Action:** Gold (`brand-gold`) for high visibility
- **Success:** Green for confirmed check-ins
- **Error:** Red for failures
- **Text:** White with gray accents for readability

### Typography
- **Headers:** Bold, large (2xl)
- **Body:** Standard size with good contrast
- **Stats:** Extra large, bold numbers
- **Buttons:** Bold, prominent labels

### Layout
- **Top:** Event name and date
- **Stats Bar:** 3-column grid with key metrics
- **Mode Toggle:** Large segmented control
- **Content Area:** Scrollable if needed, but optimized for no scrolling
- **Bottom Padding:** Extra space for mobile safe areas

---

## ⚙️ Configuration

### Current Defaults
- QR Code scanning: **Enabled**
- Name search: **Enabled**

### Future Enhancement
- Admin settings page to configure check-in methods per event
- Settings stored in database or event configuration
- Options:
  - QR Code only
  - Name search only
  - Both (default)
  - Custom methods (future)

---

## 📊 Stats Display

### Real-Time Updates
- **Total Tickets:** All valid tickets for the event
- **Checked In:** Count of checked-in tickets
- **Revenue:** Total revenue from all ticket sales

### Update Frequency
- On page load
- After each check-in
- After each ticket sale
- Auto-refresh every 30 seconds
- Manual refresh on mode switch

---

## 🚀 Performance

### Optimizations
- **Minimal Re-renders:** Stats only update when needed
- **Fast API Calls:** Direct Supabase queries
- **Efficient Search:** Indexed database queries for name search
- **Lazy Scanner:** QR scanner only loads when activated
- **Debounced Search:** Name search only triggers on submit

### Mobile Considerations
- **Touch Events:** Optimized for touch interactions
- **Camera Access:** Proper permission handling
- **Network Resilient:** Works with intermittent connectivity
- **Battery Efficient:** Scanner stops when not in use

---

## 🔒 Security

### Authentication
- **Admin Only:** Requires admin authentication
- **Session Check:** Validates user session on load
- **Redirect:** Sends to sign-in if not authenticated

### Data Protection
- **Service Role:** Uses service role key for database operations
- **Event Scoping:** All queries filtered by event ID
- **Valid Tickets Only:** Only processes tickets with valid payment status

---

## 📝 Usage Instructions

### For Door Staff

1. **Access:** Navigate to `/admin/events/[eventId]/door`
2. **Check-In:** 
   - Use QR scanner for quick check-ins
   - Or search by name if ticket is lost/damaged
3. **Sell Tickets:**
   - Switch to "Sell Ticket" mode
   - Enter customer info and payment method
   - Create ticket and provide QR code to customer

### For Admins

1. **Monitor:** Stats update in real-time
2. **Support:** Can use same interface if needed
3. **Configure:** Future settings page to customize check-in methods

---

## 🎯 Benefits

### For Door Staff
- ✅ **Simple:** One interface for everything
- ✅ **Fast:** Quick check-ins and sales
- ✅ **Clear:** Large buttons, obvious actions
- ✅ **Reliable:** Works offline with cached data

### For Event Organizers
- ✅ **Real-Time:** Live stats on attendance and revenue
- ✅ **Flexible:** Multiple check-in methods
- ✅ **Efficient:** Faster door operations = better customer experience
- ✅ **Auditable:** All check-ins and sales tracked with timestamps

---

## 🔄 Migration from Old UIs

### Deprecated Pages
- `/admin/events/[eventId]/door-sales` → Use `/admin/events/[eventId]/door` (Sell mode)
- `/admin/events/checkin/[eventId]` → Use `/admin/events/[eventId]/door` (Check-In mode)

### Navigation Updates
- Ticket dashboard now links to unified door interface
- Tickets overview page links to unified door interface
- Old pages can remain for backward compatibility (optional)

---

## ✅ Status: Complete

The unified door interface is fully implemented and ready for use. All core functionality is working:
- ✅ QR code scanning
- ✅ Name-based search
- ✅ Ticket sales
- ✅ Real-time stats
- ✅ Mobile optimization
- ✅ Error handling
- ✅ Success feedback

**Ready for:** Production use at live events

---

**Last Updated:** December 25, 2024  
**Version:** 1.0.0

