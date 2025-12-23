#!/bin/bash

# Setup git hooks for deployment safety
# Run this once to enable pre-push validation

echo "🔧 Setting up git hooks for deployment safety..."

# Copy pre-push hook
cp scripts/pre-push-hook.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed!"
echo ""
echo "Now, every 'git push' will automatically run pre-deployment validation."
echo "If validation fails, the push will be blocked to prevent breaking production."

