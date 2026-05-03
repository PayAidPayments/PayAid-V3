# Logo Generator Implementation Guide

**Date**: April 24, 2026  
**Target**: Implement hybrid vector-first logo generator  
**Base**: manicinc/logomaker + PayAid AI assistance

---

## Step 1: Fork and Audit logomaker

### 1.1 Fork Repository
```bash
# From GitHub UI
# Navigate to: https://github.com/manicinc/logomaker
# Click "Fork" → Select "PayAid Organization"
# Result: https://github.com/payaid/logomaker

# Clone to local
git clone https://github.com/payaid/logomaker.git
cd logomaker
npm install
npm run dev  # Test locally
```

### 1.2 Audit Checklist
- [ ] Review all dependencies (zero external deps = good)
- [ ] Test SVG export with embedded fonts
- [ ] Test PNG export at multiple sizes
- [ ] Verify animation export
- [ ] Audit 400 fonts for licensing
- [ ] Check for security issues
- [ ] Test offline mode
- [ ] Verify browser compatibility

### 1.3 Font License Audit
```bash
# Extract font list
node scripts/list-fonts.js > fonts-audit.csv

# Check each font license
# Priority: Google Fonts (OFL license) are safe for commercial use
# Flag: Any proprietary fonts
# Action: Replace flagged fonts or add licensing info
```

---

## Step 2: Database Schema Migration

### 2.1 Update Prisma Schema

**File**: `packages/db/prisma/schema.prisma`

```prisma
model Logo {
  id           String          @id @default(cuid())
  tenantId     String
  businessName String
  industry     String?
  style        String?
  colors       Json?
  
  // NEW: Logo type
  logoType     LogoType        @default(VECTOR)  // VECTOR | AI_IMAGE
  
  // AI-specific (optional for VECTOR type)
  prompt       String?
  modelUsed    String?
  
  status       String          @default("GENERATING")
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  tenant       Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  variations   LogoVariation[]

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, logoType])
}

enum LogoType {
  VECTOR
  AI_IMAGE
}

model LogoVariation {
  id              String   @id @default(cuid())
  logoId          String
  logo            Logo     @relation(fields: [logoId], references: [id], onDelete: Cascade)
  tenantId        String
  
  // Existing
  imageUrl        String
  thumbnailUrl    String?
  iconStyle       String?
  isSelected      Boolean  @default(false)
  
  // NEW: Vector-specific fields
  svgData         String?  @db.Text  // Full SVG with embedded fonts + CSS
  fontFamily      String?
  fontSize        Int?
  textColor       String?
  gradient        Json?    // { type, colors, angle }
  shadow          Json?    // { x, y, blur, color }
  outline         Json?    // { width, color }
  animation       String?  // 'none' | 'pulse' | 'bounce' | 'glitch' etc.
  background      Json?    // { type, color, pattern }
  layout          Json?    // { align, offset, rotation }
  layoutConfig    Json?    // Full editor state for re-editing
  size            Int?     // 512 | 1024 | 2048 (for PNGs)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([logoId])
  @@index([tenantId])
}
```

### 2.2 Generate Migration

```bash
cd packages/db
npx prisma migrate dev --name add_vector_logo_support
npx prisma generate
```

### 2.3 Data Migration Script

**File**: `scripts/migrate-logos-to-typed.ts`

```typescript
import { prisma } from '../lib/db/prisma'

async function migrateLegacyLogos() {
  // Mark all existing logos as AI_IMAGE type
  const result = await prisma.logo.updateMany({
    where: {
      logoType: null, // or check if field doesn't exist
    },
    data: {
      logoType: 'AI_IMAGE',
    },
  })
  
  console.log(`Migrated ${result.count} logos to AI_IMAGE type`)
}

migrateLegacyLogos()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## Step 3: Integrate logomaker as Library

### 3.1 Extract Core Engine

Create wrapper around logomaker:

**File**: `lib/logo/vector-engine.ts`

```typescript
/**
 * Vector Logo Engine
 * Wrapper around manicinc/logomaker for PayAid integration
 */

