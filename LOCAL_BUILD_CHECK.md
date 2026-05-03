# Local Build Check Guide

To avoid TypeScript errors in Vercel deployments, always run checks locally before pushing to production.

## Quick Check (Recommended)

### Option 1: Next.js Build Type Check (Most Reliable)
Next.js includes TypeScript checking in its build process. This is what Vercel uses:
```bash
npm run build:typecheck
```

**Note:** This may run out of memory on large projects. If it does, you can:
- Close other applications to free up memory
- Use Vercel's preview deployments instead (recommended)
- Use Option 2 below

### Option 2: TypeScript Direct Check (May Run Out of Memory)
Before pushing, run:
```bash
npm run type-check:quick
```

This will check for TypeScript errors without checking library types (faster, but may still run out of memory on very large projects).

### Option 3: Check Changed Files Only (Lightweight)
If you only want to check files you've modified:
```bash
npm run check-changed
```

This is the most memory-efficient option.

## Full Type Check

For a complete type check (takes longer, uses more memory):
```bash
npm run type-check
```

## Build Check

To verify both type checking and build:
```bash
npm run build:check
```

## Pre-Push Hook (Optional)

You can set up a git pre-push hook to automatically run checks:

### Windows (PowerShell)
```powershell
# Copy the pre-push script to .git/hooks
Copy-Item scripts/pre-push-check.ps1 .git/hooks/pre-push.ps1
```

### Linux/Mac
```bash
# Copy and make executable
cp scripts/pre-push-check.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

Or manually run before pushing:
```bash
npm run check-before-push
```

## Recommended Workflow

### For Small Changes:
1. **Before committing:**
   ```bash
   npm run check-changed
   ```

2. **If errors found:**
   - Fix the errors
   - Run `npm run check-changed` again
   - Repeat until no errors

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

### For Large Changes or When Memory is Available:
1. **Before committing:**
   ```bash
   npm run build:typecheck
   ```

2. **If errors found:**
   - Fix the errors
   - Run `npm run build:typecheck` again
   - Repeat until no errors

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

### Alternative: Use Vercel Preview Deployments
If local builds are too resource-intensive:
1. Push to a feature branch
2. Vercel will create a preview deployment
3. Check the build logs for TypeScript errors
4. Fix errors and push again
5. Once preview build passes, merge to main

## Memory Issues

If you encounter "heap out of memory" errors:
- **Recommended:** Use `npm run check-changed` to check only modified files
- Close other applications to free up memory
- Use Vercel preview deployments instead (they have more resources)
- The TypeScript scripts use `--max-old-space-size=4096` (4GB) by default, but Next.js build may still need more

## Best Practice

For large projects like this one:
1. **Use `npm run check-changed`** for quick local checks
2. **Rely on Vercel preview deployments** for comprehensive type checking
3. **Monitor Vercel build logs** - they will catch all TypeScript errors
4. **Fix errors immediately** when Vercel reports them

## Note

Vercel will still run a full build, but catching errors locally saves time and prevents failed deployments.
