# Scripts

Utility scripts for the DJ Dash ecosystem.

## Product Sync Audit

**Purpose:** Compare TipJar.live and M10DJCompany.com (flagship) to identify differences, missing features, and sync opportunities.

### Usage

```bash
# Run the audit with formatted console output
npm run audit:sync

# Output as JSON
npm run audit:sync:json

# Output as Markdown
npm run audit:sync:md

# Or run directly
node scripts/sync-audit.js
node scripts/sync-audit.js --json
node scripts/sync-audit.js --markdown
```

### What It Checks

#### Features Compared
- **UI Features:** Hero sections, feature cards, testimonials, pricing, CTAs, FAQs
- **Functional Features:** Song search, payment flow, tips, request queues, QR codes
- **Auth & User:** Authentication, dashboards
- **Branding:** White-label, dark mode
- **SEO:** Metadata, structured data

#### Components Mapped
- Headers & Footers (per product)
- Feature Cards
- Testimonial Cards
- Pricing Cards
- Payment components (crowd-request)
- TipJar-specific components

### Output

Reports are saved to `/audit-reports/` (gitignored):
- `sync-audit-{timestamp}.json` - Full JSON report
- `sync-audit-{timestamp}.md` - Markdown report

### Interpreting Results

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ Synced | Feature exists in both products | Verify implementations match |
| 🔴 Missing in TipJar | Flagship has it, TipJar doesn't | Consider adding to TipJar |
| 🔵 TipJar Only | TipJar has it, flagship doesn't | Consider adding to flagship |

### Priority Levels

- **HIGH:** Critical sync issues - shared components not being used
- **MEDIUM:** Components exist in both but may need verification
- **LOW:** Nice-to-have improvements

### Recommendations

The script generates actionable recommendations:

1. **Component Reuse:** Identifies shared components (like `PaymentAmountSelector`) that TipJar should import instead of reimplementing.

2. **Feature Sync:** Lists features from flagship that could benefit TipJar.

3. **Refactoring:** Suggests breaking large files into smaller, shareable components.

### Example Output

```
📊 SUMMARY
───────────────────────────────────────────────────────────────────
Total Features Checked:       18
✅ Synced Features:           12
🔴 Missing in TipJar:         4
🔵 TipJar-Only Features:      2
📄 Flagship Requests Page:    3376 lines

🔧 FEATURE COMPARISON
───────────────────────────────────────────────────────────────────
Feature                  │ Flagship │ TipJar │ Status
─────────────────────────┼──────────┼────────┼─────────────────
heroSection              │   ✅     │  ✅    │ ✅ Synced
songSearch               │   ✅     │  ❌    │ 🔴 MISSING IN TIPJAR
bidding                  │   ✅     │  ❌    │ 🔴 MISSING IN TIPJAR
```

### Extending the Script

#### Adding New Features to Check

Edit `FEATURE_PATTERNS` in `sync-audit.js`:

```javascript
const FEATURE_PATTERNS = {
  // Add new feature pattern
  myNewFeature: /myFeature|MyFeature|my-feature/gi,
  // ...
};
```

#### Adding New Component Mappings

Edit `COMPONENT_MAPPING`:

```javascript
const COMPONENT_MAPPING = {
  'MyComponent': {
    flagship: 'components/company/MyComponent.js',
    tipjar: 'components/tipjar/MyComponent.tsx',
    djdash: null,
  },
  // ...
};
```

## Other Scripts

| Script | Purpose |
|--------|---------|
| `optimize-logo-gif.js` | Optimize logo GIF files |
| `generate-og-image.js` | Generate Open Graph images |

---

*For questions or improvements, create an issue or PR.*

