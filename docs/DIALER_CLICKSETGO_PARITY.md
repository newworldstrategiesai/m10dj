# Dialer: ClickSetGo vs M10 Parity

Comparison of the ClickSetGo dialer with the M10 port to catch loose ends.

## Pushed (current M10 dialer)

- **Layout**: Fixed left sidebar (contacts, collapsible), center keypad, bottom nav.
- **Keypad**: Circular buttons, green call button, recent-calls (redial) modal.
- **Contacts**: Search, multi-select, selected pills, "View" link to `/admin/contacts/[id]`.
- **Add contact**: Modal (first/last name, phone, email) → `POST /api/contacts/create`, refetch, optional prefill for call.
- **Call flow**: Confirm modal (reason, first message) → `POST /api/livekit/outbound-call` → LiveKitRoom + VoiceCallControls.
- **Call history**: `/admin/calls/history` — list, filters, detail dialog (overview, recording, transcript, history for number), CSV export.
- **Bottom nav**: Favorites, Scheduled, Contacts, Keypad, Calls (links to `/admin/calls`, `/admin/calls/history`).

## ClickSetGo features (reference)

| Feature | ClickSetGo | M10 | Notes |
|--------|------------|-----|--------|
| Left sidebar contacts | ✓ | ✓ | Done |
| Collapsible sidebar | ✓ | ✓ | Done |
| Search contacts | ✓ | ✓ | Done |
| Multi-select contacts | ✓ | ✓ | Done |
| Add contact | ✓ (modal/inline) | ✓ | Done (modal) |
| **Right-side contact details** | ✓ Sheet (contact id → details) | ✗ | **Loose end** — add Sheet |
| Recent calls (redial) modal | ✓ | ✓ | Done |
| Call confirmation modal | ✓ | ✓ | Done |
| Keypad + green call button | ✓ | ✓ | Done |
| Bottom nav | Upload, Lists, Contacts, Keypad, Calls | Favorites, Scheduled, Contacts, Keypad, Calls | Intentional (M10 no Upload/Lists in nav) |
| Lists in contact panel | ✓ | ✗ | Out of scope for now (no lists in M10 dialer) |
| Call engine | VAPI + Twilio | LiveKit + Twilio SIP | By design |
| API keys check (dialer page) | Twilio + VAPI | N/A (LiveKit server-side) | By design |
| Contact details: avatar, phone, email, company, lead info, notes, Edit/Delete | ✓ | — | Sheet will add avatar, phone, email, "View full profile" |
| Click contact → | Fill number + open details panel (desktop) | Fill number + open call modal | **Parity fix**: desktop click = open details Sheet only |

## Loose ends addressed

1. **Contact details Sheet (right-side)**  
   When a contact is selected on desktop, show a right-side Sheet with: avatar, name, phone, email, "View full profile" link. Optional: "Call" button in Sheet that opens the call modal.

2. **Contact click behavior (desktop)**  
   Match ClickSetGo: clicking a contact on desktop opens the details Sheet and fills the number; it does **not** open the call modal. User starts the call via the keypad Call button (or a "Call" button in the Sheet).

## Out of scope (for now)

- **Lists**: Contact lists, Add to List, Lists in nav (M10 can add later if needed).
- **Upload contacts**: ClickSetGo has `/upload-contacts`; not in M10 dialer scope.
- **Call forwarding / Add caller ID / iOS contact save**: VAPI/Twilio-specific; not applicable to LiveKit dialer.
- **Voice dropdown (ElevenLabs)**: Handled in LiveKit agent config, not in dialer UI.

## Data / product

- M10 uses shared `contacts` and `voice_calls`; dialer is M10/admin (non-TipJar). No cross-product impact.
- Add-contact uses existing `POST /api/contacts/create` and organization context.
