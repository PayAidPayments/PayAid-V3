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

type ConceptPreset = {
  id: string
  label: string
  config: Partial<LogoConfig>
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
    iconStyle: 'circle-monogram',
    iconColor: brandColors[0] || '#000000',
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
  const [concepts, setConcepts] = useState<ConceptPreset[]>([])
  const [industry, setIndustry] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])

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

  useEffect(() => {
    if (!config.text.trim()) {
      setConcepts([])
      return
    }
    const generated = buildConceptPresets(config, industry, keywords)
    setConcepts(generated)
  }, [config.text, config.color, config.iconColor, config.fontFamily, config.fontSize, industry, keywords])

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
          industry: industry || undefined,
          style: keywords.length ? keywords.join(', ') : undefined,
          fontFamily: config.fontFamily,
          fontSize: config.fontSize,
          color: config.color,
          iconStyle: config.iconStyle,
          iconColor: config.iconColor,
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

  const handleDownloadIconPNG = async () => {
    try {
      const iconSvg = createIconOnlySVG(config)
      const svgBlob = new Blob([iconSvg], { type: 'image/svg+xml;charset=utf-8' })
      const svgUrl = URL.createObjectURL(svgBlob)
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Unable to render icon as PNG'))
        img.src = svgUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Unable to initialize canvas for icon export')
      ctx.clearRect(0, 0, 512, 512)
      ctx.drawImage(img, 0, 0, 512, 512)
      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!pngBlob) throw new Error('Unable to export icon PNG')
      const pngUrl = URL.createObjectURL(pngBlob)
      const a = document.createElement('a')
      a.href = pngUrl
      a.download = `${config.text.replace(/\s+/g, '-').toLowerCase()}-icon-512.png`
      a.click()
      URL.revokeObjectURL(svgUrl)
      URL.revokeObjectURL(pngUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download icon PNG')
    }
  }

  const addKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase()
    if (!trimmed) return
    if (keywords.includes(trimmed)) {
      setKeywordInput('')
      return
    }
    setKeywords((prev) => [...prev, trimmed])
    setKeywordInput('')
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

            <div>
              <Label htmlFor="industry">Industry (optional)</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., technology, healthcare, restaurant"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="keywords">Keywords</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="keywords"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addKeyword()
                    }
                  }}
                  placeholder="e.g., minimal, shield, modern"
                />
                <Button type="button" variant="outline" onClick={addKeyword}>
                  Add
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {keywords.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setKeywords((prev) => prev.filter((k) => k !== kw))}
                      className="text-xs rounded-full border border-slate-300 px-2 py-1 bg-slate-50 hover:bg-slate-100"
                      title="Click to remove"
                    >
                      {kw} x
                    </button>
                  ))}
                </div>
              )}
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

            <div>
              <Label htmlFor="icon-style">Icon</Label>
              <Select
                value={config.iconStyle || 'circle-monogram'}
                onValueChange={(value: any) => setConfig({ ...config, iconStyle: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="circle-monogram">Circle Monogram</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="spark">Spark</SelectItem>
                  <SelectItem value="shield">Shield</SelectItem>
                  <SelectItem value="hex">Hex</SelectItem>
                  <SelectItem value="none">None (Text Only)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  value={config.iconColor || config.color}
                  onChange={(e) => setConfig({ ...config, iconColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={config.iconColor || config.color}
                  onChange={(e) => setConfig({ ...config, iconColor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
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
                <p className="text-xs text-slate-500">Updates Tenant &gt; Workspace branding logo URL</p>
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
            <Button variant="outline" onClick={handleDownloadIconPNG} disabled={!config.text.trim()}>
              <Download className="w-4 h-4 mr-2" />
              Download Icon (Favicon PNG)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Preview */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 min-h-[500px] bg-gray-50">
            {concepts.length > 0 && (
              <div className="rounded-lg border bg-white p-3">
                <p className="text-sm font-semibold text-slate-900 mb-2">Generated Concepts</p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                  {concepts.map((concept) => (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, ...concept.config }))}
                      className="rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 p-2 text-left transition-colors"
                    >
                      <div
                        className="h-16 w-full bg-white rounded border border-slate-100 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: createSimpleSVGPreview({ ...config, ...concept.config, fontSize: 26 }) }}
                      />
                      <p className="mt-1 text-xs font-medium text-slate-700">{concept.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-center min-h-[360px]">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function buildConceptPresets(base: LogoConfig, industry: string, keywords: string[]): ConceptPreset[] {
  const palette = [base.color, '#4F46E5', '#0F766E', '#B45309', '#BE185D', '#111827']
  const fonts = [base.fontFamily, 'Montserrat', 'Poppins', 'Merriweather', 'Playfair Display', 'Raleway']
  const iconStyles: Array<NonNullable<LogoConfig['iconStyle']>> = ['circle-monogram', 'diamond', 'spark', 'shield', 'hex']
  const keywordSet = new Set(keywords.map((k) => k.toLowerCase()))

  const keywordDrivenIcon =
    keywordSet.has('shield') || keywordSet.has('security')
      ? 'shield'
      : keywordSet.has('hex') || keywordSet.has('blockchain')
      ? 'hex'
      : keywordSet.has('spark') || keywordSet.has('creative')
      ? 'spark'
      : keywordSet.has('diamond') || keywordSet.has('luxury')
      ? 'diamond'
      : undefined

  return Array.from({ length: 8 }).map((_, index) => {
    const color = palette[index % palette.length]
    const iconColor = palette[(index + 1) % palette.length]
    const font = fonts[index % fonts.length]
    const iconStyle = (keywordDrivenIcon || iconStyles[index % iconStyles.length]) as NonNullable<LogoConfig['iconStyle']>
    const align: 'left' | 'center' | 'right' = index % 3 === 0 ? 'left' : index % 3 === 1 ? 'center' : 'right'
    const tone = industry ? `${industry.slice(0, 12)} ` : ''
    return {
      id: `concept-${index + 1}`,
      label: `${tone}Concept ${index + 1}`,
      config: {
        color,
        iconColor,
        fontFamily: font,
        iconStyle,
        layout: { ...(base.layout || { offsetX: 0, offsetY: 0, rotation: 0, align: 'center' }), align },
      },
    }
  })
}

/**
 * Create a simple SVG preview
 * This is a simplified version - in production, use the full vector engine
 */
function createSimpleSVGPreview(config: LogoConfig): string {
  const width = 800
  const height = 400
  const padding = 40
  const hasIcon = (config.iconStyle || 'circle-monogram') !== 'none'
  const iconSize = Math.max(44, Math.min(84, Math.round(config.fontSize * 0.95)))
  const iconGap = hasIcon ? 18 : 0
  const estimatedTextWidth = Math.max(120, Math.round((config.text?.length || 1) * config.fontSize * 0.58))
  const groupWidth = estimatedTextWidth + (hasIcon ? iconSize + iconGap : 0)
  const align = config.layout?.align || 'center'
  const groupLeft =
    align === 'left'
      ? padding
      : align === 'right'
      ? Math.max(padding, width - padding - groupWidth)
      : Math.max(padding, Math.round((width - groupWidth) / 2))

  const iconCx = groupLeft + iconSize / 2
  const textX = groupLeft + (hasIcon ? iconSize + iconGap : 0)
  const safeText = (config.text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const encodedFont = encodeURIComponent(config.fontFamily)
  const iconColor = config.iconColor || config.color
  const monogram = safeText.trim().charAt(0).toUpperCase() || '?'

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=${encodedFont}:wght@400;500;600;700&display=swap');
      </style>
      ${config.background?.type === 'color' ? `<rect width="${width}" height="${height}" fill="${config.background.value}" />` : ''}
      ${
        hasIcon
          ? config.iconStyle === 'diamond'
            ? `<g transform="translate(${iconCx}, ${height / 2})">
                 <polygon points="0,${-iconSize / 2} ${iconSize / 2},0 0,${iconSize / 2} ${-iconSize / 2},0" fill="${iconColor}" opacity="0.15" />
                 <polygon points="0,${-iconSize / 2 + 6} ${iconSize / 2 - 6},0 0,${iconSize / 2 - 6} ${-iconSize / 2 + 6},0" fill="none" stroke="${iconColor}" stroke-width="3" />
               </g>`
            : config.iconStyle === 'shield'
            ? `<g transform="translate(${iconCx}, ${height / 2})">
                 <path d="M0,${-iconSize / 2} L${iconSize * 0.42},${-iconSize * 0.14} L${iconSize * 0.32},${iconSize * 0.3} L0,${iconSize / 2} L${-iconSize * 0.32},${iconSize * 0.3} L${-iconSize * 0.42},${-iconSize * 0.14} Z" fill="${iconColor}" opacity="0.15" />
                 <path d="M0,${-iconSize / 2 + 5} L${iconSize * 0.33},${-iconSize * 0.1} L${iconSize * 0.25},${iconSize * 0.24} L0,${iconSize / 2 - 6} L${-iconSize * 0.25},${iconSize * 0.24} L${-iconSize * 0.33},${-iconSize * 0.1} Z" fill="none" stroke="${iconColor}" stroke-width="3" />
               </g>`
            : config.iconStyle === 'hex'
            ? `<g transform="translate(${iconCx}, ${height / 2})">
                 <polygon points="${-iconSize * 0.44},${-iconSize * 0.25} 0,${-iconSize * 0.5} ${iconSize * 0.44},${-iconSize * 0.25} ${iconSize * 0.44},${iconSize * 0.25} 0,${iconSize * 0.5} ${-iconSize * 0.44},${iconSize * 0.25}" fill="${iconColor}" opacity="0.15" />
                 <polygon points="${-iconSize * 0.36},${-iconSize * 0.21} 0,${-iconSize * 0.42} ${iconSize * 0.36},${-iconSize * 0.21} ${iconSize * 0.36},${iconSize * 0.21} 0,${iconSize * 0.42} ${-iconSize * 0.36},${iconSize * 0.21}" fill="none" stroke="${iconColor}" stroke-width="3" />
               </g>`
            : config.iconStyle === 'spark'
            ? `<g transform="translate(${iconCx}, ${height / 2})">
                 <path d="M0 -26 L6 -6 L26 0 L6 6 L0 26 L-6 6 L-26 0 L-6 -6 Z" fill="${iconColor}" opacity="0.16" />
                 <path d="M0 -20 L5 -5 L20 0 L5 5 L0 20 L-5 5 L-20 0 L-5 -5 Z" fill="none" stroke="${iconColor}" stroke-width="3" />
               </g>`
            : `<g transform="translate(${iconCx}, ${height / 2})">
                 <circle cx="0" cy="0" r="${iconSize / 2}" fill="${iconColor}" opacity="0.15" />
                 <circle cx="0" cy="0" r="${iconSize / 2 - 3}" fill="none" stroke="${iconColor}" stroke-width="3" />
                 <text x="0" y="1" text-anchor="middle" dominant-baseline="middle" fill="${iconColor}" style="font-family: '${config.fontFamily}', sans-serif; font-size: ${Math.round(iconSize * 0.42)}px; font-weight:700;">${monogram}</text>
               </g>`
          : ''
      }
      <text
        x="${textX}" 
        y="${height / 2}" 
        font-family="${config.fontFamily}, sans-serif" 
        font-size="${config.fontSize}" 
        fill="${config.color}" 
        text-anchor="start"
        dominant-baseline="middle"
      >
        ${safeText}
      </text>
    </svg>
  `
}

function createIconOnlySVG(config: LogoConfig): string {
  const width = 512
  const height = 512
  const iconStyle = config.iconStyle || 'circle-monogram'
  const iconColor = config.iconColor || config.color
  const monogram = ((config.text || '?').trim().charAt(0).toUpperCase() || '?')

  const iconMarkup =
    iconStyle === 'diamond'
      ? `<polygon points="256,88 424,256 256,424 88,256" fill="${iconColor}" opacity="0.14" />
         <polygon points="256,118 394,256 256,394 118,256" fill="none" stroke="${iconColor}" stroke-width="20" />`
      : iconStyle === 'shield'
      ? `<path d="M256,92 L384,192 L352,330 L256,420 L160,330 L128,192 Z" fill="${iconColor}" opacity="0.14" />
         <path d="M256,122 L356,198 L330,316 L256,390 L182,316 L156,198 Z" fill="none" stroke="${iconColor}" stroke-width="20" />`
      : iconStyle === 'hex'
      ? `<polygon points="128,180 256,106 384,180 384,332 256,406 128,332" fill="${iconColor}" opacity="0.14" />
         <polygon points="154,194 256,136 358,194 358,318 256,376 154,318" fill="none" stroke="${iconColor}" stroke-width="20" />`
      : iconStyle === 'spark'
      ? `<path d="M256 78 L292 210 L434 256 L292 302 L256 434 L220 302 L78 256 L220 210 Z" fill="${iconColor}" opacity="0.14" />
         <path d="M256 120 L284 224 L392 256 L284 288 L256 392 L228 288 L120 256 L228 224 Z" fill="none" stroke="${iconColor}" stroke-width="20" />`
      : `<circle cx="256" cy="256" r="170" fill="${iconColor}" opacity="0.14" />
         <circle cx="256" cy="256" r="146" fill="none" stroke="${iconColor}" stroke-width="20" />
         <text x="256" y="266" text-anchor="middle" dominant-baseline="middle" fill="${iconColor}" style="font-family: '${config.fontFamily}', sans-serif; font-size: 176px; font-weight: 700;">${monogram}</text>`

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="white" />
      ${iconMarkup}
    </svg>
  `
}
