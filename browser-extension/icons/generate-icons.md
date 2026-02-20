# Extension Icons Generation Guide

## Required Sizes
- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Design Specifications

### Colors
- Primary: #53328a (PayAid Purple)
- Background: White or transparent
- Accent: Lightning bolt or "P" logo in white

### Style
- Rounded square or circle shape
- Simple, recognizable at small sizes
- High contrast for visibility

## Quick Generation Options

### Option 1: Online Tools
1. Use https://www.favicon-generator.org/
2. Upload a 512x512 source image
3. Download all sizes

### Option 2: Image Editor
1. Create 512x512 base icon
2. Export/resize to required sizes
3. Ensure sharp edges at small sizes

### Option 3: SVG to PNG
1. Create SVG icon
2. Convert to PNG at required sizes using:
   - ImageMagick: `convert icon.svg -resize 16x16 icon16.png`
   - Online converters

## Temporary Placeholder
For now, you can use a simple colored square with "P" text until proper icons are designed.
