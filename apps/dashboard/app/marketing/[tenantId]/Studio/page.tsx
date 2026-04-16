'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { MarketingStudioComposer, type SegmentSummary } from '@payaid/social'
import { useAuthStore } from '@/lib/stores/auth'

/** Placeholder until dashboard feeds real brand KPIs into the composer chrome */
const DEFAULT_BRAND_HEALTH = {
  reach: 0,
  engagement: 0,
  roi: 0,
  leads: 0,
  gstReady: 0,
}

export default function MarketingStudioPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { token } = useAuthStore()
  const [segments, setSegments] = useState<SegmentSummary[]>([])

  const getHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  )

  /** POST/PATCH helpers — fresh idempotency key per mutation to align with API dedupe patterns */
  const postHeaders = useCallback(() => {
    const idem =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `marketing:studio:${Date.now()}`
    return {
      'Content-Type': 'application/json',
      'x-idempotency-key': `marketing:studio:post:${idem}`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>
  }, [token])

  const fetchSegments = useCallback(async (): Promise<SegmentSummary[]> => {
    if (!token) return []
    const res = await fetch('/api/marketing/segments', { headers: getHeaders() })
    if (!res.ok) return []
    const data = await res.json()
    return (data.segments ?? []).map(
      (s: { id: string; name: string; contactCount?: number; description?: string }) => ({
        id: s.id,
        name: s.name,
        contactCount: s.contactCount,
        description: s.description,
      })
    )
  }, [getHeaders, token])

  useEffect(() => {
    if (!tenantId || !token) return
    fetchSegments().then(setSegments).catch(() => setSegments([]))
  }, [tenantId, token, fetchSegments])

  const onGenerateContent = useCallback(
    async (prompt: string) => {
      const res = await fetch('/api/social/ai/content', {
        method: 'POST',
        headers: postHeaders(),
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate content')
      }
      const data = await res.json()
      return { primary: data.primary, variants: data.variants }
    },
    [postHeaders]
  )

  const onGenerateImages = useCallback(
    async (prompt: string, _options?: { brandColors?: string; brandLogoUrl?: string }) => {
      const res = await fetch('/api/social/ai/image', {
        method: 'POST',
        headers: postHeaders(),
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate images')
      }
      const data = await res.json()
      return (data.images ?? []).map((img: { id: string; url: string }) => ({ id: img.id, url: img.url }))
    },
    [postHeaders]
  )

  const onGenerateVideo = useCallback(
    async (prompt: string, imageUrls?: string[]) => {
      const res = await fetch('/api/social/ai/video', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt, imageUrls: imageUrls ?? [] }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate video')
      }
      const data = await res.json()
      if (data._placeholder && !data.url) {
        return null
      }
      return { id: data.id, url: data.url }
    },
    [getHeaders]
  )

  const onLaunch = useCallback(
    async (payload: {
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
        headers: postHeaders(),
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
    },
    [tenantId, postHeaders]
  )

  return (
    <section className="flex-1 space-y-5">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Marketing Studio</h1>
      <MarketingStudioComposer
        tenantId={tenantId}
        brandHealth={DEFAULT_BRAND_HEALTH}
        segments={segments}
        onFetchSegments={async () => {
          const list = await fetchSegments()
          setSegments(list)
          return list
        }}
        onGenerateContent={onGenerateContent}
        onGenerateImages={onGenerateImages}
        onGenerateVideo={onGenerateVideo}
        onLaunch={onLaunch}
      />
    </section>
  )
}
