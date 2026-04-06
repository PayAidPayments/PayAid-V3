'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useStudioStore } from './store/studioStore'
import type { MarketingChannel, MarketingGoal, SegmentSummary } from './types'
import { MARKETING_GOALS, MARKETING_CHANNELS } from './types'

const CHANNEL_LABELS: Record<string, { label: string; icon: string; waha?: boolean }> = {
  WHATSAPP: { label: 'WhatsApp (WAHA)', icon: '📱', waha: true },
  FACEBOOK: { label: 'Facebook', icon: '📘' },
  LINKEDIN: { label: 'LinkedIn', icon: '💼' },
  TWITTER: { label: 'Twitter/X', icon: '🐦' },
  INSTAGRAM: { label: 'Instagram', icon: '📸' },
  YOUTUBE: { label: 'YouTube', icon: '📺' },
  EMAIL: { label: 'Email', icon: '✉️' },
  SMS: { label: 'SMS', icon: '💬' },
}

export interface BrandHealth {
  reach: number
  engagement: number
  roi: number
  leads: number
  gstReady: number
}

export interface MarketingStudioComposerProps {
  tenantId: string
  brandHealth: BrandHealth
  segments?: SegmentSummary[]
  recentMedia?: { id: string; fileUrl: string; fileName?: string }[]
  onFetchSegments?: () => Promise<SegmentSummary[]>
  onSegmentCreated?: () => void | Promise<void>
  onQuickCreateSegment?: (payload: { name: string; description?: string; criteria: string }) => Promise<SegmentSummary>
  onGenerateContent?: (prompt: string) => Promise<{ primary: string; variants?: Record<string, string> }>
  onGenerateImages?: (
    prompt: string,
    options?: { brandColors?: string; brandLogoUrl?: string }
  ) => Promise<{ id: string; url: string }[]>
  onGenerateVideo?: (prompt: string, imageUrls?: string[]) => Promise<{ id: string; url: string } | null>
  onLaunch?: (payload: {
    segmentId: string | null
    goal: MarketingGoal
    channels: MarketingChannel[]
    contentByChannel: Record<string, string>
    mediaIdsByChannel: Record<string, string[]>
    sendNow: boolean
    scheduledFor: string | null
  }) => Promise<void>
  className?: string
}

