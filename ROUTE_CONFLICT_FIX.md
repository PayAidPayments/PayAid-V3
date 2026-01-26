# Next.js Route Conflict Fix

**Error:** `You cannot use different slug names for the same dynamic path ('slug' !== 'id')`  
**Status:** ✅ **FIXED**

---

## 🔍 **ROOT CAUSE**

The error occurred because Next.js found conflicting dynamic route segments at the same path level:

- `/app/api/forms/[id]/route.ts` - Uses `[id]` parameter
- `/app/api/forms/[slug]/render/route.ts` - Uses `[slug]` parameter
- `/app/api/forms/[slug]/submit/route.ts` - Uses `[slug]` parameter

Next.js cannot have both `[id]` and `[slug]` at the same level (`/api/forms/[something]`).

---

## ✅ **FIX APPLIED**

### **Moved Slug Routes to Public Path**

**Before:**
- `/api/forms/[id]/route.ts` - Admin routes
- `/api/forms/[slug]/render/route.ts` - Public render
- `/api/forms/[slug]/submit/route.ts` - Public submit

**After:**
- `/api/forms/[id]/route.ts` - Admin routes (unchanged)
- `/api/forms/public/[slug]/render/route.ts` - Public render (moved)
- `/api/forms/public/[slug]/submit/route.ts` - Public submit (moved)

**Why:**
- Separates public routes from admin routes
- No conflict since paths are different
- Clearer API structure

---

## 📝 **UPDATED ROUTES**

### **Admin Routes (unchanged):**
- `GET /api/forms/[id]` - Get form
- `PUT /api/forms/[id]` - Update form
- `DELETE /api/forms/[id]` - Delete form
- `GET /api/forms/[id]/analytics` - Get analytics
- `GET /api/forms/[id]/submissions` - Get submissions

### **Public Routes (new paths):**
- `GET /api/forms/public/[slug]/render` - Render form (was `/api/forms/[slug]/render`)
- `POST /api/forms/public/[slug]/submit` - Submit form (was `/api/forms/[slug]/submit`)

---

## 🔧 **REQUIRED UPDATES**

### **1. Update Form Embed Component**
If `components/forms/FormEmbed.tsx` references the old paths, update:

**Before:**
```typescript
const renderUrl = `/api/forms/${slug}/render`
const submitUrl = `/api/forms/${slug}/submit`
```

**After:**
```typescript
const renderUrl = `/api/forms/public/${slug}/render`
const submitUrl = `/api/forms/public/${slug}/submit`
```

### **2. Update Any Frontend Code**
Search for references to:
- `/api/forms/[slug]/render`
- `/api/forms/[slug]/submit`

And update to:
- `/api/forms/public/[slug]/render`
- `/api/forms/public/[slug]/submit`

---

## 🚀 **DEPLOYMENT**

1. **Commit and Push:**
   ```bash
   git add app/api/forms/public
   git commit -m "fix: Resolve Next.js route conflict by moving slug routes to public path"
   git push origin main
   ```

2. **Vercel will auto-deploy**

3. **Update Frontend** (if needed):
   - Update FormEmbed component
   - Update any other components using form routes

---

## ✅ **EXPECTED RESULT**

- ✅ No more route conflict errors
- ✅ Forms work correctly
- ✅ Public routes accessible at new paths
- ✅ Admin routes unchanged

---

**Status:** ✅ **Fix Applied - Ready to Push**
