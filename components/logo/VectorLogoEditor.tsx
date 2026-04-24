'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Download, Save, Type } from 'lucide-react'
import type { LogoConfig } from '@/lib/logo/vector-engine'

interface VectorLogoEditorProps {
  tenantId: string
  businessName?: string
  brandColors?: string[]
  onSave?: (logo: any) => void
  onCancel?: () => void
}

interface FontInfo {
  family: string
  license: string
  category?: string
}

export function VectorLogoEditor({
  tenantId: _tenantId,
  businessName = '',
  brandColors = [],
  onSave,
  onCancel,
}: VectorLogoEditorProps) {
  // Logo configuration state
  const [config, setConfig] = useState<LogoConfig>({
    text: businessName,
    fontFamily: 'Inter',
    fontSize: 64,
    color: brandColors[0] || '#000000',
    animation: 'none',
    background: { type: 'transparent', value: '' },
    layout: { align: 'center', offsetX: 0, offsetY: 0, rotation: 0 },
  })

  // UI state
  const [fonts, setFonts] = useState<FontInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewSvg, setPreviewSvg] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [saveToBrandKit, setSaveToBrandKit] = useState(true)
  const [setAsBrandLogo, setSetAsBrandLogo] = useState(true)
  const [pngSize, setPngSize] = useState<512 | 1024 | 2048>(1024)

  // Load available fonts
  useEffect(() => {
    fetch('/api/logos/fonts')
      .then((res) => res.json())
      .then((data) => setFonts(data.fonts || []))
      .catch((err) => {
        console.error('Failed to load fonts:', err)
        setError('Failed to load fonts')
      })
  }, [])

  // Generate preview SVG whenever config changes
  useEffect(() => {
    if (config.text) {
      generatePreview()
    }
  }, [config])

  const generatePreview = async () => {
    setLoading(true)
    try {
      // For now, create a simple inline SVG preview
      // In production, this should call the vector engine
      const svg = createSimpleSVGPreview(config)
      setPreviewSvg(svg)
    } catch (err) {
      console.error('Preview generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.text.trim()) {
      setError('Please enter a business name')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/logos/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: config.text,
          fontFamily: config.fontFamily,
          fontSize: config.fontSize,
          color: config.color,
          gradient: config.gradient,
          shadow: config.shadow,
          outline: config.outline,
          animation: config.animation,
          background: config.background,
          layout: config.layout,
          saveToBrandKit,
          setAsBrandLogo,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save logo')
      }

      const data = await response.json()
      onSave?.(data.logo)
    } catch (err) {
      console.error('Save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save logo')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadSVG = () => {
    if (!previewSvg) return
    
    const blob = new Blob([previewSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.text.replace(/\s+/g, '-').toLowerCase()}-logo.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPNG = async () => {
    if (!previewSvg) return
    try {
      const svgBlob = new Blob([previewSvg], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Unable to render SVG preview as PNG'))
        img.src = svgUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = pngSize
      canvas.height = pngSize
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Unable to initialize canvas for PNG export')

      const scale = Math.min(pngSize / img.width, pngSize / img.height)
      const drawWidth = img.width * scale
      const drawHeight = img.height * scale
      const x = (pngSize - drawWidth) / 2
      const y = (pngSize - drawHeight) / 2
      ctx.clearRect(0, 0, pngSize, pngSize)
      ctx.drawImage(img, x, y, drawWidth, drawHeight)

      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!pngBlob) throw new Error('Unable to export PNG')
      const pngUrl = URL.createObjectURL(pngBlob)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `${config.text.replace(/\s+/g, '-').toLowerCase()}-logo-${pngSize}.png`
      a.click()
      URL.revokeObjectURL(svgUrl)
      URL.revokeObjectURL(pngUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PNG')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel: Controls */}
      <div className="lg:col-span-1 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Logo Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Name */}
            <div>
              <Label htmlFor="text">Business Name</Label>
              <Input
                id="text"
                value={config.text}
                onChange={(e) => setConfig({ ...config, text: e.target.value })}
                placeholder="Enter business name"
                className="mt-1"
              />
            </div>

            {/* Font Family */}
            <div>
              <Label htmlFor="font">Font</Label>
              <Select
                value={config.fontFamily}
                onValueChange={(value) => setConfig({ ...config, fontFamily: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fonts.map((font) => (
                    <SelectItem key={font.family} value={font.family}>
                      <span style={{ fontFamily: font.family }}>
                        {font.family}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div>
              <Label>Font Size: {config.fontSize}px</Label>
              <Slider
                value={[config.fontSize]}
                onValueChange={([value]) => setConfig({ ...config, fontSize: value })}
                min={12}
                max={200}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="color"
                  type="color"
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              
              {/* Brand Colors Quick Select */}
              {brandColors.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {brandColors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => setConfig({ ...config, color })}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={`Brand color ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Animation */}
            <div>
              <Label htmlFor="animation">Animation</Label>
              <Select
                value={config.animation || 'none'}
                onValueChange={(value: any) => setConfig({ ...config, animation: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                  <SelectItem value="glitch">Glitch</SelectItem>
                  <SelectItem value="rotate">Rotate</SelectItem>
                  <SelectItem value="shake">Shake</SelectItem>
                  <SelectItem value="glow">Glow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alignment */}
            <div>
              <Label>Text Alignment</Label>
              <div className="flex gap-2 mt-1">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <Button
                    key={align}
                    variant={config.layout?.align === align ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setConfig({
                        ...config,
                        layout: { ...config.layout!, align },
                      })
                    }
                    className="flex-1 capitalize"
                  >
                    {align}
                  </Button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">Save to Brand Kit Library</p>
                <p className="text-xs text-slate-500">Stores this logo as a reusable brand asset</p>
              </div>
              <Switch checked={saveToBrandKit} onCheckedChange={setSaveToBrandKit} />
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">Set as Workspace Logo</p>
                <p className="text-xs text-slate-500">Updates Tenant > Workspace branding logo URL</p>
              </div>
              <Switch checked={setAsBrandLogo} onCheckedChange={setSetAsBrandLogo} />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                disabled={saving || !config.text.trim()}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Logo'}
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadSVG}
              disabled={!previewSvg}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download SVG
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Select value={String(pngSize)} onValueChange={(v) => setPngSize(Number(v) as 512 | 1024 | 2048)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512">PNG 512px</SelectItem>
                  <SelectItem value="1024">PNG 1024px</SelectItem>
                  <SelectItem value="2048">PNG 2048px</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleDownloadPNG} disabled={!previewSvg}>
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Preview */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[500px] bg-gray-50">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-500">Generating preview...</p>
              </div>
            ) : previewSvg ? (
              <div
                className="w-full max-w-lg"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            ) : (
              <div className="text-center text-gray-400">
                <Type className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Enter a business name to see preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Create a simple SVG preview
 * This is a simplified version - in production, use the full vector engine
 */
function createSimpleSVGPreview(config: LogoConfig): string {
  const width = 800
  const height = 400
  const x = config.layout?.align === 'left' ? 50 : config.layout?.align === 'right' ? width - 50 : width / 2
  const textAnchor = config.layout?.align === 'left' ? 'start' : config.layout?.align === 'right' ? 'end' : 'middle'

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${config.background?.type === 'color' ? `<rect width="${width}" height="${height}" fill="${config.background.value}" />` : ''}
      <text 
        x="${x}" 
        y="${height / 2}" 
        font-family="${config.fontFamily}, sans-serif" 
        font-size="${config.fontSize}" 
        fill="${config.color}" 
        text-anchor="${textAnchor}" 
        dominant-baseline="middle"
      >
        ${config.text}
      </text>
    </svg>
  `
}
