# Fix TypeScript Errors Locally Before Pushing

This guide helps you identify and fix all TypeScript errors locally before pushing to Vercel.

## Quick Start

### Step 1: Clean Build
```powershell
npm run clean:build
```

### Step 2: Run Local Build
```powershell
npm run build:check
```

This will show all TypeScript errors. Fix them one by one.

### Step 3: Verify Build Succeeds
```powershell
npm run build:check
```

If it completes without errors, you're ready to push!

## Common TypeScript Errors & Fixes

### 1. Type Mismatch Errors
**Error:** `Type 'X' is not assignable to type 'Y'`

**Fix:** Add explicit type annotations:
```typescript
// Before
const [state, setState] = useState({ core: [], productivity: [] });

// After
const [state, setState] = useState<{ core: any[]; productivity: any[] }>({ core: [], productivity: [] });
```

### 2. Missing Return Type
**Error:** Function return type doesn't match

**Fix:** Add explicit return type:
```typescript
// Before
export const getModulesByCategory = () => {
  return { core: [], productivity: [] };
};

// After
export const getModulesByCategory = (): { core: any[]; productivity: any[] } => {
  return { core: [], productivity: [] };
};
```

### 3. React Component Props
**Error:** `icon?: any` type issues

**Fix:** Use proper React types:
```typescript
// Before
icon?: any;

// After
icon?: React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string; style?: React.CSSProperties }> | null;
```

### 4. Module Resolution
**Error:** `Can't resolve '@/path/to/module'`

**Fix:** 
- Check if file exists
- Verify `tsconfig.json` paths are correct
- Ensure file is committed to git

## Workflow

1. **Make changes**
2. **Clean build**: `npm run clean:build`
3. **Build locally**: `npm run build:check`
4. **Fix errors** shown in output
5. **Repeat** until build succeeds
6. **Commit and push**

## Tips

- **Incremental fixes**: Fix one error at a time
- **Check imports**: Many errors are from missing files
- **Type annotations**: When in doubt, add explicit types
- **Use `any` sparingly**: Only when necessary, prefer proper types

## Files Already Fixed

✅ `lib/modules.config.ts` - Added return type to `getModulesByCategory()`
✅ `app/home/components/ModuleGrid.tsx` - Fixed `categorizedModules` state type
✅ `app/home/components/ModuleCard.tsx` - Fixed `icon` prop type

## Next Steps

If you encounter more TypeScript errors:
1. Read the error message carefully
2. Identify the file and line number
3. Check the expected vs actual type
4. Add proper type annotations
5. Test locally before pushing
