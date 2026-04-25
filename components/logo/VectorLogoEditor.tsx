'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyAction } from '@/components/ui/copy-action'
import { Sparkles, Download, Save, Type, Heart, RotateCcw, SlidersHorizontal } from 'lucide-react'
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

type ExportPackOptions = {
  includeLogoSvg: boolean
  includeLogoPng: boolean
  includeIconSvg: boolean
  includeIconPng: boolean
  includeCardMockup: boolean
  includeHeaderMockup: boolean
}

type LastExportSummary = {
  timestamp: string
  assets: string[]
}

type ExportPackPresetId = 'full' | 'digital' | 'icon' | 'custom'

const EXPORT_PACK_PRESETS: Record<Exclude<ExportPackPresetId, 'custom'>, ExportPackOptions> = {
  full: {
    includeLogoSvg: true,
    includeLogoPng: true,
    includeIconSvg: true,
    includeIconPng: true,
    includeCardMockup: true,
    includeHeaderMockup: true,
  },
  digital: {
    includeLogoSvg: true,
    includeLogoPng: true,
    includeIconSvg: false,
    includeIconPng: true,
    includeCardMockup: false,
    includeHeaderMockup: true,
  },
  icon: {
    includeLogoSvg: false,
    includeLogoPng: false,
    includeIconSvg: true,
    includeIconPng: true,
    includeCardMockup: false,
    includeHeaderMockup: false,
  },
}

const EXPORT_OPTIONS_STORAGE_KEY = 'payaid.logo.export-options.v1'
const EXPORT_PRESET_STORAGE_KEY = 'payaid.logo.export-preset.v1'
const EXPORT_HISTORY_STORAGE_KEY = 'payaid.logo.export-history.v1'
const QA_DIAGNOSTICS_ID_STORAGE_KEY = 'payaid.logo.qa-diagnostics-id.v1'

type IndustryTemplate = {
  id: string
  label: string
  iconPriority: Array<NonNullable<LogoConfig['iconStyle']>>
  fonts: string[]
  palette: string[]
  keywords: string[]
}

