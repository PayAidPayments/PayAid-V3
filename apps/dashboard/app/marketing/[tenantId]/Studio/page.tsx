'use client'

import { useParams } from 'next/navigation'
import { useCallback } from 'react'
import { MarketingStudioShell, type SegmentSummary } from '@payaid/social'
import { useAuthStore } from '@/lib/stores/auth'

export default function MarketingStudioPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { token } = useAuthStore()

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token])

  const fetchSegments = useCallback(async (): Promise<SegmentSummary[]> => {
    const res = await fetch('/api/marketing/segments', { headers: getHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    return (data.segments ?? []).map((s: { id: string; name: string; contactCount?: number; description?: string }) => ({
      id: s.id,
      name: s.name,
      contactCount: s.contactCount,
      description: s.description,
    }))
  }, [getHeaders])

  const onGenerateContent = useCallback(async (prompt: string) => {
    const res = await fetch('/api/social/ai/content', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to generate content')
    }
    const data = await res.json()
    return { primary: data.primary, variants: data.variants }
  }, [getHeaders])

  const onGenerateImages = useCallback(async (prompt: string) => {
    const res = await fetch('/api/social/ai/image', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to generate images')
    }
    const data = await res.json()
    return (data.images ?? []).map((img: { id: string; url: string }) => ({ id: img.id, url: img.url }))
  }, [getHeaders])

  const handleLaunch = useCallback(async (payload: {
    segmentId: string | null
    goal: string
    channels: string[]
    contentByChannel: Record<string, string>
    mediaIdsByChannel: Record<string, string[]>
    sendNow: boolean
    scheduledFor: string | null
  }) => {
    const res = await fetch('/api/social/posts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        tenantId,
        segmentId: payload.segmentId,
        goal: payload.goal,
        channels: payload.channels,
        contentByChannel: payload.contentByChannel,
        mediaIdsByChannel: payload.mediaIdsByChannel,
        sendNow: payload.sendNow,
        scheduledFor: payload.scheduledFor,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to launch')
    }
  }, [tenantId, getHeaders])

  return (
    <section className="flex-1 space-y-5">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Marketing Studio</h1>
      <MarketingStudioShell
        tenantId={tenantId}
        onFetchSegments={fetchSegments}
        onGenerateContent={onGenerateContent}
        onGenerateImages={onGenerateImages}
        onLaunch={handleLaunch}
      />
    </section>
  )
}
