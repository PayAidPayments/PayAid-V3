'use client'

import React, { useCallback } from 'react'
import { useStudioStore } from './store/studioStore'
import type { MarketingChannel, MarketingGoal, SegmentSummary } from './types'
import { MARKETING_GOALS, MARKETING_CHANNELS } from './types'

const STEP_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'Audience & Goal',
  2: 'Content & Media',
  3: 'Channels & Schedule',
  4: 'Review & Launch',
}

export interface MarketingStudioShellProps {
  tenantId: string
  segments?: SegmentSummary[]
  onFetchSegments?: () => Promise<SegmentSummary[]>
  onGenerateContent?: (prompt: string) => Promise<{ primary: string; variants?: Record<string, string> }>
  onGenerateImages?: (prompt: string) => Promise<{ id: string; url: string }[]>
  onLaunch?: (payload: { segmentId: string | null; goal: MarketingGoal; channels: MarketingChannel[]; contentByChannel: Record<string, string>; mediaIdsByChannel: Record<string, string[]>; sendNow: boolean; scheduledFor: string | null }) => Promise<void>
  onSaveDraft?: () => Promise<void>
  /** Base URL for API calls (e.g. '' in same origin, or full URL for standalone) */
  apiBaseUrl?: string
  /** Optional class for container */
  className?: string
  /** Render prop for step content - if not provided, default step UIs are used */
  renderStep?: (step: 1 | 2 | 3 | 4) => React.ReactNode
}