export interface LogoConfig {
  text: string
  fontFamily: string
  fontSize: number
  color: string
  gradient?: {
    type: 'linear' | 'radial'
    colors: string[]
    angle?: number
  }
  shadow?: {
    x: number
    y: number
    blur: number
    color: string
  }
  outline?: {
    width: number
    color: string
  }
  animation?: 'none' | 'pulse' | 'bounce' | 'glitch' | 'rotate'
  background?: {
    type: 'color' | 'pattern' | 'transparent'
    value: string
  }
  layout?: {
    align: 'left' | 'center' | 'right'
    offsetX: number
    offsetY: number
    rotation: number
  }
}

export class VectorLogoEngine {
  private canvas: HTMLCanvasElement | null = null
  
  constructor() {
    // Initialize canvas for rendering
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas')
    }
  }
  
  /**
   * Generate SVG with embedded fonts and CSS
   */
  async generateSVG(config: LogoConfig): Promise<string> {
    // Use logomaker's SVG export
    const svg = await this.renderToSVG(config)
    return svg
  }
  
  /**
   * Generate PNG at specified size
   */
  async generatePNG(config: LogoConfig, size: number): Promise<Buffer> {
    if (!this.canvas) {
      throw new Error('Canvas not available (server-side?)')
    }
    
    // Render to canvas
    this.canvas.width = size
    this.canvas.height = size
    const ctx = this.canvas.getContext('2d')!
    
    // Render logo to canvas
    await this.renderToCanvas(ctx, config, size)
    
    // Export as PNG Buffer
    return new Promise((resolve, reject) => {
      this.canvas!.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG'))
          return
        }
        blob.arrayBuffer().then((buffer) => {
          resolve(Buffer.from(buffer))
        })
      }, 'image/png')
    })
  }
  
  /**
   * Get available fonts
   */
  async getAvailableFonts(): Promise<Array<{ family: string; license: string }>> {
    // Load from logomaker's font index
    const fontsIndex = await import('@/vendor/logomaker/fonts/index.json')
    return fontsIndex.fonts
  }
  
  /**
   * Render to SVG (uses logomaker logic)
   */
  private async renderToSVG(config: LogoConfig): Promise<string> {
    // Import logomaker's SVG generator
    const { generateSVG } = await import('@/vendor/logomaker/export')
    return generateSVG({
      text: config.text,
      fontFamily: config.fontFamily,
      fontSize: config.fontSize,
      fill: config.color,
      gradient: config.gradient,
      shadow: config.shadow,
      stroke: config.outline,
      animation: config.animation,
      background: config.background,
      align: config.layout?.align || 'center',
    })
  }
  
  /**
   * Render to Canvas (for PNG export)
   */
  private async renderToCanvas(
    ctx: CanvasRenderingContext2D,
    config: LogoConfig,
    size: number
  ): Promise<void> {
    // Clear canvas
    ctx.clearRect(0, 0, size, size)
    
    // Background
    if (config.background?.type === 'color') {
      ctx.fillStyle = config.background.value
      ctx.fillRect(0, 0, size, size)
    }
    
    // Load font
    await this.loadFont(config.fontFamily)
    
    // Set text properties
    ctx.font = `${config.fontSize}px "${config.fontFamily}"`
    ctx.textAlign = config.layout?.align || 'center'
    ctx.textBaseline = 'middle'
    
    const x = size / 2 + (config.layout?.offsetX || 0)
    const y = size / 2 + (config.layout?.offsetY || 0)
    
    // Shadow
    if (config.shadow) {
      ctx.shadowOffsetX = config.shadow.x
      ctx.shadowOffsetY = config.shadow.y
      ctx.shadowBlur = config.shadow.blur
      ctx.shadowColor = config.shadow.color
    }
    
    // Outline
    if (config.outline) {
      ctx.strokeStyle = config.outline.color
      ctx.lineWidth = config.outline.width
      ctx.strokeText(config.text, x, y)
    }
    
    // Text fill
    if (config.gradient) {
      const gradient = ctx.createLinearGradient(0, 0, size, size)
      config.gradient.colors.forEach((color, i) => {
        gradient.addColorStop(i / (config.gradient!.colors.length - 1), color)
      })
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = config.color
    }
    
    ctx.fillText(config.text, x, y)
  }
  
  /**
   * Load font into browser
   */
  private async loadFont(fontFamily: string): Promise<void> {
    // Use logomaker's font loader
    const { loadFont } = await import('@/vendor/logomaker/fontManager')
    await loadFont(fontFamily)
  }
}
```

### 3.2 Copy logomaker Files

```bash
# Create vendor directory
mkdir -p lib/vendor/logomaker

