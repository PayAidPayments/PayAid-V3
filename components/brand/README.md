# PayAid Logo Component

## Using an Actual Logo Image

If you have the actual PayAid-V3 logo as an image file (PNG, SVG, etc.), you can use it instead of the SVG:

1. **Place your logo file** in the `public` folder:
   - Example: `public/logo.png` or `public/logo.svg`

2. **Update the brand config** in `lib/config/brand.ts`:
   ```typescript
   logo: {
     imageUrl: '/logo.png', // or '/logo.svg'
     // ... rest of config
   }
   ```

3. **The Logo component will automatically use the image** instead of the SVG

## Current SVG Logo

The component includes a programmatic SVG logo that matches the design:
- "Pay" in purple (#53328A)
- "Aid" in yellow (#F5C700)  
- Purple hand icon above "A"
- Yellow credit card icon above "id"
- Split dash between "Aid" and "V3"
- "V" in purple, "3" in yellow

## Usage

```tsx
import { Logo } from '@/components/brand/Logo'

// Basic usage
<Logo href="/home" />

// With custom height
<Logo href="/home" height={40} />

// With version text
<Logo href="/home" showText={true} />
```

