'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Package,
  Shirt,
  Video,
  ImageIcon,
  ArrowRight,
  Sparkles,
  BarChart3,
  Palette,
} from 'lucide-react'

import { useAuthStore } from '@/lib/stores/auth'
import { getStoredBrand, setStoredBrand } from '@/lib/marketing/brand-kit'

export default function CreativeStudioPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [brandColor, setBrandColor] = useState('')
  const [brandTagline, setBrandTagline] = useState('')
  const [brandSaving, setBrandSaving] = useState(false)
  const [brandLoaded, setBrandLoaded] = useState(false)

  useEffect(() => {
    if (!token) {
      const stored = getStoredBrand()
      if (stored) {
        setBrandColor(stored.primaryColor || '')
        setBrandTagline(stored.tagline || '')
      }
      setBrandLoaded(true)
      return
    }
    fetch('/api/marketing/creative-studio/brand', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.primaryColor || data.tagline)) {
          setBrandColor(data.primaryColor || '')
          setBrandTagline(data.tagline || '')
          setStoredBrand({ primaryColor: data.primaryColor, tagline: data.tagline })
        } else {
          const stored = getStoredBrand()
          if (stored) {
            setBrandColor(stored.primaryColor || '')
            setBrandTagline(stored.tagline || '')
          }
        }
      })
      .catch(() => {
        const stored = getStoredBrand()
        if (stored) {
          setBrandColor(stored.primaryColor || '')
          setBrandTagline(stored.tagline || '')
        }
      })
      .finally(() => setBrandLoaded(true))
  }, [token])

  const saveBrand = async () => {
    const payload = { primaryColor: brandColor.trim() || undefined, tagline: brandTagline.trim() || undefined }
    setStoredBrand(payload.primaryColor || payload.tagline ? payload : null)
    if (!token) return
    setBrandSaving(true)
    try {
      const res = await fetch('/api/marketing/creative-studio/brand', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const data = await res.json()
        setStoredBrand(data.primaryColor || data.tagline ? data : null)
      }
    } finally {
      setBrandSaving(false)
    }
  }

  const tools = [
    {
      title: 'Product Studio',
      description: 'Upload any product photo and get a full image set — main, lifestyle, and infographic — ready for Amazon, Flipkart, Myntra & Shopify.',
      href: `/marketing/${tenantId}/Creative-Studio/Product-Studio`,
      icon: <Package className="h-6 w-6" />,
      features: ['50+ category templates', 'Auto white-background & margins', '3000×3000 export', 'Marketplace guidelines'],
    },
    {
      title: 'Model Studio',
      description: 'Upload a garment and get realistic on-model images with Indian poses, lighting and backdrops — perfect for Myntra & Shopify.',
      href: `/marketing/${tenantId}/Creative-Studio/Model-Studio`,
      icon: <Shirt className="h-6 w-6" />,
      features: ['Ethnic & western wear', 'Pose + background selection', 'Myntra-ready framing', 'White-space balance'],
    },
    {
      title: 'UGC Video Ads',
      description: 'Vertical video ads auto-generated with AI scripts, voiceover and actors. Ready for Reels, Shorts and TikTok.',
      href: `/marketing/${tenantId}/AI-Influencer`,
      icon: <Video className="h-6 w-6" />,
      features: ['AI scripts & voiceover', 'Testimonial & demo styles', 'Reels / Shorts / TikTok', 'No shoot required'],
    },
    {
      title: 'Image Ads',
      description: 'Static ads that stop scrolls. Auto-generated hooks, price tags and benefits in your brand style for Meta, Google and more.',
      href: `/marketing/${tenantId}/Creative-Studio/Image-Ads`,
      icon: <ImageIcon className="h-6 w-6" />,
      features: ['Brand-style detection', 'Hooks & CTAs', 'Price-tag overlays', 'Multi-platform export'],
    },
    {
      title: 'Ad Insights (AI-CMO)',
      description: 'Winning strategies, research placeholders, and quick links to create high-performing creatives.',
      href: `/marketing/${tenantId}/Creative-Studio/Ad-Insights`,
      icon: <BarChart3 className="h-6 w-6" />,
      features: ['Winning strategies', 'Research (coming soon)', 'Suggest creatives'],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800">
          <Sparkles className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Creative Studio</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Create winning ads and marketplace-ready visuals in minutes. AI-powered product shots, on-model photos, UGC videos and static ads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.href}>
            <Card className="h-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {tool.icon}
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-50">{tool.title}</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-wrap gap-2">
                  {tool.features.map((f) => (
                    <li
                      key={f}
                      className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand kit
          </CardTitle>
          <CardDescription>
            Set your brand color and tagline once. They’ll be used when generating Product Studio and Image Ads creatives for a consistent look.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Primary color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={brandColor || '#53328a'}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  placeholder="#53328a"
                  className="w-28 font-mono text-sm dark:bg-slate-900 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Tagline</label>
              <Input
                value={brandTagline}
                onChange={(e) => setBrandTagline(e.target.value)}
                placeholder="e.g. Quality you can trust"
                className="dark:bg-slate-900 dark:border-slate-700"
              />
            </div>
            <Button onClick={saveBrand} disabled={brandSaving}>{brandSaving ? 'Saving…' : 'Save'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 dark:text-slate-50">One platform. Endless creation.</CardTitle>
          <CardDescription>
            Create videos, images and photoshoots in one place — all aligned with your brand and marketplace guidelines. No agency fees, no creative bottleneck.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
