# Thread Import Widget Integration Plan

## Decision: Direct Integration

After reviewing both components, I'm integrating all enhancements directly into `FloatingAdminAssistant.tsx` rather than using a separate component. This approach:

1. ✅ Maintains single source of truth
2. ✅ Better state management (no prop drilling)
3. ✅ Easier to maintain
4. ✅ Consistent with existing code structure

## Implementation Steps

### Phase 1: Add Required Imports & Types
- Add new icon imports (IconEdit, IconCheck, IconFileUpload, etc.)
- Add UI component imports (Card, Input, Select)
- Add email parser utility import
- Update ImportStatus type to include `step` property

### Phase 2: Add New State Variables
- `editingField` - tracks which field is being edited
- `emailExtractedData` - parsed email content
- `validationErrors` - field validation errors
- `showComparison` - toggle contact comparison view
- `showImportOptions` - toggle import options panel
- `showHelp` - toggle help modal
- `importOptions` - lead source and status settings
- `fileInputRef` - file upload input ref

### Phase 3: Add Helper Functions
- `validateFields()` - real-time field validation
- `handleFileUpload()` - process uploaded files
- `handleDragOver()` / `handleDrop()` - drag & drop handlers
- `updateField()` - update editable field value
- `FieldEditor` component - inline field editing component

### Phase 4: Enhance Email Parsing
- Add useEffect to parse email content when detected
- Display extracted email data in preview

### Phase 5: Replace Import Tab Content
- Replace simplified preview with enhanced preview
- Add file upload area
- Add help modal
- Add expanded field previews
- Add contact comparison view
- Add import options panel

### Phase 6: Add Keyboard Shortcuts
- Cmd/Ctrl+I to focus textarea
- Cmd/Ctrl+Enter to import
- Esc to cancel editing

### Phase 7: Update Import Handler
- Add validation check before import
- Support import options
- Enhanced progress tracking

## Files to Modify

1. **`components/admin/FloatingAdminAssistant.tsx`** - Main integration point
2. **`utils/email-parser.ts`** - Already created, just need to import

## Files Already Created (Can Delete After Integration)

1. `components/admin/EnhancedThreadImport.tsx` - Reference implementation

## Estimated Line Count

- Current FloatingAdminAssistant: ~615 lines
- Enhanced features to add: ~400 lines
- Final estimated size: ~1000 lines

This is manageable and well within React component size limits.

