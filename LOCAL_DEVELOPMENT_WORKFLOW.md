# Local Development Workflow for Landing Page

## 🎯 Goal
Work on landing page enhancements locally without affecting production. Only deploy to Vercel when satisfied with changes.

## 📁 File Structure

- **`app/page.tsx`** - Current production version (matches Vercel)
- **`app/page.production-backup.tsx`** - Backup of production version
- **`app/page.local.tsx`** - Local development version (for testing)

## 🔄 Workflow

### Step 1: Start Local Development
```bash
# The current app/page.tsx is your production version
# Work directly on app/page.tsx for local development
npm run dev
```

### Step 2: Test Locally
- Open `http://localhost:3000`
- Make changes to `app/page.tsx`
- Test thoroughly in browser
- Iterate until satisfied

### Step 3: Deploy to Production (Only When Ready)
```bash
# Review changes
git diff app/page.tsx

# Commit and push
git add app/page.tsx
git commit -m "feat: Landing page enhancements - [describe changes]"
git push origin main
```

## ⚠️ Important Notes

1. **DO NOT** push changes until you're satisfied with local testing
2. **DO** test thoroughly on localhost before deploying
3. **DO** create a backup before major changes:
   ```bash
   Copy-Item app/page.tsx app/page.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').tsx
   ```

## 🔍 Current Status

- ✅ Production version backed up as `app/page.production-backup.tsx`
- ✅ Local development ready - work on `app/page.tsx`
- ✅ Changes will only go to production when explicitly pushed

## 📝 Development Guidelines

1. Make incremental changes
2. Test each change locally
3. Use browser dev tools to inspect
4. Test on different screen sizes
5. Check all links and interactions
6. Only commit when ready for production
