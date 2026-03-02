'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageIcon, ArrowLeft, Sparkles, Loader2, Download, Save } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { EXPORT_PRESETS, exportImageAtSize } from '@/lib/marketing/export-presets'
import { getStoredBrand } from '@/lib/marketing/brand-kit'
import { saveToMediaLibrary } from '@/lib/marketing/save-to-media-library'

const PRESETS = [
  { value: 'hook-product', label: 'Hook + product', desc: 'Scroll-stopping hook with product shot' },
  { value: 'price-drop', label: 'Price drop / sale', desc: 'Discount or price badge focus' },
  { value: 'benefit-cta', label: 'Benefit / CTA', desc: 'Benefit-focused with call-to-action' },
  { value: 'custom', label: 'Custom prompt', desc: 'Describe your ad in your own words' },
] as const

const OVERLAY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'minimal', label: 'Minimal text' },
  { value: 'bold-cta', label: 'Bold CTA button' },
  { value: 'price-badge', label: 'Price badge' },
  { value: 'discount-sticker', label: 'Discount sticker' },
  { value: 'trust-badge', label: 'Trust badge' },
  { value: 'countdown', label: 'Countdown / urgency' },
] as const

export default function ImageAdsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [preset, setPreset] = useState<string>('hook-product')
  const [hook, setHook] = useState('')
  const [price, setPrice] = useState('')
  const [overlayStyle, setOverlayStyle] = useState('none')
  const [ctaText, setCtaText] = useState('Shop Now')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generateTwo, setGenerateTwo] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultUrlB, setResultUrlB] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const buildBody = () => ({
    preset,
    hook: hook || undefined,
    price: price || undefined,
    overlayStyle: overlayStyle !== 'none' ? overlayStyle : undefined,
    ctaText: ctaText || undefined,
    customPrompt: preset === 'custom' ? customPrompt : undefined,
    ...((() => {
      const b = getStoredBrand()
      return b ? { brandColor: b.primaryColor, brandTagline: b.tagline } : {}
    })(),
  })

  const handleGenerate = async () => {
    if (!token) return
    if (preset === 'custom' && !customPrompt.trim()) {
      setError('Enter a custom prompt.')
      return
    }
    setGenerating(true)
    setError(null)
    setResultUrl(null)
    setResultUrlB(null)
    try {
      const body = buildBody()
      if (generateTwo) {
        const [resA, resB] = await Promise.all([
          fetch('/api/marketing/image-ads/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          }),
          fetch('/api/marketing/image-ads/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          }),
        ])
        const dataA = await resA.json()
        const dataB = await resB.json()
        if (!resA.ok) {
          setError(dataA.message || dataA.error || 'Generation failed')
          return
        }
        setResultUrl(dataA.imageUrl ?? null)
        setResultUrlB(resB.ok ? (dataB.imageUrl ?? null) : null)
      } else {
        const res = await fetch('/api/marketing/image-ads/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.message || data.error || 'Generation failed')
          return
        }
        setResultUrl(data.imageUrl ?? null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const downloadImage = (url: string, name: string) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
  }

  const saveImageToLibrary = async (dataUrl: string, label: string) => {
    if (!token) return
    setSavingId(label)
    try {
      await saveToMediaLibrary({
        dataUrl,
        fileName: `image-ad-${label}.png`,
        title: `Image Ad – ${label}`,
        source: 'image-ads',
        authToken: token,
      })
    } finally {
      setSavingId(null)
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
            <ImageIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Image Ads</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Static ads that stop scrolls. Auto-generated hooks, price tags and benefits in your brand style.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">Create image ad</CardTitle>
            <CardDescription>
              Choose a preset and optional hook or price. We&apos;ll generate a ready-to-use static ad for Meta, Google, Instagram.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                Preset
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm"
              >
                {PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            {preset !== 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Hook or headline (optional)
                  </label>
                  <Input
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="e.g. Limited time offer"
                    className="dark:bg-slate-900 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Price or discount (optional)
                  </label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 20% off / ₹499"
                    className="dark:bg-slate-900 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                    Overlay style
                  </label>
                  <select
                    value={overlayStyle}
                    onChange={(e) => setOverlayStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm"
                  >
                    {OVERLAY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {(overlayStyle === 'bold-cta' || overlayStyle === 'minimal') && (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                      CTA text
                    </label>
                    <Input
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="e.g. Shop Now, Learn More"
                      className="dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                )}
              </>
            )}
            {preset === 'custom' && (
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                  Describe your ad
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. A skincare product on a minimal background with 'Best for dry skin' and a CTA button"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm min-h-[100px]"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={generateTwo}
                onChange={(e) => setGenerateTwo(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              Generate 2 variants (A/B)
            </label>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <Button
              className="w-full"
              disabled={generating || !token}
              onClick={handleGenerate}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate ad image
                </>
              )}
            </Button>
            <Link href={`/marketing/${tenantId}/Social-Media/Create-Image`} className="block">
              <Button variant="outline" className="w-full">
                Open full AI Image Generator
              </Button>
            </Link>
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
                Brand-style, scroll-stopping static creatives
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                AI-generated hooks and CTAs
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                Price-tag and benefit-focused presets
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                Export for Meta, Google, Instagram and more
              </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Uses Google AI Studio (Gemini). Configure your API key in Settings &gt; AI Integrations.
            </p>
          </CardContent>
        </Card>
      </div>

      {(resultUrl || resultUrlB) && (
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 dark:text-slate-50">
              {resultUrlB ? 'Generated ad variants (A/B)' : 'Generated ad image'}
            </CardTitle>
            <CardDescription>Download or export at platform size for your campaign.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={resultUrlB ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-4'}>
              {resultUrl && (
                <div className="space-y-4">
                  {resultUrlB && <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Variant A</p>}
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-w-md">
                    <img src={resultUrl} alt="Ad creative A" className="w-full h-auto object-contain" />
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button variant="outline" size="sm" onClick={() => downloadImage(resultUrl, 'image-ad-a.png')}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                    {token && (
                      <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(resultUrl, 'variant-a')}>
                        {savingId === 'variant-a' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    )}
                    <select
                      className="text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value
                        e.target.value = ''
                        if (!id) return
                        const p = EXPORT_PRESETS.find((x) => x.id === id)
                        if (p) exportImageAtSize(resultUrl, p.width, p.height, `image-ad-a-${id}.png`)
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
              {resultUrlB && (
                <div className="space-y-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Variant B</p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 max-w-md">
                    <img src={resultUrlB} alt="Ad creative B" className="w-full h-auto object-contain" />
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Button variant="outline" size="sm" onClick={() => downloadImage(resultUrlB, 'image-ad-b.png')}>
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                    {token && (
                      <Button variant="outline" size="sm" disabled={savingId !== null} onClick={() => saveImageToLibrary(resultUrlB, 'variant-b')}>
                        {savingId === 'variant-b' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    )}
                    <select
                      className="text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value
                        e.target.value = ''
                        if (!id) return
                        const p = EXPORT_PRESETS.find((x) => x.id === id)
                        if (p) exportImageAtSize(resultUrlB, p.width, p.height, `image-ad-b-${id}.png`)
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
    </div>
  )
}
