#!/bin/bash

# Pre-push hook to validate deployment before pushing
# This prevents pushing code that will cause runtime errors in production

echo "🔍 Running pre-push validation..."

# Run the pre-deployment check
if ! npm run build:check; then
    echo ""
    echo "❌ Pre-push validation FAILED!"
    echo ""
    echo "The build:check script failed. This means there are runtime errors"
    echo "that would cause 'Application Error' screens in production."
    echo ""
    echo "Please fix the errors shown above and try pushing again."
    echo ""
    echo "To skip this check (NOT RECOMMENDED), use:"
    echo "  git push --no-verify"
    echo ""
    exit 1
fi

echo "✅ Pre-push validation passed!"
exit 0

