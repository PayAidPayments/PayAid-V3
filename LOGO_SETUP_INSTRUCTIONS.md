# Logo Setup Instructions

## Current Setup

The logo is currently configured to use the Google Drive direct download link. This works but for better performance and reliability, it's recommended to download and host the logo locally.

## Option 1: Use Google Drive Link (Current - Temporary)

The logo is currently using:
```
https://drive.google.com/uc?export=download&id=1p-4X0QTBMVoNK62sKL-BlCqU_Zv72h_x
```

This works but may have:
- Slower loading times
- Potential CORS issues
- Dependency on Google Drive availability

## Option 2: Download and Use Local File (Recommended)

### Steps:

1. **Download the logo from Google Drive:**
   - Go to: https://drive.google.com/file/d/1p-4X0QTBMVoNK62sKL-BlCqU_Zv72h_x/view?usp=sharing
   - Click "Download" or use the download button
   - Save the file (note the file extension: .png, .svg, .jpg, etc.)

2. **Place the logo in the public folder:**
   - Copy the downloaded logo file
   - Paste it into: `public/logo.png` (or `.svg`, `.jpg` depending on the file type)
   - If it's an SVG, name it `logo.svg`
   - If it's a PNG, name it `logo.png`

3. **Update the brand config:**
   - Open `lib/config/brand.ts`
   - Change the `imageUrl` from the Google Drive link to:
     ```typescript
     imageUrl: '/logo.png', // or '/logo.svg' depending on file type
     ```

4. **Restart your development server** if running

## Option 3: Upload to CDN (Best for Production)

1. Upload the logo to your CDN or hosting service
2. Update `lib/config/brand.ts`:
   ```typescript
   imageUrl: 'https://your-cdn.com/logo.png',
   ```

## Logo File Format Recommendations

- **SVG** (Best): Scalable, small file size, perfect quality at any size
- **PNG**: Good quality, transparent background support
- **WebP**: Modern format, smaller file size than PNG

## Current Logo Locations

The logo automatically appears in:
- ✅ Landing Page (`app/page.tsx`)
- ✅ Home Page Header (`app/home/components/Header.tsx`)
- ✅ Login Page (`app/login/page.tsx`)
- ✅ Signup Page (`app/signup/page.tsx`)
- ✅ Dashboard Layout Header (`components/layout/header.tsx`)

All locations use the centralized `Logo` component, so updating the config file updates all instances automatically.

