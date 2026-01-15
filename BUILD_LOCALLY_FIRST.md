# Build Locally Before Pushing to Vercel

This guide helps you catch build issues locally before pushing to Vercel, saving time and avoiding failed deployments.

## Quick Start

### Option 1: Use the PowerShell Script (Recommended)
```powershell
npm run build:vercel
```

This script:
1. Installs dependencies (mimicking Vercel's `installCommand`)
2. Generates Prisma Client
3. Runs the build
4. Reports success/failure clearly

### Option 2: Use npm Script Directly
```bash
npm run build:check
```

This runs the exact same build command that Vercel uses:
```bash
prisma generate && next build --webpack
```

## What This Does

The build process mimics Vercel's build exactly:
1. **Install Dependencies**: `npm install --legacy-peer-deps` (same as Vercel)
2. **Generate Prisma**: `prisma generate` (with `PRISMA_GENERATE_DATAPROXY=false`)
3. **Build Next.js**: `next build --webpack` (same as Vercel)

## Workflow

1. **Make your changes**
2. **Clean build artifacts** (if needed): `npm run clean:build`
3. **Run local build**: `npm run build:vercel`
4. **Fix any errors** that appear
5. **Repeat** until build succeeds
6. **Commit and push** to trigger Vercel deployment

## Clean Build

If you encounter lock file errors or want a fresh build:
```powershell
npm run clean:build
```

This removes:
- `.next` directory (build artifacts)
- `.next/lock` (lock files)
- `node_modules/.cache` (cached files)

## Common Issues to Watch For

- **Module resolution errors**: Check `next.config.js` webpack aliases
- **TypeScript errors**: Run `npm run type-check` separately
- **Missing dependencies**: Check `package.json`
- **Import path issues**: Verify `@/` aliases in `tsconfig.json`
- **Prisma errors**: Ensure database connection or use `--skip-generate`

## Environment Variables

Make sure you have a `.env.production` file with the same variables that Vercel uses. The build will use:
- `.env.production` (for production builds)
- `.env.local` (if exists)
- `.env` (fallback)

## Tips

- If the build is slow, you can skip Prisma generation: `next build --webpack` (but this won't match Vercel exactly)
- Use `npm run build:local` for a quick build without the full Vercel simulation
- Check the build output for warnings that might become errors in production

## Success Criteria

✅ Build completes without errors
✅ No module resolution issues
✅ All TypeScript types are valid
✅ No missing dependencies

Once you see "✅ Build completed successfully!", you're ready to push!
