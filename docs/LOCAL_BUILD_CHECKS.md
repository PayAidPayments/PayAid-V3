# Local Build Checks - Catch Errors Before Vercel

This guide helps you catch TypeScript and build errors **locally** before pushing to Vercel, saving you days of back-and-forth fixes.

## The Problem

Previously, errors were only discovered after pushing to Vercel, causing:
- ❌ Failed deployments
- ❌ 3+ days of fixing errors one-by-one
- ❌ Wasted build minutes
- ❌ Delayed releases

## The Solution

We now have **automated checks** that run the **exact same build process** as Vercel locally.

## Quick Start

### Before Every Push

Run this command to check your code matches Vercel's build:

```bash
npm run check-before-push
```

This will:
1. ✅ Run TypeScript type checking
2. ✅ Run the production build (same as Vercel)
3. ✅ Show you any errors **before** you push

**If this passes, your Vercel build will pass too!**

## Available Commands

### `npm run check-before-push`
**Recommended before every push**

Runs both type checking and production build. Takes 2-3 minutes but catches all errors.

### `npm run type-check:quick`
Fast TypeScript check (skips lib checks). Good for quick feedback during development.

### `npm run build`
Full production build. This is what Vercel runs. Use this to test locally.

### `npm run build:local`
Same as `npm run build` - generates Prisma and builds Next.js.

## How It Works

### Vercel's Build Process
Vercel runs:
```bash
npm install --legacy-peer-deps
prisma generate
npm run build  # which runs: prisma generate && next build --webpack
```

### Our Local Checks
Our scripts run the **same commands** locally, so you see the same errors Vercel will see.

## Automatic Checks

### Pre-Push Hook
When you run `git push`, it automatically runs `npm run pre-push` which:
- Runs type checking
- Runs production build
- **Blocks the push** if errors are found

### GitHub Actions
On every pull request and push to `main`, GitHub Actions runs:
- TypeScript type checking
- Production build

This provides a **safety net** even if local checks are skipped.

## Troubleshooting

### "Build works locally but fails on Vercel"

1. Make sure you're running `npm run check-before-push` before pushing
2. Check that your local Node.js version matches Vercel (Node 20)
3. Ensure you're using `npm install --legacy-peer-deps` locally
4. Clear `.next` folder: `npm run clean:build` then rebuild

### "Type check passes but build fails"

This is normal! The build process catches more errors than type checking alone:
- Missing imports
- Runtime type errors
- Module resolution issues
- Next.js specific errors

**Always run the full build before pushing.**

### "Pre-push hook not running"

If the git hook isn't working:
1. Make sure you have the latest code: `git pull`
2. Run manually: `npm run check-before-push`
3. Check git hooks are enabled (they should be by default)

## Best Practices

1. **Before pushing**: Always run `npm run check-before-push`
2. **During development**: Use `npm run type-check:quick` for fast feedback
3. **Before major commits**: Run `npm run build` to be extra sure
4. **If build fails**: Fix errors locally, then run `npm run build` again to verify

## CI/CD Pipeline

```
Local Development
    ↓
npm run check-before-push  ← YOU RUN THIS
    ↓
git push
    ↓
Pre-push hook (automatic)  ← RUNS AUTOMATICALLY
    ↓
GitHub Actions (automatic)  ← RUNS AUTOMATICALLY
    ↓
Vercel Deployment  ← SHOULD PASS NOW!
```

## Summary

- ✅ **Always run `npm run check-before-push` before pushing**
- ✅ This catches errors **before** Vercel sees them
- ✅ Saves days of back-and-forth fixes
- ✅ Pre-push hook provides automatic protection
- ✅ GitHub Actions provides additional safety net

**No more 3-day error fixing cycles!** 🎉
