# Questionnaire UI - Critical Improvements Needed

## 🔴 Critical Issues Found

### 1. **TooltipProvider Redundancy** 
- **Problem**: Multiple `TooltipProvider` instances (one per tooltip) - inefficient and can cause performance issues
- **Fix**: Wrap entire component in single `TooltipProvider` at top level

### 2. **No Visual Step Progress Indicator**
- **Problem**: Only shows "Step X of Y" text - users can't see where they are in the journey
- **Fix**: Add visual step indicator showing all steps with current position highlighted

### 3. **Poor Error Handling**
- **Problem**: Uses `alert()` for errors - unprofessional and blocks UI
- **Fix**: Use toast notifications or inline error messages

### 4. **No Auto-Save**
- **Problem**: Risk of data loss if user closes browser or navigates away
- **Fix**: Auto-save to localStorage every 2-3 seconds

### 5. **Redundant Tooltips**
- **Problem**: Same "What is a song?" tooltip repeated 6+ times - overwhelming
- **Fix**: Show tooltip once at top of relevant sections, not on every field

### 6. **Review Step Lacks Edit Capability**
- **Problem**: Users can't edit from review - must go back through all steps
- **Fix**: Add "Edit" buttons next to each section in review

### 7. **No Optional/Required Indicators**
- **Problem**: Users don't know what's required vs optional
- **Fix**: Add "(Optional)" badges or required asterisks

### 8. **Welcome Step Adds Little Value**
- **Problem**: Welcome step just says "we're excited" - wastes user time
- **Fix**: Combine with first real step or make it skippable

### 9. **Mobile Touch Targets Too Small**
- **Problem**: Checkboxes and buttons may be hard to tap on mobile
- **Fix**: Increase minimum touch target size to 44x44px

### 10. **Missing URL Validation**
- **Problem**: No validation for playlist links - users can enter invalid URLs
- **Fix**: Add real-time URL validation with helpful error messages

### 11. **No Keyboard Navigation Hints**
- **Problem**: Users don't know they can use keyboard to navigate
- **Fix**: Add keyboard shortcuts (Enter to proceed, Esc to go back)

### 12. **Long Text Descriptions**
- **Problem**: Some descriptions are too wordy and overwhelming
- **Fix**: Condense to essential info, use tooltips for details

### 13. **No Character Counters**
- **Problem**: No feedback on text input length
- **Fix**: Add character counters for textareas

### 14. **Review Step Formatting**
- **Problem**: Review step is plain text - hard to scan
- **Fix**: Better visual hierarchy, icons, and formatting

### 15. **No Loading States for Form Actions**
- **Problem**: No feedback when saving or navigating
- **Fix**: Add loading spinners and disable buttons during actions

## 🎨 Recommended UI Improvements

1. **Step Indicator**: Visual progress bar with clickable steps
2. **Better Typography**: Clearer hierarchy, better spacing
3. **Inline Validation**: Real-time feedback as users type
4. **Auto-save Indicator**: Show "Saving..." or "Saved" status
5. **Skip Options**: Clear "Skip" buttons for optional sections
6. **Better Mobile Layout**: Stack elements better on small screens
7. **Accessibility**: ARIA labels, keyboard navigation, focus management
8. **Visual Feedback**: Success states, error states, hover effects
9. **Smart Defaults**: Pre-fill where possible from lead data
10. **Confirmation Dialogs**: Warn before leaving with unsaved changes

