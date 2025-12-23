# Deployment Safety Guide

> **Note**: Pre-deployment validation has been removed to simplify the build process. This document is kept for reference.

## Problem

The build process (`npm run build`) only checks for **compile-time errors**, not **runtime errors**. This means:

- ✅ Build succeeds: Code compiles, no syntax errors
- ❌ Runtime fails: React hooks violations, missing imports, undefined variables

## Manual Testing Checklist

Before pushing to production, manually verify:

1. ✅ Build succeeds: `npm run build`
2. ✅ Critical pages load: Test `/bid` and `/requests` in browser
3. ✅ No console errors: Check browser console
4. ✅ No "Application Error" screens

## Setup

### First Time Setup

Install git hooks (optional but recommended):

```bash
./scripts/setup-git-hooks.sh
```

This will automatically run validation on every `git push`.

## Usage

### Before Pushing to Production

```bash
npm run build:check
```

Or just push - the git hook will run it automatically if installed.

This will:
- Build the app
- Start a test server
- Test critical pages (`/bid`, `/requests`, `/`)
- **Fail if any runtime errors are detected**

### Manual Testing Checklist

Before pushing, manually verify:

1. ✅ Build succeeds: `npm run build`
2. ✅ Critical pages load: Test `/bid` and `/requests` in browser
3. ✅ No console errors: Check browser console
4. ✅ No "Application Error" screens

### CI/CD Integration

The GitHub Actions workflow (`.github/workflows/pre-deploy-validation.yml`) automatically:

- Runs on every push to `main`
- Runs on pull requests
- Blocks merge if validation fails

## Critical Pages to Test

These pages are automatically tested:

- `/bid` - Bidding interface (most critical)
- `/requests` - General requests page
- `/` - Home page

## Common Runtime Errors

### React Hooks Violations
- **Error**: "Rendered more hooks than during the previous render"
- **Cause**: Hooks called conditionally or after early returns
- **Fix**: Move all hooks before any conditional returns

### Missing Imports
- **Error**: "X is not defined"
- **Cause**: Import removed but still used
- **Fix**: Add back to imports

### Undefined Variables
- **Error**: "Cannot read property of undefined"
- **Cause**: Variable not initialized
- **Fix**: Add proper initialization/checks

## Deployment Process

1. **Local Development**: Make changes, test locally
2. **Pre-Deploy Check**: Run `npm run build:check`
3. **Fix Errors**: If check fails, fix issues
4. **Push to Git**: Only push after validation passes
5. **CI/CD Validation**: GitHub Actions runs additional checks
6. **Deploy**: Vercel deploys if all checks pass

## Emergency Rollback

If a bad deployment gets through:

1. **Revert the commit**: `git revert HEAD`
2. **Force push**: `git push --force` (only if necessary)
3. **Redeploy**: Vercel will automatically redeploy the previous version

## Best Practices

1. **Always run `build:check` before pushing**
2. **Test in browser after build**
3. **Check browser console for errors**
4. **Use staging environment for testing**
5. **Monitor production errors** (set up error tracking)

## Future Improvements

- [ ] Add error tracking (Sentry, LogRocket)
- [ ] Add E2E tests (Playwright, Cypress)
- [ ] Add visual regression testing
- [ ] Add performance budgets
- [ ] Add automated smoke tests

