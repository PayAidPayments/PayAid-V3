# PayAid Logo Configuration

## Current Status

**Logo Type**: Text Logo (Gradient)
**Website URL**: https://payaid-v3.vercel.app/
**Status**: Temporary - Will be replaced with actual logo image later

---

## Current Implementation

The logo is currently displayed as text with a gradient:
- **Text**: "PayAid"
- **Gradient**: Purple (#53328A) to Gold (#F5C700)
- **Location**: All header components

---

## Logo Configuration File

**File**: `lib/config/brand.ts`

```typescript
logo: {
  imageUrl: null, // Set to logo image URL when available
  useTextLogo: true,
  textLogo: 'PayAid',
  websiteUrl: 'https://payaid-v3.vercel.app/',
}
```

---

## How to Update Logo

### Option 1: Update Brand Config (Recommended)

1. Open `lib/config/brand.ts`
2. Update `logo.imageUrl` with your logo image URL:
   ```typescript
   logo: {
     imageUrl: '/logo.png', // or 'https://your-cdn.com/logo.png'
     // ... rest of config
   }
   ```

3. The Logo component will automatically use the image
4. Text logo will be used as fallback if image fails to load

### Option 2: Direct Image Update

1. Place logo image in `public/logo.png` (or `.svg`, `.jpg`)
2. Update `lib/config/brand.ts`:
   ```typescript
   imageUrl: '/logo.png'
   ```

### Option 3: CDN/External URL

1. Upload logo to your CDN or hosting
2. Update `lib/config/brand.ts`:
   ```typescript
   imageUrl: 'https://payaid-v3.vercel.app/logo.png'
   ```

---

## Logo Component

**File**: `components/brand/Logo.tsx`

A reusable Logo component that:
- Uses image logo if `imageUrl` is set
- Falls back to text logo if image fails or is not set
- Supports dark mode
- Can show version text

**Usage**:
```tsx
import { Logo } from '@/components/brand/Logo'

<Logo href="/home" showText={true} />
```

---

## Logo Locations

The logo appears in:
1. **Home Page Header** (`app/home/components/Header.tsx`)
2. **Main Layout Header** (`components/layout/header.tsx`)
3. **Landing Page** (`app/page.tsx`)
4. **Module Pages** (via header components)

---

## Logo Specifications (When Ready)

### Recommended Formats
- **SVG** (preferred) - Scalable, small file size
- **PNG** - Good quality, transparent background
- **WebP** - Modern format, smaller file size

### Recommended Sizes
- **Height**: 32px (h-8) for headers
- **Aspect Ratio**: Maintain original aspect ratio
- **Retina**: Provide 2x version for high-DPI displays

### File Naming
- `logo.svg` or `logo.png`
- `logo-dark.svg` (for dark mode variant, optional)
- `logo-light.svg` (for light mode variant, optional)

---

## Next Steps

1. ✅ Brand config created
2. ✅ Logo component created
3. ✅ Text logo implemented
4. ⏳ **Wait for actual logo image**
5. ⏳ Update `brandConfig.logo.imageUrl` when logo is ready
6. ⏳ Test logo display in all locations
7. ⏳ Add dark mode variant if needed

---

## Notes

- The website URL (https://payaid-v3.vercel.app/) is stored for reference
- Text logo will continue to work as fallback
- Logo component handles image loading errors gracefully
- All logo references use the centralized brand config

---

**Status**: ✅ **Ready for logo image update**

When you have the logo image ready, simply update `lib/config/brand.ts` and the logo will appear throughout the application.

