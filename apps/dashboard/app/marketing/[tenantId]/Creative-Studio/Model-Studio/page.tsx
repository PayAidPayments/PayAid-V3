'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shirt, Upload, ArrowLeft, Download, Loader2, Save } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { EXPORT_PRESETS, exportImageAtSize } from '@/lib/marketing/export-presets'
import { saveToMediaLibrary } from '@/lib/marketing/save-to-media-library'

export default function ModelStudioPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pose, setPose] = useState<string>('auto')
  const [background, setBackground] = useState<string>('studio')
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingToLibrary, setSavingToLibrary] = useState(false)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && f.type.startsWith('image/')) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    }
  }

  const handleGenerate = async () => {
    if (!file || !token) return
    setGenerating(true)
    setError(null)
    setResultUrl(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('pose', pose)
      formData.append('background', background)
      const res = await fetch('/api/marketing/model-studio/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || data.error || 'Generation failed')
        return
      }
      setResultUrl(data.imageUrl ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const downloadImage = () => {
    if (!resultUrl) return
    const a = document.createElement('a')
    a.href = resultUrl
    a.download = 'model-studio-on-model.png'
    a.click()
  }

  const saveToLibrary = async () => {
    if (!resultUrl || !token) return
    setSavingToLibrary(true)
    try {
      await saveToMediaLibrary({
        dataUrl: resultUrl,
        fileName: 'model-studio-on-model.png',
        title: 'Model Studio – on-model',
        source: 'model-studio',
        authToken: token,
      })
    } finally {
      setSavingToLibrary(false)
    }
  }

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
            <Shirt className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Model Studio</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              On-model photos. Zero shoots. Upload a garment and get realistic on-model images with Indian poses and backdrops.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">Upload garment</CardTitle>
            <CardDescription>
              Works for ethnic & western wear. Pose and background can be auto-selected or chosen for Myntra-ready framing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center transition-colors
                ${isDragging ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800/50' : 'border-slate-200 dark:border-slate-700'}
              `}
            >
              {preview ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Garment" className="max-h-48 mx-auto object-contain rounded-lg" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{file?.name}</p>
                  <Button variant="outline" size="sm" onClick={() => { setFile(null); setPreview(null); }}>
                    Change image
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-500 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop or click to upload</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileSelect}
                    className="hidden"
                    id="garment-upload"
                  />
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('garment-upload')?.click()}>
                    Choose file
                  </Button>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                  Pose
                </label>
                <select
                  value={pose}
                  onChange={(e) => setPose(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="standing">Standing</option>
                  <option value="walking">Walking</option>
                  <option value="seated">Seated</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                  Background
                </label>
                <select
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm"
                >
                  <option value="studio">Studio</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="white">White</option>
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
              disabled={!file || generating || !token}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating on-model image…
                </>
              ) : (
                'Generate on-model image'
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
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                Realistic on-model images with Indian poses, lighting and backdrops
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                Ethnic & western wear supported
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                Pose + background auto-selection or manual choice
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                Myntra-ready framing & white-space balance
              </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Uses Google AI Studio (Gemini). Configure your API key in Settings &gt; AI Integrations.
            </p>
          </CardContent>
        </Card>
      </div>

      {resultUrl && (
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">Generated on-model image</CardTitle>
            <CardDescription>
              Download for your listing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="On-model" className="w-full h-auto object-contain" />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Button variant="outline" onClick={downloadImage}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {token && (
                  <Button variant="outline" disabled={savingToLibrary} onClick={saveToLibrary}>
                    {savingToLibrary ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save to library
                  </Button>
                )}
                <select
                  className="text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                  defaultValue=""
                  onChange={(e) => {
                    const id = e.target.value
                    e.target.value = ''
                    if (!id) return
                    const preset = EXPORT_PRESETS.find((p) => p.id === id)
                    if (preset) exportImageAtSize(resultUrl!, preset.width, preset.height, `model-studio-${id}.png`)
                  }}
                >
                  <option value="">Export as (platform size)…</option>
                  {EXPORT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
