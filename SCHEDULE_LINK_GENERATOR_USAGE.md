# Schedule Link Generator - Usage Guide

This utility allows you to generate customized schedule links with pre-filled client information. These links can be sent to clients after they submit a contact form, making it easier for them to book a consultation.

## Features

- Pre-fills client information (name, email, phone)
- Pre-fills event details (event type, date, venue)
- Displays event information prominently on the schedule page
- Can be generated from contact submissions or contact records

## Usage Examples

### 1. Generate Link from Contact Submission (Recommended)

When a client submits a contact form, you can generate a link like this:

```typescript
import { generateScheduleLinkFromSubmission } from '@/utils/schedule-link-generator';

// From your contact submission API handler
const scheduleLink = generateScheduleLinkFromSubmission({
  name: submission.name,
  email: submission.email,
  phone: submission.phone,
  event_type: submission.event_type,
  event_date: submission.event_date,
  venue_name: submission.venue_name,
  venue_address: submission.venue_address,
  message: submission.message
}, 'https://www.m10djcompany.com');
```

### 2. Generate Link from Contact Record (CRM)

From the admin panel when viewing a contact:

```typescript
import { generateScheduleLinkFromContact } from '@/utils/schedule-link-generator';

const scheduleLink = generateScheduleLinkFromContact({
  first_name: contact.first_name,
  last_name: contact.last_name,
  email_address: contact.email_address,
  phone: contact.phone,
  event_type: contact.event_type,
  event_date: contact.event_date,
  venue_name: contact.venue_name,
  venue_address: contact.venue_address,
  special_requests: contact.special_requests
}, 'https://www.m10djcompany.com');
```

### 3. Generate Link with Direct Parameters

For custom use cases:

```typescript
import { generateScheduleLink } from '@/utils/schedule-link-generator';

const scheduleLink = generateScheduleLink({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '(901) 555-1234',
  eventType: 'Wedding',
  eventDate: '2025-06-15',
  venueName: 'The Peabody Hotel',
  venueAddress: '149 Union Ave, Memphis, TN',
  notes: 'Outdoor ceremony, indoor reception'
}, 'https://www.m10djcompany.com');
```

### 4. Using the API Endpoint

You can also generate links via API call:

```javascript
// From server-side code or API route
const response = await fetch('/api/schedule/generate-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'submission', // or 'contact' or omit for direct params
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      eventType: 'Wedding',
      eventDate: '2025-06-15'
    },
    baseUrl: 'https://www.m10djcompany.com' // optional
  })
});

const { scheduleLink } = await response.json();
```

## Example: Sending Link in Email

After a contact form submission, you can send the client a customized link:

```javascript
// In your contact form handler
import { generateScheduleLinkFromSubmission } from '@/utils/schedule-link-generator';

const scheduleLink = generateScheduleLinkFromSubmission(submissionData);

// Send email with the link
await resend.emails.send({
  from: 'Ben <ben@m10djcompany.com>',
  to: submissionData.email,
  subject: 'Let\'s schedule a time to discuss your event!',
  html: `
    <p>Hi ${submissionData.name},</p>
    <p>Thank you for your interest in M10 DJ Company!</p>
    <p>I'd love to schedule a time to discuss your ${submissionData.event_type || 'event'}.</p>
    <p><a href="${scheduleLink}" style="background: #fcba00; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
      Book Your Consultation
    </a></p>
    <p>Best regards,<br>Ben</p>
  `
});
```

## Example: Admin Panel Integration

Add a button in your admin panel to generate and copy schedule links:

```typescript
// In your admin contact/submission detail page
import { generateScheduleLinkFromContact } from '@/utils/schedule-link-generator';

function ContactDetailPage({ contact }) {
  const handleGenerateScheduleLink = () => {
    const link = generateScheduleLinkFromContact(contact);
    navigator.clipboard.writeText(link);
    toast.success('Schedule link copied to clipboard!');
  };

  return (
    <Button onClick={handleGenerateScheduleLink}>
      Generate Schedule Link
    </Button>
  );
}
```

## URL Parameters

The generated links include these query parameters (all optional):

- `name` - Client's full name
- `email` - Client's email address
- `phone` - Client's phone number
- `eventType` - Type of event (Wedding, Corporate, etc.)
- `eventDate` - Event date (YYYY-MM-DD format)
- `venueName` - Name of the venue
- `venueAddress` - Address of the venue
- `notes` - Additional notes or special requests

## What Clients See

When clients click on a customized schedule link:

1. **Event Information Card** - A highlighted card at the top showing their event details (event type, date, venue)
2. **Pre-filled Form** - Their contact information is automatically filled in
3. **Simplified Booking** - They just need to select a date and time to complete their booking

The event information is displayed prominently, making it clear that the booking is for their specific event.

