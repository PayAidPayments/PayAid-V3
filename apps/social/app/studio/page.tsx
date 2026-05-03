'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { MarketingStudioShell, type SegmentSummary } from '@payaid/social'

// Demo tenant for standalone app; in production comes from auth
const DEMO_TENANT_ID = 'demo-tenant'
const API_BASE = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SOCIAL_API_URL ?? '') : ''

export default function StudioPage() {
  const getHeaders = useCallback(() => ({ 'Content-Type': 'application/json' }), [])

  const fetchSegments = useCallback(async (): Promise<SegmentSummary[]> => {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/api/marketing/segments`, { headers: getHeaders() })
      if (res.ok) {
        const data = await res.json()
        return (data.segments ?? []).map((s: { id: string; name: string; contactCount?: number }) => ({ id: s.id, name: s.name, contactCount: s.contactCount }))
      }
    }
    return [
      { id: 'all', name: 'All contacts', contactCount: 1247 },
      { id: 'active', name: 'Active', contactCount: 847 },
      { id: 'high-value', name: 'High-value', contactCount: 23 },
    ]
  }, [getHeaders])

  const onGenerateContent = useCallback(async (prompt: string) => {
    if (!API_BASE) throw new Error('Set NEXT_PUBLIC_SOCIAL_API_URL to use AI content')
    const res = await fetch(`${API_BASE}/api/social/ai/content`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ prompt }) })
    if (!res.ok) throw new Error('Failed to generate content')
    const data = await res.json()
    return { primary: data.primary, variants: data.variants }
  }, [getHeaders])

  const onGenerateImages = useCallback(async (prompt: string) => {
    if (!API_BASE) throw new Error('Set NEXT_PUBLIC_SOCIAL_API_URL to use AI images')
    const res = await fetch(`${API_BASE}/api/social/ai/image`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ prompt }) })
    if (!res.ok) throw new Error('Failed to generate images')
    const data = await res.json()
    return (data.images ?? []).map((img: { id: string; url: string }) => ({ id: img.id, url: img.url }))
  }, [getHeaders])

  // In standalone app, set NEXT_PUBLIC_API_URL to your dashboard/backend so /api/social/posts exists
  const handleLaunch = useCallback(async (payload: {
    segmentId: string | null
    goal: string
    channels: string[]
    contentByChannel: Record<string, string>
    mediaIdsByChannel: Record<string, string[]>
    sendNow: boolean
    scheduledFor: string | null
  }) => {
    // POST /api/social/posts – create MarketingPost rows and enqueue Bull (use NEXT_PUBLIC_SOCIAL_API_URL when running standalone)
    const res = await fetch(`${API_BASE}/api/social/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: DEMO_TENANT_ID,
        segmentId: payload.segmentId,
        goal: payload.goal,
        channels: payload.channels,
        contentByChannel: payload.contentByChannel,
        mediaIdsByChannel: payload.mediaIdsByChannel,
        sendNow: payload.sendNow,
        scheduledFor: payload.scheduledFor,
      }),
    })
    if (!res.ok) throw new Error('Failed to launch')
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur h-14 flex items-center justify-between px-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="font-semibold text-slate-900 dark:text-white">PayAid Social</Link>
        <nav className="flex gap-4">
          <Link href="/analytics" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Analytics</Link>
          <Link href="/library" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Library</Link>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto w-full px-4 py-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Marketing Studio</h1>
        <MarketingStudioShell
          tenantId={DEMO_TENANT_ID}
          onFetchSegments={fetchSegments}
          onGenerateContent={API_BASE ? onGenerateContent : undefined}
          onGenerateImages={API_BASE ? onGenerateImages : undefined}
          onLaunch={handleLaunch}
        />
      </main>
    </div>
  )
}