# Copy core files from forked repo
cp -r ~/logomaker/src/* lib/vendor/logomaker/
cp -r ~/logomaker/fonts lib/vendor/logomaker/fonts
cp ~/logomaker/scripts/build.js lib/vendor/logomaker/build.js

# Update imports to use relative paths
# (May need to refactor logomaker to be more modular)
```

---

## Step 4: Create API Endpoints

### 4.1 Vector Logo Generation API

**File**: `apps/dashboard/app/api/logos/vector/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { VectorLogoEngine } from '@/lib/logo/vector-engine'
import { uploadToStorage } from '@/lib/storage'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const vectorLogoSchema = z.object({
  businessName: z.string().min(1),
  fontFamily: z.string().min(1),
  fontSize: z.number().min(12).max(200),
  color: z.string(),
  gradient: z.object({
    type: z.enum(['linear', 'radial']),
    colors: z.array(z.string()),
    angle: z.number().optional(),
  }).optional(),
  shadow: z.object({
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    color: z.string(),
  }).optional(),
  outline: z.object({
    width: z.number(),
    color: z.string(),
  }).optional(),
  animation: z.enum(['none', 'pulse', 'bounce', 'glitch', 'rotate']).optional(),
  background: z.object({
    type: z.enum(['color', 'pattern', 'transparent']),
    value: z.string(),
  }).optional(),
  layout: z.object({
    align: z.enum(['left', 'center', 'right']),
    offsetX: z.number(),
    offsetY: z.number(),
    rotation: z.number(),
  }).optional(),
  industry: z.string().optional(),
  style: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const validated = vectorLogoSchema.parse(body)
    
    // Initialize vector engine
    const engine = new VectorLogoEngine()
    
    // Generate SVG
    const svgData = await engine.generateSVG({
      text: validated.businessName,
      fontFamily: validated.fontFamily,
      fontSize: validated.fontSize,
      color: validated.color,
      gradient: validated.gradient,
      shadow: validated.shadow,
      outline: validated.outline,
      animation: validated.animation || 'none',
      background: validated.background,
      layout: validated.layout,
    })
    
    // Generate PNG variations
    const png512 = await engine.generatePNG(validated, 512)
    const png1024 = await engine.generatePNG(validated, 1024)
    const png2048 = await engine.generatePNG(validated, 2048)
    
    // Upload to storage
    const [url512, url1024, url2048] = await Promise.all([
      uploadToStorage(png512, `logos/${tenantId}/512.png`),
      uploadToStorage(png1024, `logos/${tenantId}/1024.png`),
      uploadToStorage(png2048, `logos/${tenantId}/2048.png`),
    ])
    
    // Create logo record
    const logo = await prisma.logo.create({
      data: {
        businessName: validated.businessName,
        industry: validated.industry,
        style: validated.style,
        colors: validated.gradient?.colors || [validated.color],
        logoType: 'VECTOR',
        status: 'COMPLETED',
        tenantId,
        variations: {
          create: [
            {
              imageUrl: url512,
              svgData,
              fontFamily: validated.fontFamily,
              fontSize: validated.fontSize,
              textColor: validated.color,
              gradient: validated.gradient || undefined,
              shadow: validated.shadow || undefined,
              outline: validated.outline || undefined,
              animation: validated.animation,
              background: validated.background || undefined,
              layout: validated.layout || undefined,
              layoutConfig: validated, // Full config for re-editing
              size: 512,
              isSelected: true,
              tenantId,
            },
            {
              imageUrl: url1024,
              svgData,
              size: 1024,
              tenantId,
            },
            {
              imageUrl: url2048,
              svgData,
              size: 2048,
              tenantId,
            },
          ],
        },
      },
      include: {
        variations: true,
      },
    })
    
    return NextResponse.json({ logo }, { status: 201 })
  } catch (error) {
    console.error('Vector logo generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate vector logo' },
      { status: 500 }
    )
  }
}
```

### 4.2 Logo Update API (for re-editing)

**File**: `apps/dashboard/app/api/logos/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { VectorLogoEngine } from '@/lib/logo/vector-engine'
import { prisma } from '@/lib/db/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const engine = new VectorLogoEngine()
    
    // Regenerate with new config
    const svgData = await engine.generateSVG(body.config)
    const png = await engine.generatePNG(body.config, body.size || 1024)
    const imageUrl = await uploadToStorage(png, `logos/${tenantId}/updated.png`)
    
    // Update variation
    const variation = await prisma.logoVariation.update({
      where: { id: body.variationId },
      data: {
        svgData,
        imageUrl,
        layoutConfig: body.config,
        updatedAt: new Date(),
      },
    })
    
    return NextResponse.json({ variation })
  } catch (error) {
    console.error('Logo update error:', error)
    return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 })
  }
}
```

### 4.3 Font List API

**File**: `apps/dashboard/app/api/logos/fonts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { VectorLogoEngine } from '@/lib/logo/vector-engine'

export async function GET(request: NextRequest) {
  try {
    const engine = new VectorLogoEngine()
    const fonts = await engine.getAvailableFonts()
    
    return NextResponse.json({ fonts })
  } catch (error) {
    console.error('Font list error:', error)
    return NextResponse.json({ error: 'Failed to load fonts' }, { status: 500 })
  }
}
```

---

## Step 5: Build Frontend Components

### 5.1 Vector Logo Editor Component

**File**: `components/logo/VectorLogoEditor.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ColorPicker } from '@/components/ui/color-picker'
import { LogoCanvas } from './LogoCanvas'
import type { LogoConfig } from '@/lib/logo/vector-engine'

interface VectorLogoEditorProps {
  tenantId: string
  businessName?: string
  brandColors?: string[]
  onSave: (logo: any) => void
}

export function VectorLogoEditor({
  tenantId,
  businessName = '',
  brandColors = [],
  onSave,
}: VectorLogoEditorProps) {
  const [config, setConfig] = useState<LogoConfig>({
    text: businessName,
    fontFamily: 'Inter',
    fontSize: 64,
    color: brandColors[0] || '#000000',
    animation: 'none',
    background: { type: 'transparent', value: '' },
    layout: { align: 'center', offsetX: 0, offsetY: 0, rotation: 0 },
  })
  
  const [fonts, setFonts] = useState<Array<{ family: string; license: string }>>([])
  const [loading, setLoading] = useState(false)
  
  // Load fonts
  useEffect(() => {
    fetch('/api/logos/fonts')
      .then((res) => res.json())
      .then((data) => setFonts(data.fonts))
      .catch(console.error)
  }, [])
  
  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/logos/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: config.text,
          ...config,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to save logo')
      
      const data = await response.json()
      onSave(data.logo)
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save logo')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left: Controls */}
      <div className="w-1/3 space-y-4 overflow-y-auto p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <Input
            value={config.text}
            onChange={(e) => setConfig({ ...config, text: e.target.value })}
            placeholder="Enter business name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Font</label>
          <Select
            value={config.fontFamily}
            onChange={(value) => setConfig({ ...config, fontFamily: value })}
            options={fonts.map((f) => ({ value: f.family, label: f.family }))}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Font Size: {config.fontSize}px
          </label>
          <Slider
            value={[config.fontSize]}
            onValueChange={([value]) => setConfig({ ...config, fontSize: value })}
            min={12}
            max={200}
            step={1}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Color</label>
          <ColorPicker
            value={config.color}
            onChange={(color) => setConfig({ ...config, color })}
            suggestions={brandColors}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Animation</label>
          <Select
            value={config.animation || 'none'}
            onChange={(value) => setConfig({ ...config, animation: value as any })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'pulse', label: 'Pulse' },
              { value: 'bounce', label: 'Bounce' },
              { value: 'glitch', label: 'Glitch' },
              { value: 'rotate', label: 'Rotate' },
            ]}
          />
        </div>
        
        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Logo'}
        </Button>
      </div>
      
      {/* Right: Preview */}
      <div className="w-2/3 flex items-center justify-center bg-gray-100 rounded-lg">
        <LogoCanvas config={config} />
      </div>
    </div>
  )
}
```

### 5.2 Logo Canvas Preview

**File**: `components/logo/LogoCanvas.tsx`

```tsx
'use client'

