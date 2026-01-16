#!/bin/sh
# Preserve Landing Page Before Deployment
# Backs up landing page and related files before V3 deployment

set -e

BACKUP_DIR=".backup/landing-page-$(date +%Y%m%d_%H%M%S)"
mkdir -p "${BACKUP_DIR}"

echo "🛡️  Preserving Landing Page Before Deployment..."
echo "Backup directory: ${BACKUP_DIR}"

# 1. Backup main landing page
if [ -f "app/page.tsx" ]; then
  cp app/page.tsx "${BACKUP_DIR}/page.tsx"
  echo "✅ Backed up: app/page.tsx"
else
  echo "⚠️  Warning: app/page.tsx not found"
fi

# 2. Backup login page if exists
if [ -f "app/login/page.tsx" ]; then
  mkdir -p "${BACKUP_DIR}/login"
  cp app/login/page.tsx "${BACKUP_DIR}/login/page.tsx"
  echo "✅ Backed up: app/login/page.tsx"
fi

# 3. Backup signup page if exists
if [ -f "app/signup/page.tsx" ]; then
  mkdir -p "${BACKUP_DIR}/signup"
  cp app/signup/page.tsx "${BACKUP_DIR}/signup/page.tsx"
  echo "✅ Backed up: app/signup/page.tsx"
fi

# 4. Backup landing page components
if [ -d "components/landing" ]; then
  cp -r components/landing "${BACKUP_DIR}/components-landing"
  echo "✅ Backed up: components/landing"
fi

# 5. Check for landing page dependencies
echo ""
echo "📋 Checking landing page dependencies..."

# Check imports in landing page
if [ -f "app/page.tsx" ]; then
  echo "Components imported by landing page:"
  grep -E "from ['\"]@/components|from ['\"]\.\./components" app/page.tsx | head -10 || echo "  (No component imports found)"
  
  echo ""
  echo "API calls in landing page:"
  grep -E "/api/|fetch\(|axios\." app/page.tsx | head -10 || echo "  (No API calls found)"
fi

# 6. Create restoration script
cat > "${BACKUP_DIR}/restore.sh" << 'EOF'
#!/bin/sh
# Restore Landing Page from Backup
# Usage: ./restore.sh

set -e

BACKUP_DIR="$(dirname "$0")"

echo "🔄 Restoring landing page from backup..."

if [ -f "${BACKUP_DIR}/page.tsx" ]; then
  cp "${BACKUP_DIR}/page.tsx" app/page.tsx
  echo "✅ Restored: app/page.tsx"
else
  echo "❌ Error: page.tsx not found in backup"
  exit 1
fi

if [ -f "${BACKUP_DIR}/login/page.tsx" ]; then
  mkdir -p app/login
  cp "${BACKUP_DIR}/login/page.tsx" app/login/page.tsx
  echo "✅ Restored: app/login/page.tsx"
fi

if [ -f "${BACKUP_DIR}/signup/page.tsx" ]; then
  mkdir -p app/signup
  cp "${BACKUP_DIR}/signup/page.tsx" app/signup/page.tsx
  echo "✅ Restored: app/signup/page.tsx"
fi

echo ""
echo "✅ Landing page restored!"
echo "Next steps:"
echo "  1. Review changes: git diff app/page.tsx"
echo "  2. Commit: git add app/page.tsx && git commit -m 'fix: Restore landing page'"
echo "  3. Push: git push origin main"
EOF

chmod +x "${BACKUP_DIR}/restore.sh"

# 7. Create verification checklist
cat > "${BACKUP_DIR}/VERIFICATION.md" << EOF
# Landing Page Verification Checklist

After deployment, verify:

- [ ] Landing page loads at: https://your-domain.com/
- [ ] Hero section displays correctly
- [ ] Logo/branding visible
- [ ] "Sign In" button works (links to /login)
- [ ] "Get Started" button works (links to /signup)
- [ ] All sections visible (no broken layouts)
- [ ] Images/assets load correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fast load time (< 2 seconds)

## Quick Test Commands

\`\`\`bash
# Check landing page loads
curl -I https://your-domain.com/

# Check for key elements
curl https://your-domain.com/ | grep -i "get started\|sign in\|hero"

# Check for errors
curl https://your-domain.com/ 2>&1 | grep -i "error\|404"
\`\`\`

## Restore if Needed

\`\`\`bash
cd "${BACKUP_DIR}"
./restore.sh
\`\`\`
EOF

echo ""
echo "✅ Landing page preservation complete!"
echo ""
echo "Backup location: ${BACKUP_DIR}"
echo ""
echo "Files backed up:"
ls -lh "${BACKUP_DIR}" | grep -v "^d" | tail -n +2

echo ""
echo "📋 Next steps:"
echo "1. Review backup: ls -la ${BACKUP_DIR}"
echo "2. Deploy new code: git push origin main"
echo "3. Verify landing page after deployment"
echo "4. If issues: Run ${BACKUP_DIR}/restore.sh"
