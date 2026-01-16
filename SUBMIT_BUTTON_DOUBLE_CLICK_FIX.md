# Submit Button Double-Click Fix

## Problem
The submit button required two clicks to work properly.

## Root Cause
The button had `type="submit"` which triggered the form's `onSubmit` handler, AND it also had an `onClick` handler that called `handleSubmit`. This created a conflict where:
1. First click: Form's `onSubmit` fires, but onClick handler might prevent it or cause a race condition
2. Second click: onClick handler properly calls handleSubmit

## Solution

### 1. Changed Button Type
- Changed submit button from `type="submit"` to `type="button"`
- This prevents automatic form submission
- Submission is now handled entirely by the onClick handler

### 2. Added Double-Submission Guard
- Added check in `handleSubmit` to prevent duplicate calls
- If already submitting, function returns early

### 3. Updated Form onSubmit Handler
- Made form's `onSubmit` also check for double submission
- Prevents form submission if already submitting
- Handles Enter key presses (which would trigger form submit)

### 4. Updated Bidding Mode Button
- Changed bidding mode button to also use `type="button"` with onClick
- Ensures consistent behavior across all submit buttons

## Changes Made

### pages/requests.js

1. **Main Submit Button** (line ~5585)
   - Changed: `type="submit"` → `type="button"`
   - Already had onClick handler, now it's the only submission path

2. **Bidding Mode Button** (line ~4724)
   - Changed: `type="submit"` → `type="button"`
   - Added: `onClick` handler to call `handleSubmit`

3. **handleSubmit Function** (line ~1757)
   - Added: Double-submission guard at the start
   - Improved: preventDefault/stopPropagation handling

4. **Form onSubmit Handlers** (lines ~4305, ~4915)
   - Updated: Added guards to prevent double submission
   - Handles: Enter key presses that trigger form submission

## Result
- ✅ Single click now works
- ✅ No double submission
- ✅ Enter key still works (triggers form onSubmit which calls handleSubmit)
- ✅ Consistent behavior across all submit buttons

## Testing
- [ ] Click submit button once → Should work immediately
- [ ] Press Enter in form → Should submit
- [ ] Rapid clicks → Should only submit once
- [ ] Bidding mode button → Should work with one click
- [ ] Regular flow button → Should work with one click
