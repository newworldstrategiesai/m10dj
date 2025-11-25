# Admin Pricing Page - Test Checklist

## 🎯 What to Test

### 1. Summary Tab (Default View)
- [ ] Page loads with Summary tab active
- [ ] All 3 packages display:
  - Package 1: $2,000 / $2,600 (savings: $600, 23%)
  - Package 2: $2,500 / $3,400 (savings: $900, 26%) - "Most Popular" badge
  - Package 3: $3,000 / $3,900 (savings: $900, 23%)
- [ ] Breakdown totals show for each package
- [ ] Green checkmark if breakdown matches a la carte price
- [ ] Orange warning if breakdown doesn't match
- [ ] Add-ons summary shows at least 6 add-ons
- [ ] Shows count of total add-ons if more than 6

### 2. Packages Tab
- [ ] Can switch to Packages tab
- [ ] All 3 packages are editable
- [ ] Package prices are editable
- [ ] A la carte prices are editable
- [ ] Savings calculation updates in real-time
- [ ] Warning appears if a la carte < package price
- [ ] Breakdown section shows line items
- [ ] Breakdown total displays and updates
- [ ] Warning if breakdown total ≠ a la carte price
- [ ] "Load Defaults" button appears if breakdown is empty
- [ ] Can add new breakdown items
- [ ] Can edit breakdown items (name, price, description)
- [ ] Can remove breakdown items
- [ ] Changes are tracked (unsaved changes indicator)

### 3. Add-ons Tab
- [ ] Can switch to Add-ons tab
- [ ] Default add-ons are loaded (11+ items)
- [ ] Can edit addon name, price, description
- [ ] Can add new add-ons
- [ ] Can remove add-ons
- [ ] Changes are tracked

### 4. Save Functionality
- [ ] "Save All Changes" button is visible
- [ ] Button shows loading state when saving
- [ ] Success toast appears after save
- [ ] Changes persist after page refresh
- [ ] Unsaved changes indicator clears after save

### 5. Visual & UX
- [ ] Page is responsive (test on mobile viewport)
- [ ] Dark mode works correctly
- [ ] All icons display properly
- [ ] Colors are correct (brand colors, warnings, success)
- [ ] Text is readable
- [ ] Forms are easy to use

## 🐛 Known Issues to Check

- [ ] If breakdowns are empty, defaults should auto-load
- [ ] Savings percentage should calculate correctly
- [ ] Breakdown validation should work
- [ ] No console errors

## ✅ Expected Behavior

1. **Summary Tab**: Quick overview of all pricing
2. **Packages Tab**: Detailed editing of packages
3. **Add-ons Tab**: Manage all add-ons
4. **Auto-load**: Defaults populate if empty
5. **Validation**: Warnings for mismatches
6. **Save**: Changes persist to database

## 📝 Test Results

After testing, note:
- Any bugs found
- UI/UX improvements needed
- Missing features
- Performance issues

