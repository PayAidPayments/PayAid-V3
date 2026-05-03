#!/bin/bash
# Pre-push hook to check TypeScript errors before pushing
echo "Running pre-push checks..."

# Run type check with increased memory
echo "Running TypeScript type check..."
npm run type-check:quick

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ TypeScript errors found! Please fix them before pushing."
    exit 1
fi

echo ""
echo "✅ Type check passed!"
exit 0