const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'technology',
    label: 'Technology',
    iconPriority: ['hex', 'shield', 'spark', 'diamond', 'circle-monogram'],
    fonts: ['Inter', 'Montserrat', 'Poppins', 'Raleway'],
    palette: ['#0F172A', '#1D4ED8', '#06B6D4', '#111827', '#4F46E5'],
    keywords: ['tech', 'software', 'digital', 'ai'],
  },
  {
    id: 'finance',
    label: 'Finance',
    iconPriority: ['shield', 'hex', 'diamond', 'circle-monogram', 'spark'],
    fonts: ['Merriweather', 'Playfair Display', 'Montserrat', 'Inter'],
    palette: ['#0B3B2E', '#1F2937', '#9A6B16', '#14532D', '#111827'],
    keywords: ['finance', 'bank', 'wealth', 'capital'],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    iconPriority: ['shield', 'spark', 'circle-monogram', 'hex', 'diamond'],
    fonts: ['Nunito', 'Open Sans', 'Inter', 'Poppins'],
    palette: ['#0F766E', '#0EA5E9', '#16A34A', '#1E293B', '#0891B2'],
    keywords: ['health', 'medical', 'clinic', 'care'],
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    iconPriority: ['spark', 'diamond', 'circle-monogram', 'shield', 'hex'],
    fonts: ['Playfair Display', 'Merriweather', 'Lato', 'Poppins'],
    palette: ['#B45309', '#991B1B', '#7C2D12', '#334155', '#BE185D'],
    keywords: ['food', 'restaurant', 'cafe', 'kitchen'],
  },
]

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
  const [conceptPage, setConceptPage] = useState(0)
  const [conceptCount, setConceptCount] = useState(8)
  const [favoriteConceptIds, setFavoriteConceptIds] = useState<string[]>([])
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'canvas' | 'card' | 'header'>('canvas')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [compareConceptIds, setCompareConceptIds] = useState<string[]>([])
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [selectedExportPreset, setSelectedExportPreset] = useState<ExportPackPresetId>('full')
  const [exportOptions, setExportOptions] = useState<ExportPackOptions>(EXPORT_PACK_PRESETS.full)
  const [lastExportSummary, setLastExportSummary] = useState<LastExportSummary | null>(null)
  const [exportHistory, setExportHistory] = useState<LastExportSummary[]>([])
  const [qaDiagnosticsId, setQaDiagnosticsId] = useState('')

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
    const generated = buildConceptPresets(config, industry, keywords, conceptCount, conceptPage)
    setConcepts(generated)
  }, [config.text, config.color, config.iconColor, config.fontFamily, config.fontSize, industry, keywords, conceptCount, conceptPage])

  useEffect(() => {
    try {
      const savedPreset = localStorage.getItem(EXPORT_PRESET_STORAGE_KEY)
      const savedOptions = localStorage.getItem(EXPORT_OPTIONS_STORAGE_KEY)
      if (savedPreset && (savedPreset === 'full' || savedPreset === 'digital' || savedPreset === 'icon' || savedPreset === 'custom')) {
        setSelectedExportPreset(savedPreset)
      }
      if (savedOptions) {
        const parsed = JSON.parse(savedOptions)
        if (isValidExportOptions(parsed)) {
          setExportOptions(parsed)
        }
      }
      const savedHistory = localStorage.getItem(EXPORT_HISTORY_STORAGE_KEY)
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory)
        if (Array.isArray(parsed)) {
          setExportHistory(parsed.filter(isValidLastExportSummary).slice(0, 5))
        }
      }
      const savedDiagnosticsId = localStorage.getItem(QA_DIAGNOSTICS_ID_STORAGE_KEY)
      if (savedDiagnosticsId) {
        setQaDiagnosticsId(savedDiagnosticsId)
      }
    } catch {
      // no-op; fall back to defaults on malformed local storage
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(EXPORT_OPTIONS_STORAGE_KEY, JSON.stringify(exportOptions))
      localStorage.setItem(EXPORT_PRESET_STORAGE_KEY, selectedExportPreset)
    } catch {
      // no-op; storage can fail in restricted browser modes
    }
  }, [exportOptions, selectedExportPreset])

  useEffect(() => {
    try {
      localStorage.setItem(EXPORT_HISTORY_STORAGE_KEY, JSON.stringify(exportHistory.slice(0, 5)))
    } catch {
      // no-op; storage can fail in restricted browser modes
    }
  }, [exportHistory])

  useEffect(() => {
    try {
      if (qaDiagnosticsId.trim()) {
        localStorage.setItem(QA_DIAGNOSTICS_ID_STORAGE_KEY, qaDiagnosticsId.trim())
      } else {
        localStorage.removeItem(QA_DIAGNOSTICS_ID_STORAGE_KEY)
      }
    } catch {
      // no-op; storage can fail in restricted browser modes
    }
  }, [qaDiagnosticsId])

  const applyExportPreset = (preset: Exclude<ExportPackPresetId, 'custom'>) => {
    setSelectedExportPreset(preset)
    setExportOptions(EXPORT_PACK_PRESETS[preset])
  }

  const resetExportPreferences = () => {
    setSelectedExportPreset('full')
    setExportOptions(EXPORT_PACK_PRESETS.full)
    try {
      localStorage.removeItem(EXPORT_OPTIONS_STORAGE_KEY)
      localStorage.removeItem(EXPORT_PRESET_STORAGE_KEY)
    } catch {
      // no-op
    }
  }

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
        const detectedDiagnosticsId = extractDiagnosticsId(data)
        if (detectedDiagnosticsId) {
          setQaDiagnosticsId(detectedDiagnosticsId)
        }
        throw new Error(data.error || 'Failed to save logo')
      }

      const data = await response.json()
      onSave?.(data.logo)
    } catch (err) {
      console.error('Save error:', err)
      const message = err instanceof Error ? err.message : 'Failed to save logo'
      const diagnosticsFromMessage = extractDiagnosticsId(message)
      if (diagnosticsFromMessage) {
        setQaDiagnosticsId(diagnosticsFromMessage)
      }
      setError(message)
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

  const handleExportPack = async () => {
    try {
      const baseName = config.text.replace(/\s+/g, '-').toLowerCase() || 'logo'
      const files: ZipInputFile[] = []
      const selectedAssets: string[] = []

      if (exportOptions.includeLogoSvg) {
        selectedAssets.push('Logo SVG')
        files.push({
          name: `${baseName}-logo.svg`,
          data: textEncoder.encode(previewSvg),
        })
      }

      if (exportOptions.includeLogoPng) {
        selectedAssets.push(`Logo PNG ${pngSize}px`)
        const logoPngBlob = await renderSvgToPngBlob(previewSvg, pngSize, pngSize)
        files.push({
          name: `${baseName}-logo-${pngSize}.png`,
          data: new Uint8Array(await logoPngBlob.arrayBuffer()),
        })
      }

      const iconSvg = createIconOnlySVG(config)
      if (exportOptions.includeIconSvg) {
        selectedAssets.push('Icon SVG')
        files.push({
          name: `${baseName}-icon.svg`,
          data: textEncoder.encode(iconSvg),
        })
      }
      if (exportOptions.includeIconPng) {
        selectedAssets.push('Icon PNG 512px')
        const iconPngBlob = await renderSvgToPngBlob(iconSvg, 512, 512)
        files.push({
          name: `${baseName}-icon-512.png`,
          data: new Uint8Array(await iconPngBlob.arrayBuffer()),
        })
      }

      if (exportOptions.includeCardMockup) {
        selectedAssets.push('Business Card Mockup')
        const cardSvg = createSimpleSVGPreview({ ...config, fontSize: Math.max(28, config.fontSize * 0.5) })
        const cardPngBlob = await renderSvgToPngBlob(cardSvg, 1200, 600)
        files.push({
          name: `${baseName}-mockup-card.png`,
          data: new Uint8Array(await cardPngBlob.arrayBuffer()),
        })
      }

      if (exportOptions.includeHeaderMockup) {
        selectedAssets.push('Website Header Mockup')
        const headerSvg = createSimpleSVGPreview({ ...config, fontSize: Math.max(24, config.fontSize * 0.45) })
        const headerPngBlob = await renderSvgToPngBlob(headerSvg, 1400, 360)
        files.push({
          name: `${baseName}-mockup-header.png`,
          data: new Uint8Array(await headerPngBlob.arrayBuffer()),
        })
      }

      if (files.length === 0) {
        setError('Select at least one asset in Export options')
        return
      }

      const zipBytes = createZip(files)
      const zipBlob = new Blob([zipBytes], { type: 'application/zip' })
      const zipUrl = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = zipUrl
      a.download = `${baseName}-brand-pack.zip`
      a.click()
      URL.revokeObjectURL(zipUrl)
      const summary: LastExportSummary = {
        timestamp: new Date().toISOString(),
        assets: selectedAssets,
      }
      setLastExportSummary(summary)
      setExportHistory((prev) => [summary, ...prev].slice(0, 5))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export pack')
    }
  }

  const handleDownloadQaEvidence = () => {
    if (!lastExportSummary && exportHistory.length === 0) {
      setError('No export history available for QA evidence')
      return
    }

    const fileNameBase = (config.text || 'brand').replace(/\s+/g, '-').toLowerCase()
    const reportBlob = new Blob([buildQaEvidenceBlock()], { type: 'text/plain;charset=utf-8' })
    const reportUrl = URL.createObjectURL(reportBlob)
    const anchor = document.createElement('a')
    anchor.href = reportUrl
    anchor.download = `${fileNameBase}-logo-export-qa-evidence.txt`
    anchor.click()
    URL.revokeObjectURL(reportUrl)
  }

  const buildQaEvidenceBlock = () => {
    const now = new Date().toISOString()
    const entries = (lastExportSummary ? [lastExportSummary, ...exportHistory] : exportHistory).slice(0, 5)
    const buildRef =
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_BUILD_SHA ||
      'N/A'
    const environmentTag =
      process.env.NEXT_PUBLIC_APP_ENV ||
      process.env.NEXT_PUBLIC_ENVIRONMENT ||
      process.env.NODE_ENV ||
      'unknown'
    const runtimeOrigin =
      (typeof window !== 'undefined' ? window.location.origin : '') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'N/A'
    const coreLines = [
      'PayAid Logo Export QA Evidence',
      `Generated At: ${new Date(now).toLocaleString()}`,
      `Build Ref: ${buildRef}`,
      `Environment: ${environmentTag}`,
      `Runtime Origin: ${runtimeOrigin}`,
      `Business Name: ${config.text || 'N/A'}`,
      `Diagnostics ID: ${qaDiagnosticsId.trim() || 'N/A'}`,
      `Export Preset: ${selectedExportPreset}`,
      `Selected Asset Count: ${selectedExportCount}`,
      '',
      'Recent Exports:',
      ...entries.flatMap((entry, index) => [
        `${index + 1}. ${new Date(entry.timestamp).toLocaleString()}`,
        `   Assets: ${entry.assets.join(', ')}`,
      ]),
    ]
    const evidenceHash = computeEvidenceHash(coreLines.join('\n'))
    return [
      ...coreLines,
      '',
      `Evidence Timestamp (UTC): ${now}`,
      `Evidence Hash: ${evidenceHash}`,
      'End of report',
    ].join('\n')
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

  const activeTemplate = getIndustryTemplate(industry, keywords)
  const visibleConcepts = showFavoritesOnly
    ? concepts.filter((c) => favoriteConceptIds.includes(c.id))
    : concepts
  const compareConcepts = concepts.filter((c) => compareConceptIds.includes(c.id)).slice(0, 2)
  const selectedExportCount = Object.values(exportOptions).filter(Boolean).length

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

            {activeTemplate && (
              <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2">
                <p className="text-xs font-semibold text-indigo-900">Template Pack: {activeTemplate.label}</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Concepts are tuned for this industry pack (icons, fonts, and colors).
                </p>
              </div>
            )}

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

            <div className="rounded-md border border-slate-200 p-3">
              <button
                type="button"
                className="w-full flex items-center justify-between text-sm font-medium text-slate-800"
                onClick={() => setShowExportOptions((v) => !v)}
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Export Pack Options
                </span>
                <span className="text-xs text-slate-500">{showExportOptions ? 'Hide' : 'Show'}</span>
              </button>
              {showExportOptions && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => applyExportPreset('full')}>
                      Full Pack
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyExportPreset('digital')}>
                      Digital
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => applyExportPreset('icon')}>
                      Icon Only
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={resetExportPreferences}>
                      Reset
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Selected assets: {selectedExportCount}</p>
                  <p className="text-xs text-slate-500">
                    Active preset: {selectedExportPreset === 'custom' ? 'Custom' : selectedExportPreset === 'full' ? 'Full Pack' : selectedExportPreset === 'digital' ? 'Digital' : 'Icon Only'}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <ToggleRow
                      label="Logo SVG"
                      checked={exportOptions.includeLogoSvg}
                      onChange={(checked) => {
                        setSelectedExportPreset('custom')
                        setExportOptions((prev) => ({ ...prev, includeLogoSvg: checked }))
                      }}
                    />
                    <ToggleRow
                      label={`Logo PNG (${pngSize}px)`}
                      checked={exportOptions.includeLogoPng}
                      onChange={(checked) => {
                        setSelectedExportPreset('custom')
                        setExportOptions((prev) => ({ ...prev, includeLogoPng: checked }))
                      }}
                    />
                    <ToggleRow
                      label="Icon SVG"
                      checked={exportOptions.includeIconSvg}
                      onChange={(checked) => {
                        setSelectedExportPreset('custom')
                        setExportOptions((prev) => ({ ...prev, includeIconSvg: checked }))
                      }}
                    />
                    <ToggleRow
                      label="Icon PNG (512px)"
                      checked={exportOptions.includeIconPng}
                      onChange={(checked) => {
                        setSelectedExportPreset('custom')
                        setExportOptions((prev) => ({ ...prev, includeIconPng: checked }))
                      }}
                    />
                    <ToggleRow
                      label="Business Card Mockup PNG"
                      checked={exportOptions.includeCardMockup}
                      onChange={(checked) => {
                        setSelectedExportPreset('custom')
                        setExportOptions((prev) => ({ ...prev, includeCardMockup: checked }))
                      }}
                    />
                    <ToggleRow
                      label="Website Header Mockup PNG"
                      checked={exportOptions.includeHeaderMockup}
                      onChange={(checked) => {
                        setSelectedExportPreset('custom')
                        setExportOptions((prev) => ({ ...prev, includeHeaderMockup: checked }))
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={handleExportPack} disabled={!previewSvg || selectedExportCount === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Brand Pack (ZIP {selectedExportCount})
            </Button>
            {lastExportSummary && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">Last export: {new Date(lastExportSummary.timestamp).toLocaleString()}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-emerald-900 hover:text-emerald-950"
                    onClick={() => setLastExportSummary(null)}
                  >
                    Clear
                  </Button>
                </div>
                <p className="mt-1 text-emerald-800">{lastExportSummary.assets.join(', ')}</p>
                <div className="mt-2">
                  <CopyAction
                    textToCopy={() =>
                      [
                        `Last export: ${new Date(lastExportSummary.timestamp).toLocaleString()}`,
                        `Assets: ${lastExportSummary.assets.join(', ')}`,
                        `Diagnostics ID: ${qaDiagnosticsId.trim() || 'N/A'}`,
                      ].join('\n')
                    }
                    successMessage="Last export summary copied to clipboard."
                    label="Copy Summary"
                    copiedLabel="Copied"
                    buttonProps={{ variant: 'outline', size: 'sm' }}
                    showFeedback={false}
                  />
                </div>
              </div>
            )}
            {exportHistory.length > 0 && (
              <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">Recent Exports (Last 5)</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      setExportHistory([])
                      try {
                        localStorage.removeItem(EXPORT_HISTORY_STORAGE_KEY)
                      } catch {
                        // no-op
                      }
                    }}
                  >
                    Clear History
                  </Button>
                </div>
                <div className="space-y-2">
                  {exportHistory.map((entry, index) => (
                    <div key={`${entry.timestamp}-${index}`} className="rounded border border-slate-200 px-2 py-1.5">
                      <p className="text-slate-700">{new Date(entry.timestamp).toLocaleString()}</p>
                      <p className="mt-0.5 text-slate-600">{entry.assets.join(', ')}</p>
                      <div className="mt-1.5">
                        <CopyAction
                          textToCopy={() =>
                            [
                              `Last export: ${new Date(entry.timestamp).toLocaleString()}`,
                              `Assets: ${entry.assets.join(', ')}`,
                              `Diagnostics ID: ${qaDiagnosticsId.trim() || 'N/A'}`,
                            ].join('\n')
                          }
                          successMessage="Export history entry copied to clipboard."
                          label="Copy"
                          copiedLabel="Copied"
                          buttonProps={{ variant: 'outline', size: 'sm' }}
                          showFeedback={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="qa-diagnostics-id">QA Diagnostics ID (optional)</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="qa-diagnostics-id"
                  value={qaDiagnosticsId}
                  onChange={(e) => setQaDiagnosticsId(e.target.value)}
                  placeholder="e.g., logo_1714023741_ab12cd"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQaDiagnosticsId('')}
                  disabled={!qaDiagnosticsId.trim()}
                >
                  Clear
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadQaEvidence}
              disabled={!lastExportSummary && exportHistory.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export QA Evidence (.txt)
            </Button>
            <CopyAction
              textToCopy={buildQaEvidenceBlock}
              successMessage="Full QA evidence block copied to clipboard."
              label="Copy Full QA Block"
              copiedLabel="Copied"
              buttonProps={{ variant: 'outline' }}
              showFeedback={false}
            />
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-900">Generated Concepts</p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!selectedConceptId}
                      onClick={() => {
                        const selected = concepts.find((c) => c.id === selectedConceptId)
                        if (selected) {
                          setConfig((prev) => ({ ...prev, ...selected.config }))
                        }
                        setConceptCount(24)
                        setConceptPage((p) => p + 1)
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Regenerate Similar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConceptCount(24)
                        setConceptPage((p) => p + 1)
                      }}
                    >
                      Generate 24 more
                    </Button>
                  </div>
                </div>
                {favoriteConceptIds.length > 0 && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 mb-2 text-xs text-rose-800">
                    Favorites: {favoriteConceptIds.length} shortlisted concept{favoriteConceptIds.length === 1 ? '' : 's'}
                  </div>
                )}
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={showFavoritesOnly ? 'default' : 'outline'}
                    onClick={() => setShowFavoritesOnly((v) => !v)}
                  >
                    {showFavoritesOnly ? 'Showing Favorites' : 'Show Favorites Only'}
                  </Button>
                  <span className="text-xs text-slate-500">
                    Compare: select up to 2 concepts
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                  {visibleConcepts.map((concept) => (
                    <button
                      key={concept.id}
                      type="button"
                      onClick={() => {
                        setSelectedConceptId(concept.id)
                        setConfig((prev) => ({ ...prev, ...concept.config }))
                      }}
                      className={`rounded-md border bg-slate-50 hover:bg-slate-100 p-2 text-left transition-colors ${
                        selectedConceptId === concept.id ? 'border-indigo-400 ring-1 ring-indigo-300' : 'border-slate-200'
                      }`}
                    >
                      <div
                        className="h-16 w-full bg-white rounded border border-slate-100 overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: createSimpleSVGPreview({ ...config, ...concept.config, fontSize: 26 }) }}
                      />
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-slate-700">{concept.label}</p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFavoriteConceptIds((prev) =>
                                prev.includes(concept.id)
                                  ? prev.filter((id) => id !== concept.id)
                                  : [...prev, concept.id]
                              )
                            }}
                            className={`rounded p-1 ${favoriteConceptIds.includes(concept.id) ? 'text-rose-600' : 'text-slate-400 hover:text-rose-500'}`}
                            title="Shortlist concept"
                          >
                            <Heart className={`w-3.5 h-3.5 ${favoriteConceptIds.includes(concept.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCompareConceptIds((prev) => {
                                if (prev.includes(concept.id)) return prev.filter((id) => id !== concept.id)
                                if (prev.length >= 2) return [prev[1], concept.id]
                                return [...prev, concept.id]
                              })
                            }}
                            className={`rounded px-1.5 py-0.5 text-[10px] border ${
                              compareConceptIds.includes(concept.id)
                                ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                                : 'border-slate-300 text-slate-500 bg-white'
                            }`}
                            title="Toggle compare"
                          >
                            CMP
                          </button>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {compareConcepts.length === 2 && (
                  <div className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 p-2">
                    <p className="text-xs font-semibold text-indigo-900 mb-2">Concept Compare</p>
                    <div className="grid grid-cols-2 gap-2">
                      {compareConcepts.map((concept) => (
                        <div key={`compare-${concept.id}`} className="rounded border border-indigo-100 bg-white p-2">
                          <div
                            className="h-20 w-full overflow-hidden rounded border border-slate-100"
                            dangerouslySetInnerHTML={{ __html: createSimpleSVGPreview({ ...config, ...concept.config, fontSize: 28 }) }}
                          />
                          <p className="mt-1 text-[11px] text-slate-700">{concept.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="rounded-lg border bg-white p-3">
              <div className="flex gap-2 mb-3">
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'canvas' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('canvas')}
                >
                  Logo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'card' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('card')}
                >
                  Business Card
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === 'header' ? 'default' : 'outline'}
                  onClick={() => setPreviewMode('header')}
                >
                  Website Header
                </Button>
              </div>
            <div className="flex items-center justify-center min-h-[360px]">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-gray-500">Generating preview...</p>
              </div>
            ) : previewSvg ? (
              previewMode === 'canvas' ? (
                <div
                  className="w-full max-w-lg"
                  dangerouslySetInnerHTML={{ __html: previewSvg }}
                />
              ) : previewMode === 'card' ? (
                <div className="w-full max-w-xl rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 shadow-lg">
                  <p className="text-[10px] uppercase tracking-wider text-slate-300 mb-3">Business Card Mockup</p>
                  <div className="bg-white rounded-lg p-4">
                    <div className="w-full h-24" dangerouslySetInnerHTML={{ __html: createSimpleSVGPreview({ ...config, fontSize: Math.max(28, config.fontSize * 0.5) }) }} />
                    <p className="text-xs text-slate-500 mt-2">hello@{config.text.replace(/\s+/g, '').toLowerCase()}.com</p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-10 bg-slate-100 border-b border-slate-200 px-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="h-28 px-4 flex items-center" dangerouslySetInnerHTML={{ __html: createSimpleSVGPreview({ ...config, fontSize: Math.max(24, config.fontSize * 0.45) }) }} />
                </div>
              )
            ) : (
              <div className="text-center text-gray-400">
                <Type className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Enter a business name to see preview</p>
              </div>
            )}
            </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1.5">
      <span className="text-xs text-slate-700">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function isValidExportOptions(value: unknown): value is ExportPackOptions {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.includeLogoSvg === 'boolean' &&
    typeof candidate.includeLogoPng === 'boolean' &&
    typeof candidate.includeIconSvg === 'boolean' &&
    typeof candidate.includeIconPng === 'boolean' &&
    typeof candidate.includeCardMockup === 'boolean' &&
    typeof candidate.includeHeaderMockup === 'boolean'
  )
}

function isValidLastExportSummary(value: unknown): value is LastExportSummary {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.timestamp === 'string' &&
    Array.isArray(candidate.assets) &&
    candidate.assets.every((asset) => typeof asset === 'string')
  )
}

function extractDiagnosticsId(source: unknown): string | null {
  if (!source) return null

  if (typeof source === 'string') {
    const directMatch = source.match(/\b(?:diagnosticsId|diagnostics[_\s-]?id)\b[:=\s]+([a-zA-Z0-9._-]+)/i)
    if (directMatch?.[1]) return directMatch[1]
    const logoPattern = source.match(/\b(logo_[a-zA-Z0-9._-]+)\b/)
    if (logoPattern?.[1]) return logoPattern[1]
    return null
  }

  if (typeof source === 'object') {
    const record = source as Record<string, unknown>
    const candidate = record.diagnosticsId
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim()
    }
    if (typeof record.error === 'string') {
      return extractDiagnosticsId(record.error)
    }
    if (typeof record.message === 'string') {
      return extractDiagnosticsId(record.message)
    }
  }

  return null
}

function computeEvidenceHash(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
  }
  return `qa_${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function buildConceptPresets(
  base: LogoConfig,
  industry: string,
  keywords: string[],
  count = 8,
  page = 0
): ConceptPreset[] {
  const template = getIndustryTemplate(industry, keywords)
  const palette = template?.palette || [base.color, '#4F46E5', '#0F766E', '#B45309', '#BE185D', '#111827']
  const fonts = template?.fonts || [base.fontFamily, 'Montserrat', 'Poppins', 'Merriweather', 'Playfair Display', 'Raleway']
  const iconStyles: Array<NonNullable<LogoConfig['iconStyle']>> =
    template?.iconPriority || ['circle-monogram', 'diamond', 'spark', 'shield', 'hex']
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

  return Array.from({ length: count }).map((_, idx) => {
    const index = idx + page * count
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

function getIndustryTemplate(industry: string, keywords: string[]): IndustryTemplate | undefined {
  const haystack = `${industry} ${keywords.join(' ')}`.toLowerCase()
  if (!haystack.trim()) return undefined
  return INDUSTRY_TEMPLATES.find((tpl) =>
    tpl.keywords.some((k) => haystack.includes(k))
  )
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

type ZipInputFile = {
  name: string
  data: Uint8Array
}

const textEncoder = new TextEncoder()

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0 ^ -1
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

function toDosDateTime(date: Date): { dosDate: number; dosTime: number } {
  const year = Math.max(1980, date.getFullYear())
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = Math.floor(date.getSeconds() / 2)

  const dosTime = (hours << 11) | (minutes << 5) | seconds
  const dosDate = ((year - 1980) << 9) | (month << 5) | day
  return { dosDate, dosTime }
}

function createZip(files: ZipInputFile[]): Uint8Array {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  files.forEach((file) => {
    const fileNameBytes = textEncoder.encode(file.name)
    const data = file.data
    const crc = crc32(data)
    const { dosDate, dosTime } = toDosDateTime(new Date())

    const localHeader = new Uint8Array(30 + fileNameBytes.length)
    const localView = new DataView(localHeader.buffer)
    localView.setUint32(0, 0x04034b50, true)
    localView.setUint16(4, 20, true)
    localView.setUint16(6, 0, true)
    localView.setUint16(8, 0, true)
    localView.setUint16(10, dosTime, true)
    localView.setUint16(12, dosDate, true)
    localView.setUint32(14, crc, true)
    localView.setUint32(18, data.length, true)
    localView.setUint32(22, data.length, true)
    localView.setUint16(26, fileNameBytes.length, true)
    localView.setUint16(28, 0, true)
    localHeader.set(fileNameBytes, 30)
    localParts.push(localHeader, data)

    const centralHeader = new Uint8Array(46 + fileNameBytes.length)
    const centralView = new DataView(centralHeader.buffer)
    centralView.setUint32(0, 0x02014b50, true)
    centralView.setUint16(4, 20, true)
    centralView.setUint16(6, 20, true)
    centralView.setUint16(8, 0, true)
    centralView.setUint16(10, 0, true)
    centralView.setUint16(12, dosTime, true)
    centralView.setUint16(14, dosDate, true)
    centralView.setUint32(16, crc, true)
    centralView.setUint32(20, data.length, true)
    centralView.setUint32(24, data.length, true)
    centralView.setUint16(28, fileNameBytes.length, true)
    centralView.setUint16(30, 0, true)
    centralView.setUint16(32, 0, true)
    centralView.setUint16(34, 0, true)
    centralView.setUint16(36, 0, true)
    centralView.setUint32(38, 0, true)
    centralView.setUint32(42, offset, true)
    centralHeader.set(fileNameBytes, 46)
    centralParts.push(centralHeader)

    offset += localHeader.length + data.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  endView.setUint32(0, 0x06054b50, true)
  endView.setUint16(4, 0, true)
  endView.setUint16(6, 0, true)
  endView.setUint16(8, files.length, true)
  endView.setUint16(10, files.length, true)
  endView.setUint32(12, centralSize, true)
  endView.setUint32(16, offset, true)
  endView.setUint16(20, 0, true)

  const totalLength = localParts.reduce((sum, part) => sum + part.length, 0) + centralSize + end.length
  const out = new Uint8Array(totalLength)
  let ptr = 0
  ;[...localParts, ...centralParts, end].forEach((part) => {
    out.set(part, ptr)
    ptr += part.length
  })
  return out
}

async function renderSvgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Unable to render SVG into PNG'))
    img.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to initialize export canvas')
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!pngBlob) throw new Error('Unable to export PNG')
  URL.revokeObjectURL(svgUrl)
  return pngBlob
}
