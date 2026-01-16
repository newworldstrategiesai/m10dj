# Flow Fix Implementation Plan

## Problem Summary
Request is created BEFORE user enters name → API validation fails → Payment page never shown

## Solution: Two-Phase Approach

### Phase 1: Create Request with Placeholder
- Use "Guest" as temporary requester name
- This satisfies API validation
- Request is created successfully
- Payment page is shown

### Phase 2: Update Name at Payment Step
- User enters real name at payment page
- Update request with real name before processing payment
- Use existing update endpoint OR create public endpoint

## Implementation Options

### Option A: Create Public Update Endpoint (RECOMMENDED)
Create `/api/crowd-request/update-requester-name-public.js` that:
- Doesn't require admin auth
- Validates requestId matches payment code or session
- Updates requester name

### Option B: Modify Existing Endpoint
- Remove admin requirement
- Add validation (requestId + paymentCode match)
- Allow public updates

### Option C: Use "Guest" and Update Later
- Create with "Guest"
- Update via admin endpoint (not ideal for public flow)

## Recommended: Option A

### Steps:
1. Create public update endpoint
2. Use "Guest" placeholder in initial request
3. Update name at payment step before processing payment
4. Validate name is present before payment methods

## Code Changes Needed

1. **Create public update endpoint**
2. **Modify request creation** to use "Guest" placeholder
3. **Update PaymentMethodSelection** to call update endpoint before payment
4. **Test end-to-end flow**
