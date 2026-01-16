# Crowd Request Flow Analysis

## Current Flow (BROKEN)

### Step 1: Form Submission
1. User fills out form (song title, artist, etc.)
2. **NO requester name field** (removed from step 1)
3. User clicks "Submit" or "Continue"
4. `handleSubmit()` is called (line 1777)
5. Validation runs (no longer checks requester name)
6. **API call happens immediately** (line 1922):
   ```javascript
   const mainRequestBody = {
     requesterName: formData?.requesterName?.trim(), // ❌ EMPTY/UNDEFINED
     // ... other fields
   };
   const mainData = await crowdRequestAPI.submitRequest(mainRequestBody);
   ```
7. **API validates** (submit.js line 71-72):
   ```javascript
   if (requestType !== 'tip' && (!requesterName || !requesterName.trim())) {
     return res.status(400).json({ error: 'Requester name is required' });
   }
   ```
8. **❌ API returns 400 error** - "Requester name is required"
9. Error is caught and displayed (line 2120-2125)
10. **Payment page is never shown** because request creation failed

### Step 2: Payment Page (NEVER REACHED)
- User would enter requester name here
- But they never get here because step 1 fails

## The Problem

**The request is created BEFORE the user enters their name.**

The API requires `requesterName` for song requests and shoutouts, but we're trying to collect it at the payment step, which happens AFTER the request is created.

## Solutions

### Option 1: Update Request After Creation (RECOMMENDED)
1. Create request with placeholder or make name optional initially
2. Collect name at payment step
3. Update request with name before/after payment

**Pros:**
- Maintains current UX flow
- Request ID is available for payment
- Can update name via API

**Cons:**
- Requires API endpoint to update requester name
- Temporary state where name is missing

### Option 2: Collect Name Before Request Creation
1. Add name field back to step 1
2. Validate name before submission
3. Create request with name
4. Show payment page

**Pros:**
- Simple, straightforward
- No API updates needed
- Name always present

**Cons:**
- User wanted name at payment step
- Extra field on initial form

### Option 3: Two-Step Request Creation
1. Create "draft" request without name
2. Collect name at payment step
3. Update request to "active" with name
4. Process payment

**Pros:**
- Clean separation
- Name always collected before payment

**Cons:**
- More complex state management
- Requires draft/active status

### Option 4: Make Name Optional Initially
1. API allows empty name initially
2. Collect name at payment step
3. Update request with name
4. Validate name before payment processing

**Pros:**
- Minimal changes
- Flexible flow

**Cons:**
- Temporary incomplete data
- Need update endpoint

## Recommended Solution: Option 1

Use the existing `/api/crowd-request/update-requester-name` endpoint to update the name after collection.

### Implementation Steps:

1. **Modify API to allow empty name initially** (or use placeholder)
   - OR create request with empty name, validate later

2. **Create request with empty/placeholder name**
   ```javascript
   requesterName: formData?.requesterName?.trim() || 'Guest', // Temporary placeholder
   ```

3. **Collect name at payment step**
   - User enters name in PaymentMethodSelection

4. **Update request before payment**
   ```javascript
   // In PaymentMethodSelection, before processing payment
   if (requestId && localRequesterName) {
     await fetch('/api/crowd-request/update-requester-name', {
       method: 'POST',
       body: JSON.stringify({
         requestId,
         requesterName: localRequesterName.trim()
       })
     });
   }
   ```

5. **Validate name is present before payment**
   - Already implemented in `validateBeforePayment()`

## Alternative: Quick Fix

If we want to keep the current API validation strict, we can:

1. **Create request with "Guest" placeholder**
   ```javascript
   requesterName: formData?.requesterName?.trim() || 'Guest',
   ```

2. **Update to real name at payment step**
   - Use existing update endpoint

3. **This satisfies API validation** while allowing name collection at payment

## Current State

- ✅ PaymentMethodSelection has name field
- ✅ Validation before payment methods
- ✅ Callback to update parent state
- ❌ Request creation fails before payment page
- ❌ Name never gets to API

## Next Steps

1. **Immediate Fix**: Use "Guest" placeholder for initial request creation
2. **Update name** at payment step before processing payment
3. **Test flow** end-to-end