export function MarketingStudioComposer({
  tenantId,
  brandHealth,
  segments = [],
  recentMedia = [],
  onFetchSegments,
  onSegmentCreated,
  onQuickCreateSegment,
  onGenerateContent,
  onGenerateImages,
  onGenerateVideo,
  onLaunch,
  className = '',
}: MarketingStudioComposerProps) {
  const {
    step1,
    step2,
    step3,
    setSegment,
    setGoal,
    setStep2,
    setSelectedChannels,
    setContentForChannel,
    setMediaIdsForChannel,
    setStep3,
    isLaunching,
    setLaunching,
  } = useStudioStore()

  const [activePreviewTab, setActivePreviewTab] = useState<MarketingChannel | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [brandColors, setBrandColors] = useState('')
  const [brandLogoUrl, setBrandLogoUrl] = useState('')

  const displayChannels = useMemo(
    () =>
      ['WHATSAPP', 'FACEBOOK', 'LINKEDIN', 'TWITTER', 'INSTAGRAM', 'YOUTUBE', 'EMAIL'].filter((c) =>
        MARKETING_CHANNELS.includes(c as MarketingChannel)
      ) as MarketingChannel[],
    []
  )
  const selectedChannels = step3.selectedChannels
  useEffect(() => {
    if (selectedChannels.length === 0 && displayChannels.length) {
      setSelectedChannels(displayChannels.slice(0, 3) as MarketingChannel[])
    }
  }, [displayChannels.length, selectedChannels.length, setSelectedChannels])

  const previewTab: MarketingChannel | undefined = activePreviewTab ?? selectedChannels[0]
  const variantMap = useMemo(() => {
    const m: Record<string, string> = {}
    ;(step2.channelVariants || []).forEach((v: { channel: string; content: string }) => {
      m[v.channel] = v.content
    })
    return m
  }, [step2.channelVariants])
  const defaultContent = step2.generatedContent || step2.prompt || 'Your post text…'
  const copyForChannel = (ch: MarketingChannel) =>
    step3.contentByChannel?.[ch] ?? variantMap[ch] ?? defaultContent
  const firstImageUrl =
    step2.generatedImages?.find((img) => step2.selectedImageIds?.includes(img.id))?.url ??
    step2.generatedImages?.[0]?.url

  const toggleChannel = useCallback(
    (ch: MarketingChannel) => {
      const next = selectedChannels.includes(ch)
        ? selectedChannels.filter((c) => c !== ch)
        : [...selectedChannels, ch]
      setSelectedChannels(next)
      next.forEach((c) => {
        if (!step3.contentByChannel[c]) setContentForChannel(c, variantMap[c] ?? defaultContent)
        if (!step3.mediaIdsByChannel[c]?.length) setMediaIdsForChannel(c, step2.selectedImageIds)
      })
    },
    [
      selectedChannels,
      setSelectedChannels,
      setContentForChannel,
      setMediaIdsForChannel,
      step3.contentByChannel,
      step3.mediaIdsByChannel,
      variantMap,
      defaultContent,
      step2.selectedImageIds,
    ]
  )

  const handleGenContent = useCallback(() => {
    if (!onGenerateContent || !step2.prompt.trim()) return
    setLoadingContent(true)
    onGenerateContent(step2.prompt.trim())
      .then((res) => {
        const validChannels = new Set<string>(MARKETING_CHANNELS)
        const variants = res.variants
          ? Object.entries(res.variants)
              .filter(([channel]) => validChannels.has(channel))
              .map(([channel, content]) => ({
                channel: channel as MarketingChannel,
                content,
                mediaIds: [],
              }))
          : []
        setStep2({ generatedContent: res.primary, channelVariants: variants })
      })
      .catch(() => {
        /* API errors must not surface as unhandled rejections */
      })
      .finally(() => setLoadingContent(false))
  }, [onGenerateContent, step2.prompt, setStep2])

  const handleGenImages = useCallback(() => {
    if (!onGenerateImages || !step2.prompt.trim()) return
    setLoadingImages(true)
    onGenerateImages(step2.prompt.trim(), {
      brandColors: brandColors.trim() || undefined,
      brandLogoUrl: brandLogoUrl.trim() || undefined,
    })
      .then((imgs) => setStep2({ generatedImages: imgs, selectedImageIds: imgs.map((i) => i.id) }))
      .catch(() => {
        setStep2({ generatedImages: [], selectedImageIds: [] })
      })
      .finally(() => setLoadingImages(false))
  }, [onGenerateImages, step2.prompt, setStep2, brandColors, brandLogoUrl])

  const handleGenVideo = useCallback(() => {
    if (!onGenerateVideo || !step2.prompt.trim()) return
    setLoadingVideo(true)
    const urls = (step2.generatedImages ?? [])
      .slice(0, 3)
      .map((i) => i.url)
      .filter(Boolean)
    onGenerateVideo(step2.prompt.trim(), urls)
      .then((v) => setStep2({ generatedVideo: v ? { ...v, mimeType: 'video/mp4' } : null }))
      .catch(() => {
        setStep2({ generatedVideo: null })
      })
      .finally(() => setLoadingVideo(false))
  }, [onGenerateVideo, step2.prompt, step2.generatedImages, setStep2])

  const handleLaunch = useCallback(async () => {
    if (!onLaunch) return
    setLaunching(true)
    setLaunchError(null)
    try {
      await onLaunch({
        segmentId: step1.selectedSegmentId,
        goal: step1.goal,
        channels: selectedChannels,
        contentByChannel: step3.contentByChannel,
        mediaIdsByChannel: step3.mediaIdsByChannel,
        sendNow: step3.sendNow,
        scheduledFor: step3.scheduledFor,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Launch failed'
      setLaunchError(msg)
    } finally {
      setLaunching(false)
    }
  }, [onLaunch, step1, step3, selectedChannels, setLaunching])

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4 ${className}`}>
      <aside className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 h-fit">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          Channels
        </h3>
        <ul className="space-y-1">
          {displayChannels.map((ch) => {
            const meta = CHANNEL_LABELS[ch] ?? { label: ch, icon: '•' }
            const selected = selectedChannels.includes(ch)
            return (
              <li key={ch}>
                <button
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                    selected
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span className="flex-1 truncate">{meta.label}</span>
                  {meta.waha && <span className="text-[10px]">✅</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </aside>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Composer</h3>
          <textarea
            value={step2.prompt}
            onChange={(e) => setStep2({ prompt: e.target.value })}
            placeholder="What do you want to promote? e.g. Shoes sale 30% off 🔥"
            rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 text-sm"
          />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleGenContent}
              disabled={!step2.prompt.trim() || loadingContent}
              className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium disabled:opacity-50"
            >
              {loadingContent ? '…' : 'Gen Captions'}
            </button>
            <button
              type="button"
              onClick={handleGenImages}
              disabled={!step2.prompt.trim() || loadingImages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-50"
            >
              {loadingImages ? '…' : 'Gen Images'}
            </button>
            <button
              type="button"
              onClick={handleGenVideo}
              disabled={!step2.prompt.trim() || loadingVideo}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-50"
            >
              {loadingVideo ? '…' : 'Gen Video'}
            </button>
            <select className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs">
              <option value="none">Brand Kit: None</option>
              <option value="logo">Logo</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={step2.saveToLibrary}
                onChange={(e) => setStep2({ saveToLibrary: e.target.checked })}
                className="rounded"
              />
              Save to Drive
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            <input
              value={brandLogoUrl}
              onChange={(e) => setBrandLogoUrl(e.target.value)}
              placeholder="Brand logo URL (https://...)"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
            <input
              value={brandColors}
              onChange={(e) => setBrandColors(e.target.value)}
              placeholder="Brand colors (e.g. #0ea5e9, #111827)"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          {selectedChannels.length > 0 && previewTab ? (
            <div className="mt-4">
              <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-3">
                {selectedChannels.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setActivePreviewTab(ch)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-t ${
                      previewTab === ch
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {CHANNEL_LABELS[ch]?.label ?? ch}
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 bg-slate-50 dark:bg-slate-800/50 min-h-[120px]">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  {CHANNEL_LABELS[previewTab]?.label ?? previewTab}
                </p>
                <textarea
                  value={copyForChannel(previewTab)}
                  onChange={(e) => setContentForChannel(previewTab, e.target.value)}
                  rows={3}
                  className="w-full text-sm text-slate-700 dark:text-slate-200 bg-transparent border-0 resize-none focus:ring-0 p-0"
                  placeholder="Post copy for this channel"
                />
                {firstImageUrl && (
                  <div className="mt-3">
                    {previewTab === 'EMAIL' ? (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 overflow-hidden">
                        <div className="w-full bg-slate-100 dark:bg-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={firstImageUrl} alt="" className="w-full h-48 object-cover" />
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email body preview</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap line-clamp-4">
                            {copyForChannel(previewTab)}
                          </p>
                        </div>
                      </div>
                    ) : previewTab === 'FACEBOOK' ? (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 p-2">
                        <div className="w-full h-56 rounded bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={firstImageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 p-2">
                        <div className="w-full h-56 rounded bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={firstImageUrl} alt="" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Select channels on the left to see previews.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <select
              value={step1.selectedSegmentId ?? ''}
              onChange={(e) => {
                const id = e.target.value || null
                const summary = id ? segments.find((s) => s.id === id) ?? null : null
                setSegment(id, summary)
              }}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm"
            >
              <option value="">Audience</option>
              {segments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.contactCount != null ? `(${s.contactCount})` : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              {MARKETING_GOALS.map((g) => (
                <label key={g} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="goal"
                    checked={step1.goal === g}
                    onChange={() => setGoal(g)}
                    className="rounded-full"
                  />
                  {g.toLowerCase()}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                checked={step3.sendNow}
                onChange={() => setStep3({ sendNow: true, scheduledFor: null })}
              />
              Now
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                checked={!step3.sendNow}
                onChange={() =>
                  setStep3({ sendNow: false, scheduledFor: step3.scheduledFor || new Date().toISOString() })
                }
              />
              Schedule
            </label>
            {!step3.sendNow && (
              <input
                type="datetime-local"
                value={step3.scheduledFor ? step3.scheduledFor.slice(0, 16) : ''}
                onChange={(e) =>
                  setStep3({
                    sendNow: false,
                    scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 text-sm bg-white dark:bg-slate-800"
              />
            )}
            {launchError && (
              <p className="w-full text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {launchError}
              </p>
            )}
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isLaunching || selectedChannels.length === 0}
              className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {isLaunching ? 'Launching…' : 'Launch'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Live Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Mentions & replies</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Connect WAHA for WhatsApp mentions</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Calendar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Schedule view</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Upcoming posts</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
              Recent Library
            </h3>
            <div className="flex gap-1.5 flex-wrap">
              {recentMedia.length === 0 ? (
                <p className="text-xs text-slate-500">No media yet</p>
              ) : (
                recentMedia.slice(0, 6).map((m) => (
                  <a
                    key={m.id}
                    href={m.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
                  >
                    {/\.(jpg|jpeg|png|gif|webp)/i.test(m.fileUrl ?? '') ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.fileUrl} alt="" className="w-full h-full object-cover" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg">📎</div>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

