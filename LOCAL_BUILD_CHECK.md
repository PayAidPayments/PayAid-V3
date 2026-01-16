# Local Build Check Guide

To avoid TypeScript errors in Vercel deployments, always run checks locally before pushing to production.

## Quick Check (Recommended)

### Option 1: Next.js Build Type Check (Most Reliable)
Next.js includes TypeScript checking in its build process. This is what Vercel uses:
```bash
npm run build:typecheck
```

This runs the same type checking that Vercel will run, but without linting.

### Option 2: TypeScript Direct Check
Before pushing, run:
```bash
npm run type-check:quick
```

This will check for TypeScript errors without checking library types (faster, but may run out of memory on large projects).

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

## Workflow

1. **Before committing:**
   ```bash
   npm run type-check:quick
   ```

2. **If errors found:**
   - Fix the errors
   - Run `npm run type-check:quick` again
   - Repeat until no errors

3. **Before pushing:**
   ```bash
   npm run check-before-push
   ```

4. **If all checks pass:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

## Memory Issues

If you encounter "heap out of memory" errors:
- Close other applications
- Use `type-check:quick` instead of `type-check`
- The scripts use `--max-old-space-size=4096` (4GB) by default

## Note

Vercel will still run a full build, but catching errors locally saves time and prevents failed deployments.
