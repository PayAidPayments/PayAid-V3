'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Upload, ImageIcon, ArrowLeft, Download, Loader2, Layers, Save } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { getTemplatesByCategory } from '@/lib/marketing/product-studio-templates'
import { EXPORT_PRESETS, exportImageAtSize } from '@/lib/marketing/export-presets'
import { getStoredBrand } from '@/lib/marketing/brand-kit'
import { saveToMediaLibrary } from '@/lib/marketing/save-to-media-library'

type ImageSet = {
  main: string | null
  lifestyle: string | null
  infographic: string | null
  marketplace: string
}

type BatchResultItem = { fileName: string; set: ImageSet }

export default function ProductStudioPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [batchFiles, setBatchFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [marketplace, setMarketplace] = useState<string>('amazon')
  const [templateId, setTemplateId] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const [batchResults, setBatchResults] = useState<BatchResultItem[]>([])
  const [result, setResult] = useState<ImageSet | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (mode === 'batch') {
      const files = Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) setBatchFiles((prev) => [...prev, ...files])
    } else {
      const f = e.dataTransfer.files?.[0]
      if (f && f.type.startsWith('image/')) {
        setFile(f)
        setPreview(URL.createObjectURL(f))
      }
    }
  }, [mode])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'batch') {
      const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'))
      if (files.length) setBatchFiles((prev) => [...prev, ...files])
      e.target.value = ''
    } else {
      const f = e.target.files?.[0]
      if (f && f.type.startsWith('image/')) {
        setFile(f)
        setPreview(URL.createObjectURL(f))
      }
    }
  }

  const handleGenerate = async () => {
    if (!token) return
    if (mode === 'single') {
      if (!file) return
      setGenerating(true)
      setError(null)
      setResult(null)
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('marketplace', marketplace)
        if (templateId) formData.append('templateId', templateId)
        const brand = getStoredBrand()
        if (brand?.primaryColor) formData.append('brandColor', brand.primaryColor)
        if (brand?.tagline) formData.append('brandTagline', brand.tagline)
        const res = await fetch('/api/marketing/product-studio/generate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.message || data.error || 'Generation failed')
          return
        }
        setResult({
          main: data.main ?? null,
          lifestyle: data.lifestyle ?? null,
          infographic: data.infographic ?? null,
          marketplace: data.marketplace || marketplace,
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setGenerating(false)
      }
      return
    }
    // Batch mode
    if (batchFiles.length === 0) return
    setError(null)
    setBatchResults([])
    setBatchProgress({ current: 0, total: batchFiles.length })
    setGenerating(true)
    const brand = getStoredBrand()
    const results: BatchResultItem[] = []
    for (let i = 0; i < batchFiles.length; i++) {
      setBatchProgress({ current: i + 1, total: batchFiles.length })
      try {
        const formData = new FormData()
        formData.append('file', batchFiles[i])
        formData.append('marketplace', marketplace)
        if (templateId) formData.append('templateId', templateId)
        if (brand?.primaryColor) formData.append('brandColor', brand.primaryColor)
        if (brand?.tagline) formData.append('brandTagline', brand.tagline)
        const res = await fetch('/api/marketing/product-studio/generate', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        const data = await res.json()
        if (res.ok) {
          results.push({
            fileName: batchFiles[i].name,
            set: {
              main: data.main ?? null,
              lifestyle: data.lifestyle ?? null,
              infographic: data.infographic ?? null,
              marketplace: data.marketplace || marketplace,
            },
          })
        }
      } catch {
        // skip failed item
      }
      setBatchResults([...results])
    }
    setBatchProgress(null)
    setGenerating(false)
  }

  const saveImageToLibrary = async (dataUrl: string, label: string, baseName: string) => {
    if (!token) return
    const id = `${baseName}-${label}`
    setSavingId(id)
    try {
      await saveToMediaLibrary({
        dataUrl,
        fileName: `${baseName}-${label}.png`,
        title: `Product Studio – ${label}`,
        source: 'product-studio',
        authToken: token,
      })
    } catch {
      // could set a toast
    } finally {
      setSavingId(null)
    }
  }

  const downloadDataUrl = (dataUrl: string, name: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = name
    a.click()
  }

  const marketplaceOptions = [
    { value: 'amazon', label: 'Amazon' },
    { value: 'flipkart', label: 'Flipkart' },
    { value: 'myntra', label: 'Myntra' },
    { value: 'shopify', label: 'Shopify' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/marketing/${tenantId}/Creative-Studio`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800">
            <Package className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Product Studio</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Amazon-ready images in minutes. Upload a product photo and get main, lifestyle and infographic images.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">Upload product photo</CardTitle>
            <CardDescription>
              Upload any product image. We&apos;ll generate a full set — main, lifestyle and infographic — following marketplace guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={mode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('single'); setBatchFiles([]); setBatchResults([]); }}
              >
                Single
              </Button>
              <Button
                variant={mode === 'batch' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('batch'); setFile(null); setPreview(null); setResult(null); }}
              >
                <Layers className="h-4 w-4 mr-1" /> Batch
              </Button>
            </div>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${isDragging ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800/50' : 'border-slate-200 dark:border-slate-700'}
              `}
            >
              {mode === 'single' && preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Product" className="max-h-48 mx-auto object-contain rounded-lg" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{file?.name}</p>
                  <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); }}>
                    Change image
                  </Button>
                </div>
              ) : mode === 'batch' && batchFiles.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{batchFiles.length} product image(s)</p>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 max-h-32 overflow-y-auto text-left max-w-xs mx-auto">
                    {batchFiles.map((f, i) => (
                      <li key={i} className="truncate">{f.name}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('product-upload')?.click()}>
                      Add more
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setBatchFiles([])}>Clear all</Button>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {mode === 'batch' ? 'Drag and drop multiple images or click to add' : 'Drag and drop or click to upload'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple={mode === 'batch'}
                    onChange={onFileSelect}
                    className="hidden"
                    id="product-upload"
                  />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('product-upload')?.click()}>
                    {mode === 'batch' ? 'Choose files' : 'Choose file'}
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                  Marketplace
                </label>
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm"
                >
                  {marketplaceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                  Category template (50+)
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm"
                >
                  <option value="">Auto (no template)</option>
                  {Object.entries(getTemplatesByCategory()).map(([category, templates]) => (
                    <optgroup key={category} label={category}>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <Button
              className="w-full"
              disabled={(mode === 'single' ? !file : batchFiles.length === 0) || generating || !token}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {batchProgress ? `Product ${batchProgress.current} of ${batchProgress.total}…` : 'Generating image set…'}
                </>
              ) : mode === 'batch' ? (
                `Generate ${batchFiles.length} image set${batchFiles.length !== 1 ? 's' : ''}`
              ) : (
                'Generate image set'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">What you get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                50+ templates across categories
              </li>
              <li className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                Auto white-background, margins & 3000×3000 export
              </li>
              <li className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                Scale & size annotations where needed
              </li>
              <li className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-slate-500 flex-shrink-0" />
                Main, lifestyle and infographic variants
              </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Uses Google AI Studio (Gemini). Configure your API key in Settings &gt; AI Integrations.
            </p>
          </CardContent>
        </Card>
      </div>

      {result && (result.main || result.lifestyle || result.infographic) && (
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">Generated image set</CardTitle>
            <CardDescription>
              Download each image for your {marketplace} listing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.main && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Main</p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img src={result.main} alt="Main" className="w-full h-48 object-contain" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => downloadDataUrl(result.main!, 'product-main.png')}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                    {token && (
                      <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(result.main!, 'main', 'product-main')}>
                        {savingId === 'product-main-main' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    )}
                    <select
                      className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5"
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value
                        e.target.value = ''
                        if (!id) return
                        const preset = EXPORT_PRESETS.find((p) => p.id === id)
                        if (preset) exportImageAtSize(result.main!, preset.width, preset.height, `product-main-${id}.png`)
                      }}
                    >
                      <option value="">Export as…</option>
                      {EXPORT_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {result.lifestyle && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Lifestyle</p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img src={result.lifestyle} alt="Lifestyle" className="w-full h-48 object-contain" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => downloadDataUrl(result.lifestyle!, 'product-lifestyle.png')}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                    {token && (
                      <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(result.lifestyle!, 'lifestyle', 'product-lifestyle')}>
                        {savingId === 'product-lifestyle-lifestyle' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    )}
                    <select
                      className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5"
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value
                        e.target.value = ''
                        if (!id) return
                        const preset = EXPORT_PRESETS.find((p) => p.id === id)
                        if (preset) exportImageAtSize(result.lifestyle!, preset.width, preset.height, `product-lifestyle-${id}.png`)
                      }}
                    >
                      <option value="">Export as…</option>
                      {EXPORT_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {result.infographic && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Infographic</p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <img src={result.infographic} alt="Infographic" className="w-full h-48 object-contain" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="flex-1 min-w-0" onClick={() => downloadDataUrl(result.infographic!, 'product-infographic.png')}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                    {token && (
                      <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(result.infographic!, 'infographic', 'product-infographic')}>
                        {savingId === 'product-infographic-infographic' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    )}
                    <select
                      className="text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5"
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value
                        e.target.value = ''
                        if (!id) return
                        const preset = EXPORT_PRESETS.find((p) => p.id === id)
                        if (preset) exportImageAtSize(result.infographic!, preset.width, preset.height, `product-infographic-${id}.png`)
                      }}
                    >
                      <option value="">Export as…</option>
                      {EXPORT_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {mode === 'batch' && batchResults.length > 0 && (
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">Batch results</CardTitle>
            <CardDescription>
              {batchResults.length} product set{batchResults.length !== 1 ? 's' : ''} generated. Download or save each image.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {batchResults.map((item, idx) => (
              <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.fileName}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {item.set.main && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Main</p>
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <img src={item.set.main} alt="Main" className="w-full h-40 object-contain" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadDataUrl(item.set.main!, `batch-${idx}-main.png`)}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                        {token && (
                          <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(item.set.main!, 'main', `batch-${idx}-main`)}>
                            {savingId?.startsWith(`batch-${idx}-main`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {item.set.lifestyle && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Lifestyle</p>
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <img src={item.set.lifestyle} alt="Lifestyle" className="w-full h-40 object-contain" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadDataUrl(item.set.lifestyle!, `batch-${idx}-lifestyle.png`)}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                        {token && (
                          <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(item.set.lifestyle!, 'lifestyle', `batch-${idx}-lifestyle`)}>
                            {savingId?.startsWith(`batch-${idx}-lifestyle`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  {item.set.infographic && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Infographic</p>
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <img src={item.set.infographic} alt="Infographic" className="w-full h-40 object-contain" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadDataUrl(item.set.infographic!, `batch-${idx}-infographic.png`)}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                        {token && (
                          <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(item.set.infographic!, 'infographic', `batch-${idx}-infographic`)}>
                            {savingId?.startsWith(`batch-${idx}-infographic`) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
