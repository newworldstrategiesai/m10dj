# Contract Participants Feature Implementation

## Overview
This feature allows admins to add additional signers (participants) to contracts beyond the standard client and vendor signatures.

## Architecture

### Database
- **New Table**: `contract_participants`
  - Stores participant details (name, email, role, title)
  - Tracks signature status and data
  - Each participant gets their own signing token
  - Supports unlimited participants per contract

### Components Created

1. **ContractParticipantsManager** (`components/admin/ContractParticipantsManager.tsx`)
   - Admin UI to add/manage participants
   - Send signing invitations
   - Track signature status
   - Copy signing links

2. **API Endpoints Needed**:
   - `POST /api/contracts/send-participant-invite` - Send email invitation
   - `POST /api/contracts/participants/[id]/sign` - Handle participant signing
   - `GET /api/contracts/participants/[token]` - Validate participant token

### Integration Points

1. **Contract Manager Page** (`pages/admin/contracts.tsx`)
   - Add ContractParticipantsManager component to contract preview/edit

2. **Contract HTML Generation** (`utils/ensure-contract-exists-for-invoice.js`)
   - Add `{{participants_signatures}}` variable
   - Generate signature areas for each participant

3. **Sign Contract Page** (`pages/sign-contract/[token].tsx`)
   - Detect if token is for participant vs client/vendor
   - Show appropriate signature area
   - Handle participant signature submission

4. **Signing API** (`pages/api/contracts/sign.js`)
   - Handle participant signatures
   - Update participant record instead of contract record

## Implementation Steps

### Step 1: Database Migration ✅
- Created `supabase/migrations/20250130000000_add_contract_participants.sql`

### Step 2: Admin UI Component ✅
- Created `components/admin/ContractParticipantsManager.tsx`

### Step 3: API Endpoints ✅
- ✅ `POST /api/contracts/send-participant-invite` - Send email invitation
- ✅ `GET /api/contracts/participants/[token]` - Validate participant token (integrated into validate-token)
- ✅ `POST /api/contracts/participants/[id]/sign` - Handle participant signing

### Step 4: Contract HTML Generation ✅
- ✅ Updated `validate-token.js` to inject participant signature areas into HTML
- ✅ Participant signatures are dynamically added when contract is loaded
- ✅ Supports both signed and unsigned participant states

### Step 5: Signing Flow ✅
- ✅ Updated sign-contract page to detect participant tokens
- ✅ Shows participant-specific signature UI
- ✅ Handles participant signature submission
- ✅ Participant-specific success messaging

### Step 6: Status Tracking ✅
- ✅ Updated contract status logic to check all participants
- ✅ Contract marked as "completed" when all parties have signed
- ✅ Individual participant status tracking

## Usage

### Adding a Participant (Admin)
1. Open contract in admin panel
2. Click "Add Participant" in Participants section
3. Enter name, email, role, title
4. Click "Add Participant"
5. Click "Send Invite" to email signing link

### Signing as Participant
1. Participant receives email with signing link
2. Clicks link (unique token)
3. Views contract
4. Signs in their designated area
5. Status updates to "signed"

### Contract Completion
- Contract status becomes "signed" when:
  - Client has signed
  - Vendor has signed (if required)
  - All participants have signed (if any)

## Benefits

1. **Scalable**: Unlimited participants per contract
2. **Flexible**: Each participant has their own token and status
3. **Secure**: Unique tokens for each participant
4. **Trackable**: Individual signature tracking
5. **User-Friendly**: Simple admin UI, clear signing flow

## Next Steps

1. Create API endpoints for participant management
2. Integrate ContractParticipantsManager into contract pages
3. Update contract HTML generation
4. Update signing flow to handle participants
5. Add signature progress indicators
6. Test end-to-end flow