import { useEffect, useRef } from 'react'
import type { LogoConfig } from '@/lib/logo/vector-engine'

interface LogoCanvasProps {
  config: LogoConfig
}

export function LogoCanvas({ config }: LogoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')!
    const size = 512
    canvas.width = size
    canvas.height = size
    
    // Clear
    ctx.clearRect(0, 0, size, size)
    
    // Background
    if (config.background?.type === 'color') {
      ctx.fillStyle = config.background.value
      ctx.fillRect(0, 0, size, size)
    }
    
    // Text
    ctx.font = `${config.fontSize}px "${config.fontFamily}"`
    ctx.textAlign = config.layout?.align || 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = config.color
    
    const x = size / 2 + (config.layout?.offsetX || 0)
    const y = size / 2 + (config.layout?.offsetY || 0)
    
    ctx.fillText(config.text, x, y)
  }, [config])
  
  return (
    <canvas
      ref={canvasRef}
      className="border border-gray-300 shadow-lg"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  )
}
```

---

## Step 6: Update Logos Page

**File**: `apps/dashboard/app/ai-studio/[tenantId]/Logos/page.tsx`

Replace current implementation with:

```tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { VectorLogoEditor } from '@/components/logo/VectorLogoEditor'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiRequest } from '@/lib/api'

