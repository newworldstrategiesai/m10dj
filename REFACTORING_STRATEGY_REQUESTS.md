# Refactoring Strategy: `pages/requests.js` (5,640 lines)

## 🎯 Goal
Break down the massive `GeneralRequestsPage` component into smaller, maintainable pieces **WITHOUT changing any visual appearance or behavior**.

## 📚 Industry Best Practices (Validated Research)

Based on current React best practices (2024), our strategy aligns with:

### Component Size Guidelines
- **Recommended Maximum:** ~200 lines per component ([rtcamp.com](https://rtcamp.com/handbook/react-best-practices/component-architecture/))
- **Current State:** 5,640 lines (28x over recommended!)
- **Target:** Break into components of 150-300 lines each

### Core Principles
1. **Single Responsibility Principle (SRP):** Each component should handle one piece of functionality
2. **Custom Hooks for Logic:** Extract reusable stateful logic into custom hooks
3. **Feature-Based Organization:** Group related files by feature/domain
4. **Co-location:** Keep related files (components, hooks, utils) together
5. **Incremental Refactoring:** Small, testable steps to reduce risk
6. **Avoid Over-Splitting:** Balance granularity with maintainability (3-4 nesting levels max)

### React-Specific Best Practices
- **Hook Order is Critical:** Must maintain exact order to prevent TDZ errors
- **Composition Over Inheritance:** Build by composing smaller components
- **Code Splitting:** Use `React.lazy` for heavy components
- **Memoization:** Use `React.memo`, `useMemo`, `useCallback` appropriately
- **Performance Profiling:** Measure before/after with React DevTools Profiler

## 📊 Current Structure Analysis

### File Breakdown:
- **Lines 1-35**: Imports and constants
- **Lines 36-224**: `RequestsPageWrapper` component (wrapper that loads org data)
- **Lines 227-2330**: `GeneralRequestsPage` component setup (state, hooks, calculations)
- **Lines 2330-2490**: `<Head>` section (meta tags, SEO)
- **Lines 2490-3115**: Background/Video section (hero area)
- **Lines 3115-3600**: Desktop sidebar (social links, branding)
- **Lines 3600-4066**: Mobile header section
- **Lines 4066-5595**: Main form content (request form, payment, bidding)
- **Lines 5598-5620**: Footer
- **Lines 5625-5636**: Social account selector modal

## 🏗️ Refactoring Plan (Safe, Incremental)

**Approach:** Following industry best practices for incremental refactoring:
- Start with pure functions (zero risk)
- Extract hooks (low risk, high value)
- Extract UI components (medium risk, requires careful prop passing)
- Test after each step
- Can stop at any point if issues arise

### Phase 1: Extract Pure Functions & Utilities (Safest)
**Risk: ⚠️ LOW** - No visual changes, just moving code

#### 1.1 Extract Helper Functions
**Target:** Lines ~725-2000 (helper functions like `handleSubmit`, `getBaseAmount`, etc.)

**Create:** `utils/requests-helpers.js`
```javascript
// Pure functions that don't depend on React state
export function calculateBundlePrice(baseAmount, bundleSize, minimumAmount) { ... }
export function getSourceDomain() { ... }
export function generateTextShadowOutline(...) { ... }
export function hexToRgba(hex, alpha) { ... }
```

**Create:** `hooks/useRequestsFormLogic.js`
```javascript
// Functions that need React state/hooks
export function useRequestsFormLogic(props) {
  const handleSubmit = useCallback(...);
  const getBaseAmount = useCallback(...);
  const getPaymentAmount = useCallback(...);
  // ... other handlers
  
  return {
    handleSubmit,
    getBaseAmount,
    getPaymentAmount,
    // ... other handlers
  };
}
```

**Benefit:** 
- Reduces main file by ~1,200 lines
- Makes functions testable
- No visual changes

---

### Phase 2: Extract State Management Hook (Medium Risk)
**Risk: ⚠️ MEDIUM** - Must ensure hook order is maintained

#### 2.1 Extract All State to Custom Hook
**Target:** Lines 240-750 (all useState, useRef, useMemo declarations)

**Create:** `hooks/useRequestsPageState.js`
```javascript
export function useRequestsPageState({
  organizationData,
  organizationCoverPhoto,
  allowedRequestTypes,
  router,
  // ... other props
}) {
  // ALL state declarations in correct order
  const router = useRouter();
  const desktopVideoRef = useRef(null);
  // ... all state
  
  // ALL useMemo calculations
  const headerVideoUrl = useMemo(...);
  // ... all calculations
  
  return {
    // All state values
    // All computed values
    // All setters
  };
}
```

**Update:** `pages/requests.js`
```javascript
export function GeneralRequestsPage(props) {
  const state = useRequestsPageState(props);
  
  // Use state values from hook
  const { desktopVideoRef, headerVideoUrl, ... } = state;
  
  // Rest of component...
}
```

**Benefit:**
- Reduces main file by ~500 lines
- Centralizes state management
- Easier to test state logic

**Critical:** Must maintain exact hook order to prevent TDZ errors!

---

### Phase 3: Extract UI Components (Higher Risk)
**Risk: ⚠️ MEDIUM-HIGH** - Must ensure props are passed correctly

#### 3.1 Extract Background/Video Section
**Target:** Lines 2490-3115

**Create:** `components/requests/RequestsBackground.tsx`
```typescript
export function RequestsBackground({
  showVideo,
  showAnimatedGradient,
  showSolidBackground,
  headerVideoUrl,
  coverPhoto,
  desktopVideoRef,
  mobileVideoRef,
  videoFailed,
  setVideoFailed,
  effectiveHeaderBackgroundType,
  effectiveHeaderBackgroundColor,
  // ... all props needed
}) {
  return (
    // Exact JSX from lines 2490-3115
  );
}
```

#### 3.2 Extract Desktop Sidebar
**Target:** Lines 3115-3600

**Create:** `components/requests/RequestsSidebar.tsx`
```typescript
export function RequestsSidebar({
  organizationData,
  previewSocialLinks,
  allowSocialAccountSelector,
  handleSocialClick,
  effectiveHeaderArtistName,
  effectiveHeaderLocation,
  effectiveHeaderDate,
  // ... all props needed
}) {
  return (
    // Exact JSX from lines 3115-3600
  );
}
```

#### 3.3 Extract Main Form Section
**Target:** Lines 4066-5595

**Create:** `components/requests/RequestsForm.tsx`
```typescript
export function RequestsForm({
  requestType,
  formData,
  setFormData,
  handleSubmit,
  // ... all props needed (50+ props)
}) {
  return (
    // Exact JSX from lines 4066-5595
  );
}
```

**Benefit:**
- Reduces main file by ~3,000 lines
- Makes UI sections reusable
- Easier to test individual sections

**Critical:** Must pass ALL props exactly as they are used!

---

### Phase 4: Extract Meta/Head Section (Low Risk)
**Target:** Lines 2330-2490

**Create:** `components/requests/RequestsHead.tsx`
```typescript
export function RequestsHead({
  organizationData,
  organizationName,
  isTipJarDomain,
  // ... all props needed
}) {
  return (
    <Head>
      {/* Exact JSX from lines 2330-2490 */}
    </Head>
  );
}
```

---

## 📋 Implementation Order (Safest First)

### Step 1: Extract Pure Functions ✅ SAFEST
1. Create `utils/requests-helpers.js`
2. Move pure functions (no React dependencies)
3. Import and use in main file
4. **Test:** Verify no visual changes
5. **Commit:** "Extract pure helper functions from requests.js"

### Step 2: Extract Form Logic Hook ✅ SAFE
1. Create `hooks/useRequestsFormLogic.js`
2. Move `handleSubmit`, `getBaseAmount`, etc.
3. Use hook in main component
4. **Test:** Verify form submission works identically
5. **Commit:** "Extract form logic to custom hook"

### Step 3: Extract State Management Hook ⚠️ MEDIUM RISK
1. Create `hooks/useRequestsPageState.js`
2. Move ALL state declarations (maintain exact order!)
3. Return state object from hook
4. Use hook in main component
5. **Test:** 
   - Verify no TDZ errors
   - Verify all state works
   - Verify visual appearance unchanged
6. **Commit:** "Extract state management to custom hook"

### Step 4: Extract Head Component ✅ LOW RISK
1. Create `components/requests/RequestsHead.tsx`
2. Move Head JSX
3. Use component in main file
4. **Test:** Verify meta tags unchanged
5. **Commit:** "Extract Head section to component"

### Step 5: Extract Background Component ⚠️ MEDIUM RISK
1. Create `components/requests/RequestsBackground.tsx`
2. Move background/video JSX
3. Pass all required props
4. **Test:** 
   - Verify background displays correctly
   - Verify video plays correctly
   - Verify all responsive breakpoints
5. **Commit:** "Extract background section to component"

### Step 6: Extract Sidebar Component ⚠️ MEDIUM RISK
1. Create `components/requests/RequestsSidebar.tsx`
2. Move sidebar JSX
3. Pass all required props
4. **Test:** 
   - Verify sidebar displays correctly
   - Verify social links work
   - Verify responsive behavior
5. **Commit:** "Extract sidebar to component"

### Step 7: Extract Main Form Component ⚠️ HIGHEST RISK
1. Create `components/requests/RequestsForm.tsx`
2. Move main form JSX (largest section)
3. Pass all required props (will be many!)
4. **Test:** 
   - Verify form renders identically
   - Verify all interactions work
   - Verify payment flow works
   - Verify bidding flow works
   - Test on mobile and desktop
5. **Commit:** "Extract main form to component"

---

## 🛡️ Safety Measures

### Before Each Step:
1. ✅ Create feature branch: `git checkout -b refactor/requests-step-X`
2. ✅ Run build: `npm run build`
3. ✅ Test locally: Verify page loads and looks identical
4. ✅ Check console: No errors or warnings

### After Each Step:
1. ✅ Visual comparison: Side-by-side with original
2. ✅ Functional testing: All interactions work
3. ✅ Build verification: `npm run build` succeeds
4. ✅ Commit with descriptive message

### Testing Checklist (After Each Step):
**Functional Testing:**
- [ ] Page loads without errors
- [ ] All form fields work (input, validation, submission)
- [ ] Payment flow works (all payment methods)
- [ ] Bidding flow works (if enabled)
- [ ] Social links work (all platforms)
- [ ] Video background works (if enabled)
- [ ] All interactive elements respond correctly

**Visual Testing:**
- [ ] Visual appearance identical (pixel-perfect comparison)
- [ ] Mobile responsive design unchanged (test multiple breakpoints)
- [ ] Desktop layout unchanged (test multiple screen sizes)
- [ ] All animations/transitions work
- [ ] Dark mode works (if applicable)

**Technical Testing:**
- [ ] No console errors or warnings
- [ ] No TDZ errors in production build (`npm run build`)
- [ ] React DevTools shows no hook violations
- [ ] Performance not degraded (use Profiler)
- [ ] Bundle size not significantly increased
- [ ] TypeScript compiles without errors (if using TS)

**Cross-Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📁 Target File Structure

Following **feature-based organization** best practices:

```
pages/
  └── requests.js (200-300 lines) - Main orchestration only

components/requests/          # Feature-based folder
  ├── RequestsHead.tsx (150 lines)
  ├── RequestsBackground.tsx (600 lines)
  ├── RequestsSidebar.tsx (500 lines)
  └── RequestsForm.tsx (1,500 lines)

hooks/requests/                # Co-located with feature
  ├── useRequestsPageState.js (800 lines)
  └── useRequestsFormLogic.js (1,200 lines)

utils/requests/                # Co-located utilities
  └── requests-helpers.js (300 lines)
```

**Total:** ~5,250 lines (same code, better organized)
**Main file reduction:** 5,640 → 250 lines (95% reduction!)
**Component sizes:** All components under 600 lines (within acceptable range)

### Alternative: Flat Structure (If preferred)
```
components/
  ├── requests/
  │   ├── RequestsHead.tsx
  │   ├── RequestsBackground.tsx
  │   ├── RequestsSidebar.tsx
  │   └── RequestsForm.tsx
hooks/
  ├── useRequestsPageState.js
  └── useRequestsFormLogic.js
utils/
  └── requests-helpers.js
```

**Note:** Feature-based organization is recommended for better maintainability.

---

## ⚠️ Critical Warnings

### 1. Hook Order is CRITICAL ⚠️ HIGHEST PRIORITY
   - **Must maintain exact order of hooks** (React Rules of Hooks)
   - Any change can cause TDZ (Temporal Dead Zone) errors
   - **Test in production build, not just dev** (minification changes execution order)
   - Use ESLint rule: `react-hooks/rules-of-hooks: "error"`
   - Use ESLint rule: `react-hooks/exhaustive-deps: "warn"`

### 2. Props Must Be Exact
   - When extracting components, pass **ALL props** (no omissions)
   - Missing props = broken functionality
   - **Use TypeScript** to catch missing props at compile time
   - Consider using a props interface/type for each component

### 3. No Visual Changes (Zero Tolerance)
   - Don't change any `className` values
   - Don't change any `style` objects
   - Don't change any conditional rendering logic
   - **Compare side-by-side after each step** (visual regression testing)
   - Use browser DevTools to verify computed styles match

### 4. Test Production Builds
   - Dev mode is forgiving (doesn't catch TDZ errors)
   - Production minification can break things
   - **Always test:** `npm run build && npm start`
   - Test on multiple browsers (Chrome, Firefox, Safari)

### 5. Performance Monitoring
   - Use React DevTools Profiler before/after each step
   - Measure render times and commit phases
   - Ensure refactoring doesn't degrade performance
   - Watch for unnecessary re-renders

### 6. Avoid Over-Splitting
   - Don't create components smaller than ~50 lines (unless truly reusable)
   - Balance granularity with maintainability
   - Maximum 3-4 levels of nesting
   - If a component is only used once, consider keeping it inline

---

## 🚀 Quick Start

To begin refactoring:

```bash
# Step 1: Extract pure functions
git checkout -b refactor/requests-step-1-extract-helpers
# ... make changes ...
npm run build
# Test thoroughly
git commit -m "Extract pure helper functions from requests.js"
git push

# Step 2: Extract form logic
git checkout -b refactor/requests-step-2-extract-form-logic
# ... make changes ...
# ... test ...
git commit -m "Extract form logic to custom hook"
git push

# Continue with remaining steps...
```

---

## 📝 Additional Best Practices

### Code Quality
- **Use TypeScript** for extracted components (catch errors at compile time)
- **Add JSDoc comments** for complex functions
- **Follow consistent naming:** PascalCase for components, camelCase for functions
- **Use ESLint rules:** `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps`

### Performance Optimization
- Use `React.memo` for components that receive stable props
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers passed to child components
- Consider lazy loading heavy components with `React.lazy`

### Testing Strategy
- **Unit tests** for extracted hooks and utilities
- **Integration tests** for component interactions
- **Visual regression tests** (optional but recommended)
- **E2E tests** for critical user flows (payment, bidding)

### Documentation
- Document complex logic in extracted hooks
- Add comments explaining "why" not "what"
- Update README if folder structure changes significantly

## 📝 Notes

- This is a **conservative, incremental approach** following industry best practices
- Each step is independently testable and reversible
- Can stop at any step if issues arise (no need to complete all steps)
- Each step reduces risk for the next
- Final result: Maintainable, testable, performant, same appearance
- **Recommended approach:** Complete Steps 1-3 first (safest, highest value), then evaluate if Steps 4-7 are needed