export function MarketingStudioShell({
  tenantId,
  segments = [],
  onFetchSegments,
  onGenerateContent,
  onGenerateImages,
  onLaunch,
  onSaveDraft,
  apiBaseUrl = '',
  className = '',
  renderStep,
}: MarketingStudioShellProps) {
  const { step, setStep, step1, step2, step3, setSegment, setGoal, setStep2, setSelectedChannels, setContentForChannel, setMediaIdsForChannel, setStep3, isLaunching, setLaunching } = useStudioStore()

  const goNext = useCallback(() => {
    if (step < 4) setStep((step + 1) as 1 | 2 | 3 | 4)
  }, [step, setStep])

  const goPrev = useCallback(() => {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4)
  }, [step, setStep])

  const handleLaunch = useCallback(async () => {
    if (!onLaunch) return
    setLaunching(true)
    try {
      await onLaunch({
        segmentId: step1.selectedSegmentId,
        goal: step1.goal,
        channels: step3.selectedChannels,
        contentByChannel: step3.contentByChannel,
        mediaIdsByChannel: step3.mediaIdsByChannel,
        sendNow: step3.sendNow,
        scheduledFor: step3.scheduledFor,
      })
      goNext()
    } finally {
      setLaunching(false)
    }
  }, [onLaunch, step1, step3, setLaunching, goNext])

  if (renderStep) {
    return (
      <div className={className}>
        <Stepper currentStep={step} onStepClick={setStep} />
        <div className="mt-6">{renderStep(step)}</div>
        <div className="mt-6 flex gap-3">
          {step > 1 && <button type="button" onClick={goPrev}>Previous</button>}
          {step < 4 && <button type="button" onClick={goNext}>Next</button>}
          {step === 4 && (
            <>
              {onSaveDraft && <button type="button" onClick={onSaveDraft}>Save draft</button>}
              <button type="button" onClick={handleLaunch} disabled={isLaunching}>
                {isLaunching ? 'Launching…' : 'Launch campaign'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6 ${className}`}>
      <div>
        <Stepper currentStep={step} onStepClick={setStep} />
        <div className="mt-6 min-h-[320px]">
          {step === 1 && (
            <Step1Audience
              tenantId={tenantId}
              segments={segments}
              selectedSegmentId={step1.selectedSegmentId}
              segmentSummary={step1.segmentSummary}
              goal={step1.goal}
              onSegmentChange={setSegment}
              onGoalChange={setGoal}
              onFetchSegments={onFetchSegments}
            />
          )}
          {step === 2 && (
            <Step2Content
              prompt={step2.prompt}
              generatedContent={step2.generatedContent}
              channelVariants={step2.channelVariants}
              generatedImages={step2.generatedImages}
              selectedImageIds={step2.selectedImageIds}
              onPromptChange={(v) => setStep2({ prompt: v })}
              onContentGenerated={(content, variants) => setStep2({ generatedContent: content, channelVariants: variants || [] })}
              onImagesGenerated={(imgs) => setStep2({ generatedImages: imgs, selectedImageIds: imgs.map((i) => i.id) })}
              onSelectedImagesChange={(ids) => setStep2({ selectedImageIds: ids })}
              onGenerateContent={onGenerateContent}
              onGenerateImages={onGenerateImages}
            />
          )}
          {step === 3 && (
            <Step3Channels
              selectedChannels={step3.selectedChannels}
              contentByChannel={step3.contentByChannel}
              mediaIdsByChannel={step3.mediaIdsByChannel}
              sendNow={step3.sendNow}
              scheduledFor={step3.scheduledFor}
              defaultContent={step2.generatedContent || step2.prompt}
              defaultImageIds={step2.selectedImageIds}
              onChannelsChange={setSelectedChannels}
              onContentChange={setContentForChannel}
              onMediaIdsChange={setMediaIdsForChannel}
              onScheduleChange={(sendNow, scheduledFor) => setStep3({ sendNow, scheduledFor })}
            />
          )}
          {step === 4 && (
            <Step4Review
              segmentSummary={step1.segmentSummary}
              goal={step1.goal}
              selectedChannels={step3.selectedChannels}
              contentByChannel={step3.contentByChannel}
              mediaIdsByChannel={step3.mediaIdsByChannel}
              sendNow={step3.sendNow}
              scheduledFor={step3.scheduledFor}
            />
          )}
        </div>
        <div className="mt-6 flex gap-3 flex-wrap">
          {step > 1 && (
            <button type="button" onClick={goPrev} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              Previous
            </button>
          )}
          {step < 4 && (
            <button type="button" onClick={goNext} className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
              Next
            </button>
          )}
          {step === 4 && (
            <>
              {onSaveDraft && (
                <button type="button" onClick={onSaveDraft} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                  Save draft
                </button>
              )}
              <button type="button" onClick={handleLaunch} disabled={isLaunching} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50">
                {isLaunching ? 'Launching…' : 'Launch campaign'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 h-fit">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Live preview</h3>
        <LivePreview step={step} step1={step1} step2={step2} step3={step3} />
      </div>
    </div>
  )
}

function Stepper({ currentStep, onStepClick }: { currentStep: number; onStepClick: (s: 1 | 2 | 3 | 4) => void }) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700 pb-4">
      {([1, 2, 3, 4] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onStepClick(s)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentStep === s ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
        >
          {s}/4 {STEP_LABELS[s]}
        </button>
      ))}
    </nav>
  )
}

function Step1Audience({
  tenantId,
  segments,
  selectedSegmentId,
  segmentSummary,
  goal,
  onSegmentChange,
  onGoalChange,
  onFetchSegments,
}: {
  tenantId: string
  segments: SegmentSummary[]
  selectedSegmentId: string | null
  segmentSummary: SegmentSummary | null
  goal: MarketingGoal
  onSegmentChange: (id: string | null, summary: SegmentSummary | null) => void
  onGoalChange: (g: MarketingGoal) => void
  onFetchSegments?: () => Promise<SegmentSummary[]>
}) {
  const [loading, setLoading] = React.useState(false)
  React.useEffect(() => {
    if (onFetchSegments && segments.length === 0) {
      setLoading(true)
      onFetchSegments().then((list) => {
        if (list.length && !selectedSegmentId) onSegmentChange(list[0].id, list[0])
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [onFetchSegments, segments.length, selectedSegmentId])
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select audience</label>
        <select
          value={selectedSegmentId ?? ''}
          onChange={(e) => {
            const id = e.target.value || null
            const summary = id ? segments.find((s) => s.id === id) ?? null : null
            onSegmentChange(id, summary)
          }}
          className="w-full max-w-md rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
          disabled={loading}
        >
          <option value="">Choose segment…</option>
          {segments.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.contactCount != null ? `(${s.contactCount})` : ''}
            </option>
          ))}
        </select>
        {segmentSummary && <p className="mt-1 text-xs text-slate-500">{segmentSummary.description}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Marketing goal</label>
        <div className="flex flex-wrap gap-3">
          {MARKETING_GOALS.map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="goal" value={g} checked={goal === g} onChange={() => onGoalChange(g)} className="rounded-full" />
              <span className="text-sm capitalize">{g.toLowerCase()}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step2Content({
  prompt,
  generatedContent,
  channelVariants,
  generatedImages,
  selectedImageIds,
  onPromptChange,
  onContentGenerated,
  onImagesGenerated,
  onSelectedImagesChange,
  onGenerateContent,
  onGenerateImages,
}: {
  prompt: string
  generatedContent: string | null
  channelVariants: { channel: string; content: string }[]
  generatedImages: { id: string; url: string }[]
  selectedImageIds: string[]
  onPromptChange: (v: string) => void
  onContentGenerated: (content: string, variants?: { channel: string; content: string }[]) => void
  onImagesGenerated: (imgs: { id: string; url: string }[]) => void
  onSelectedImagesChange: (ids: string[]) => void
  onGenerateContent?: (prompt: string) => Promise<{ primary: string; variants?: Record<string, string> }>
  onGenerateImages?: (prompt: string) => Promise<{ id: string; url: string }[]>
}) {
  const [loadingContent, setLoadingContent] = React.useState(false)
  const [loadingImages, setLoadingImages] = React.useState(false)
  const handleGenContent = () => {
    if (!onGenerateContent || !prompt.trim()) return
    setLoadingContent(true)
    onGenerateContent(prompt.trim()).then((res) => {
      const variants = res.variants ? Object.entries(res.variants).map(([channel, content]) => ({ channel, content })) : []
      onContentGenerated(res.primary, variants)
      setLoadingContent(false)
    }).catch(() => setLoadingContent(false))
  }
  const handleGenImages = () => {
    if (!onGenerateImages || !prompt.trim()) return
    setLoadingImages(true)
    onGenerateImages(prompt.trim()).then((imgs) => {
      onImagesGenerated(imgs)
      setLoadingImages(false)
    }).catch(() => setLoadingImages(false))
  }
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What do you want to promote?</label>
        <textarea value={prompt} onChange={(e) => onPromptChange(e.target.value)} placeholder="e.g. Product launch! XYZ shoes now 30% off." rows={3} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={handleGenContent} disabled={!prompt.trim() || loadingContent} className="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 disabled:opacity-50">
          {loadingContent ? 'Generating…' : 'Generate content'}
        </button>
        <button type="button" onClick={handleGenImages} disabled={!prompt.trim() || loadingImages} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 disabled:opacity-50">
          {loadingImages ? 'Generating…' : 'Generate images'}
        </button>
      </div>
      {generatedContent && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Generated copy</label>
          <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{generatedContent}</p>
        </div>
      )}
      {generatedImages.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Generated images</label>
          <div className="flex flex-wrap gap-2">
            {generatedImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  const next = selectedImageIds.includes(img.id) ? selectedImageIds.filter((id) => id !== img.id) : [...selectedImageIds, img.id]
                  onSelectedImagesChange(next)
                }}
                className={`rounded-lg border-2 overflow-hidden ${selectedImageIds.includes(img.id) ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-600'}`}
              >
                <img src={img.url} alt="" className="w-24 h-24 object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Step3Channels({
  selectedChannels,
  contentByChannel,
  mediaIdsByChannel,
  sendNow,
  scheduledFor,
  defaultContent,
  defaultImageIds,
  onChannelsChange,
  onContentChange,
  onMediaIdsChange,
  onScheduleChange,
}: {
  selectedChannels: MarketingChannel[]
  contentByChannel: Record<string, string>
  mediaIdsByChannel: Record<string, string[]>
  sendNow: boolean
  scheduledFor: string | null
  defaultContent: string
  defaultImageIds: string[]
  onChannelsChange: (ch: MarketingChannel[]) => void
  onContentChange: (ch: MarketingChannel, content: string) => void
  onMediaIdsChange: (ch: MarketingChannel, ids: string[]) => void
  onScheduleChange: (sendNow: boolean, scheduledFor: string | null) => void
}) {
  const toggle = (ch: MarketingChannel) => {
    const next = selectedChannels.includes(ch) ? selectedChannels.filter((c) => c !== ch) : [...selectedChannels, ch]
    onChannelsChange(next)
    next.forEach((c) => {
      if (!contentByChannel[c]) onContentChange(c, defaultContent)
      if (!mediaIdsByChannel[c]?.length) onMediaIdsChange(c, defaultImageIds)
    })
  }
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Channels</label>
        <div className="flex flex-wrap gap-3">
          {MARKETING_CHANNELS.map((ch) => (
            <label key={ch} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedChannels.includes(ch)} onChange={() => toggle(ch)} />
              <span className="text-sm">{ch}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Schedule</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={sendNow} onChange={() => onScheduleChange(true, null)} />
          <span>Send now</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input type="radio" checked={!sendNow} onChange={() => onScheduleChange(false, scheduledFor || new Date().toISOString())} />
          <span>Schedule</span>
        </label>
        {!sendNow && (
          <input type="datetime-local" value={scheduledFor ? scheduledFor.slice(0, 16) : ''} onChange={(e) => onScheduleChange(false, e.target.value ? new Date(e.target.value).toISOString() : null)} className="mt-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2" />
        )}
      </div>
    </div>
  )
}

function Step4Review({
  segmentSummary,
  goal,
  selectedChannels,
  contentByChannel,
  mediaIdsByChannel,
  sendNow,
  scheduledFor,
}: {
  segmentSummary: SegmentSummary | null
  goal: MarketingGoal
  selectedChannels: MarketingChannel[]
  contentByChannel: Record<string, string>
  mediaIdsByChannel: Record<string, string[]>
  sendNow: boolean
  scheduledFor: string | null
}) {
  return (
    <div className="space-y-4 text-sm">
      <p><strong>Audience:</strong> {segmentSummary?.name ?? '—'} {segmentSummary?.contactCount != null ? `(${segmentSummary.contactCount})` : ''}</p>
      <p><strong>Goal:</strong> {goal}</p>
      <p><strong>Channels:</strong> {selectedChannels.join(', ') || '—'}</p>
      <p><strong>When:</strong> {sendNow ? 'Now' : (scheduledFor ? new Date(scheduledFor).toLocaleString() : '—')}</p>
      {selectedChannels.map((ch) => (
        <div key={ch} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
          <p className="font-medium text-slate-700 dark:text-slate-300">{ch}</p>
          <p className="text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{contentByChannel[ch] || '—'}</p>
          {mediaIdsByChannel[ch]?.length ? <p className="text-xs mt-1">Media: {mediaIdsByChannel[ch].length} item(s)</p> : null}
        </div>
      ))}
    </div>
  )
}

function LivePreview({ step, step1, step2, step3 }: { step: number; step1: any; step2: any; step3: any }) {
  const channels = step >= 3 ? step3.selectedChannels : (['WHATSAPP', 'FACEBOOK', 'LINKEDIN'] as MarketingChannel[])
  const content = step >= 2 ? (step2.generatedContent || step2.prompt || 'Your post text…') : 'Your post text…'
  return (
    <div className="space-y-3">
      {channels.map((ch) => (
        <div key={ch} className="rounded-lg border border-slate-200 dark:border-slate-600 p-3 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{ch}</p>
          <p className="text-sm text-slate-700 dark:text-slate-200">{step3.contentByChannel?.[ch] ?? content}</p>
          {step2.generatedImages?.length ? <div className="mt-2 flex gap-1"><img src={step2.generatedImages[0]?.url} alt="" className="w-12 h-12 object-cover rounded" /></div> : null}
        </div>
      ))}
    </div>
  )
}