export default function LogosPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [showEditor, setShowEditor] = useState(false)
  
  const { data, refetch } = useQuery({
    queryKey: ['logos', tenantId],
    queryFn: async () => {
      const response = await apiRequest('/api/logos')
      if (!response.ok) throw new Error('Failed to fetch logos')
      return response.json()
    },
  })
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logo Generator</h1>
          <p className="text-gray-600 mt-2">Create professional vector logos</p>
        </div>
        <Button onClick={() => setShowEditor(true)}>Create Logo</Button>
      </div>
      
      {showEditor ? (
        <VectorLogoEditor
          tenantId={tenantId}
          onSave={(logo) => {
            setShowEditor(false)
            refetch()
          }}
        />
      ) : (
        <LogoGallery logos={data?.logos || []} />
      )}
    </div>
  )
}
```

---

## Step 7: Testing Checklist

### 7.1 Unit Tests
- [ ] VectorLogoEngine.generateSVG()
- [ ] VectorLogoEngine.generatePNG()
- [ ] Font loading
- [ ] Color gradients
- [ ] Animations

### 7.2 Integration Tests
- [ ] POST /api/logos/vector
- [ ] PATCH /api/logos/[id]
- [ ] GET /api/logos/fonts
- [ ] Database operations
- [ ] File upload to storage

### 7.3 E2E Tests
- [ ] Create logo flow
- [ ] Export SVG
- [ ] Export PNG (all sizes)
- [ ] Re-edit existing logo
- [ ] Save to Brand Kit
- [ ] Use in Website Builder

---

## Step 8: Deployment

### 8.1 Environment Variables
```bash
# .env
# Storage for logo files
STORAGE_BUCKET=payaid-logos
STORAGE_REGION=us-east-1

# Font CDN (optional)
FONT_CDN_URL=https://cdn.payaid.com/fonts
```

### 8.2 Build & Deploy
```bash
# Build logomaker vendor library
cd lib/vendor/logomaker
npm run build:portable
cd ../../..

# Deploy to Vercel
vercel deploy --prod

# Or push to main branch (auto-deploy)
git add .
git commit -m "feat: Add vector logo generator"
git push origin main
```

---

## Step 9: Migration Plan

### 9.1 Parallel Deployment (Week 1-2)
- Keep existing AI logo generator
- Add "Vector Editor (Beta)" tab
- Default to AI generator

### 9.2 Switch Default (Week 3-4)
- Make Vector Editor the default
- Show "Try AI Inspiration" as secondary option
- Add banner: "New: Editable Vector Logos!"

### 9.3 Full Migration (Week 5-6)
- Vector Editor as primary
- AI generator hidden behind feature flag
- Notify existing users to recreate logos

---

## Next Steps

1. **Fork logomaker**: https://github.com/manicinc/logomaker → PayAid org
2. **Run audit**: Security, fonts, licensing
3. **Start Phase 1**: Database migration
4. **Build API**: `/api/logos/vector`
5. **Build UI**: Vector Editor component
6. **Test thoroughly**: All export formats
7. **Deploy to staging**: Beta testing
8. **Launch to production**: Gradual rollout

---

**Ready to implement?** Start with Step 1 (fork logomaker) and proceed sequentially.
