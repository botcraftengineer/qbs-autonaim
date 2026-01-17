#!/bin/bash

echo "🧪 Checking Playwright Tests"
echo "=============================="
echo ""

# Clean up
rm -rf test-results playwright-report 2>/dev/null

# Run fast tests (auth)
echo "📝 Running fast tests (auth)..."
bun with-env playwright test --project=ui-fast --reporter=list 2>&1 | tail -20

echo ""
echo "=============================="
echo ""

# Run slow tests with limited failures
echo "📝 Running slow tests (e2e)..."
bun with-env playwright test --project=e2e-slow --max-failures=3 --reporter=list 2>&1 | tail -30
