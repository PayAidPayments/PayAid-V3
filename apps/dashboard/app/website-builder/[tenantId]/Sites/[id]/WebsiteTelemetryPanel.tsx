'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CopyAction, COPY_ACTION_PRESETS } from '@/components/ui/copy-action'
import { Input } from '@/components/ui/input'

const ARCHIVE_PAGE_SIZE = 10
const LIVE_ROW_HEIGHT_PX = 40
const LIVE_LIST_MAX_HEIGHT_PX = 192
const LIVE_VIRTUAL_OVERSCAN = 8

const EVENT_TYPES = ['section_add', 'section_update', 'section_move', 'section_delete'] as const
type EventType = (typeof EVENT_TYPES)[number]

export type SectionTelemetryEvent = {
  eventType: EventType
  at: string
  pageId: string
  pageSlug: string
  sectionIndex: number
  detail?: string
}

type TelemetryArchive = {
  archivedAt: string
  label: string
  count: number
  events: SectionTelemetryEvent[]
}

function isEventType(v: unknown): v is EventType {
  return typeof v === 'string' && (EVENT_TYPES as readonly string[]).includes(v)
}

function parseSectionOps(raw: unknown): SectionTelemetryEvent[] {
  if (!Array.isArray(raw)) return []
  const out: SectionTelemetryEvent[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    if (!isEventType(o.eventType)) continue
    if (typeof o.at !== 'string' || typeof o.pageId !== 'string' || typeof o.pageSlug !== 'string') continue
    if (typeof o.sectionIndex !== 'number' || !Number.isInteger(o.sectionIndex) || o.sectionIndex < 0) continue
    out.push({
      eventType: o.eventType,
      at: o.at,
      pageId: o.pageId,
      pageSlug: o.pageSlug,
      sectionIndex: o.sectionIndex,
      detail: typeof o.detail === 'string' ? o.detail : undefined,
    })
  }
  return out
}

function parseArchives(raw: unknown): TelemetryArchive[] {
  if (!Array.isArray(raw)) return []
  const out: TelemetryArchive[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const a = item as Record<string, unknown>
    if (typeof a.archivedAt !== 'string') continue
    const events = parseSectionOps(a.events)
    out.push({
      archivedAt: a.archivedAt,
      label: typeof a.label === 'string' ? a.label : 'archive',
      count: typeof a.count === 'number' && Number.isFinite(a.count) ? a.count : events.length,
      events,
    })
  }
  return out
}

function maxHistoryCap(editorTelemetry: Record<string, unknown> | undefined): number {
  const configured = Number(editorTelemetry?.maxHistory)
  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(500, Math.max(1, Math.floor(configured)))
  }
  return 200
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function eventsToCsv(events: SectionTelemetryEvent[]): string {
  const header = ['eventType', 'at', 'pageId', 'pageSlug', 'sectionIndex', 'detail']
  const lines = [
    header.join(','),
    ...events.map((e) =>
      [
        escapeCsvCell(e.eventType),
        escapeCsvCell(e.at),
        escapeCsvCell(e.pageId),
        escapeCsvCell(e.pageSlug),
        escapeCsvCell(String(e.sectionIndex)),
        escapeCsvCell(e.detail ?? ''),
      ].join(',')
    ),
  ]
  return lines.join('\n')
}

const LIVE_GRID_CLASS =
  'grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)_minmax(0,0.85fr)_minmax(0,1fr)_2.5rem] gap-2 px-2'

type VirtualListProps = {
  events: SectionTelemetryEvent[]
  selectedLinearIndex: number | null
  onSelectLinearIndex: (index: number | null) => void
}

const VirtualizedLiveOpsList = forwardRef<HTMLDivElement, VirtualListProps>(
  function VirtualizedLiveOpsList({ events, selectedLinearIndex, onSelectLinearIndex }, forwardedRef) {
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [viewportH, setViewportH] = useState(LIVE_LIST_MAX_HEIGHT_PX)

    const setScrollEl = useCallback(
      (node: HTMLDivElement | null) => {
        scrollRef.current = node
        if (typeof forwardedRef === 'function') {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [forwardedRef]
    )

    useLayoutEffect(() => {
      const el = scrollRef.current
      if (!el) return
      const update = () => setViewportH(Math.max(1, el.clientHeight))
      update()
      const ro = new ResizeObserver(update)
      ro.observe(el)
      return () => ro.disconnect()
    }, [])

    const total = events.length
    const totalPx = total * LIVE_ROW_HEIGHT_PX
    const start = Math.max(0, Math.floor(scrollTop / LIVE_ROW_HEIGHT_PX) - LIVE_VIRTUAL_OVERSCAN)
    const end = Math.min(
      total,
      Math.ceil((scrollTop + viewportH) / LIVE_ROW_HEIGHT_PX) + LIVE_VIRTUAL_OVERSCAN
    )

    return (
      <div>
        <div className={`${LIVE_GRID_CLASS} border-b border-gray-200 bg-gray-50 py-2 font-medium text-gray-600`}>
          <div>Type</div>
          <div>At</div>
          <div>Page</div>
          <div>Detail</div>
          <div>Idx</div>
        </div>
        <div
          ref={setScrollEl}
          className="overflow-auto"
          style={{ maxHeight: LIVE_LIST_MAX_HEIGHT_PX }}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
          <div className="relative w-full" style={{ height: totalPx }}>
            <div
              className="absolute left-0 right-0 top-0"
              style={{ transform: `translateY(${start * LIVE_ROW_HEIGHT_PX}px)` }}
            >
              {events.slice(start, end).map((e, rowIdx) => {
                const i = start + rowIdx
                const detail = e.detail?.trim() || ''
                const selected = selectedLinearIndex === i
                return (
                  <div
                    key={`${e.at}-${e.pageId}-${e.sectionIndex}-${i}`}
                    role="button"
                    tabIndex={0}
                    className={`${LIVE_GRID_CLASS} cursor-pointer border-b border-gray-100 text-gray-800 outline-none hover:bg-gray-50/80 ${
                      selected ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-200' : ''
                    }`}
                    style={{
                      height: LIVE_ROW_HEIGHT_PX,
                      alignItems: 'center',
                      boxSizing: 'border-box',
                    }}
                    onClick={() => onSelectLinearIndex(selected ? null : i)}
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        onSelectLinearIndex(selected ? null : i)
                      }
                    }}
                  >
                    <div className="truncate whitespace-nowrap">{e.eventType}</div>
                    <div className="truncate whitespace-nowrap text-gray-500">
                      {new Date(e.at).toLocaleString()}
                    </div>
                    <div className="truncate">{e.pageSlug}</div>
                    <div className="min-w-0 truncate text-gray-600" title={detail || undefined}>
                      {detail || '—'}
                    </div>
                    <div>{e.sectionIndex}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
VirtualizedLiveOpsList.displayName = 'VirtualizedLiveOpsList'

type Props = {
  siteId: string
  token: string | null
  editorTelemetry: Record<string, unknown> | undefined
  onUpdated: () => void
}

export function WebsiteTelemetryPanel({ siteId, token, editorTelemetry, onUpdated }: Props) {
  const sectionOps = useMemo(() => parseSectionOps(editorTelemetry?.sectionOps), [editorTelemetry])
  const archives = useMemo(() => parseArchives(editorTelemetry?.archives), [editorTelemetry])
  const cap = useMemo(() => maxHistoryCap(editorTelemetry), [editorTelemetry])

  const [liveFilter, setLiveFilter] = useState<string>('')
  const [liveNewestFirst, setLiveNewestFirst] = useState(false)
  const [selectedLiveLinearIndex, setSelectedLiveLinearIndex] = useState<number | null>(null)
  const liveListScrollRef = useRef<HTMLDivElement | null>(null)
  const [pruneMax, setPruneMax] = useState(String(cap))
  const [archiveLabel, setArchiveLabel] = useState('')
  const [clearArchiveBefore, setClearArchiveBefore] = useState(false)
  const [clearArchiveLabel, setClearArchiveLabel] = useState('')
  const [keepLastArchives, setKeepLastArchives] = useState('')

  const [archiveLabelFilter, setArchiveLabelFilter] = useState('')
  const [archiveFrom, setArchiveFrom] = useState('')
  const [archiveTo, setArchiveTo] = useState('')
  const [archivePage, setArchivePage] = useState(0)
  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null)

  useEffect(() => {
    setPruneMax(String(cap))
  }, [cap])

  const filteredLive = useMemo(() => {
    if (!liveFilter) return sectionOps
    return sectionOps.filter((e) => e.eventType === liveFilter)
  }, [sectionOps, liveFilter])

  const orderedLive = useMemo(() => {
    if (!liveNewestFirst) return filteredLive
    return [...filteredLive].reverse()
  }, [filteredLive, liveNewestFirst])

  const scrollLiveToLatest = useCallback(() => {
    const el = liveListScrollRef.current
    if (!el || filteredLive.length === 0) return
    const max = Math.max(0, el.scrollHeight - el.clientHeight)
    el.scrollTop = liveNewestFirst ? 0 : max
  }, [filteredLive.length, liveNewestFirst])

  useLayoutEffect(() => {
    if (liveNewestFirst || filteredLive.length === 0) return
    const el = liveListScrollRef.current
    if (!el) return
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight)
  }, [liveNewestFirst, liveFilter, filteredLive.length])

  useEffect(() => {
    setSelectedLiveLinearIndex(null)
  }, [liveFilter, liveNewestFirst, filteredLive.length])

  const selectedLiveEvent =
    selectedLiveLinearIndex !== null ? orderedLive[selectedLiveLinearIndex] ?? null : null

  const selectedLiveEventJson = useMemo(
    () => (selectedLiveEvent ? JSON.stringify(selectedLiveEvent, null, 2) : ''),
    [selectedLiveEvent]
  )

  const filteredArchiveEntries = useMemo(() => {
    const labelNeedle = archiveLabelFilter.trim().toLowerCase()
    const fromMs = archiveFrom ? new Date(archiveFrom + 'T00:00:00').getTime() : null
    const toMs = archiveTo ? new Date(archiveTo + 'T23:59:59.999').getTime() : null

    return archives
      .map((entry, originalIndex) => ({ entry, originalIndex }))
      .filter(({ entry }) => {
        if (labelNeedle && !entry.label.toLowerCase().includes(labelNeedle)) return false
        const t = new Date(entry.archivedAt).getTime()
        if (fromMs !== null && !Number.isNaN(fromMs) && t < fromMs) return false
        if (toMs !== null && !Number.isNaN(toMs) && t > toMs) return false
        return true
      })
  }, [archives, archiveLabelFilter, archiveFrom, archiveTo])

  useEffect(() => {
    setArchivePage(0)
  }, [archiveLabelFilter, archiveFrom, archiveTo, archives.length])

  const archiveMaxPage = Math.max(0, Math.ceil(filteredArchiveEntries.length / ARCHIVE_PAGE_SIZE) - 1)
  const archiveDisplayPage = Math.min(archivePage, archiveMaxPage)
  const archivePageLabelTotal = Math.max(1, archiveMaxPage + 1)

  useEffect(() => {
    setArchivePage((p) => Math.min(p, archiveMaxPage))
  }, [archiveMaxPage])

  const pagedArchives = useMemo(() => {
    const start = archiveDisplayPage * ARCHIVE_PAGE_SIZE
    return filteredArchiveEntries.slice(start, start + ARCHIVE_PAGE_SIZE)
  }, [filteredArchiveEntries, archiveDisplayPage])

  const archiveMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const response = await fetch('/api/website/telemetry', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error((payload as { error?: string }).error || 'Archive request failed')
      }
      return response.json()
    },
    onSuccess: () => onUpdated(),
  })

  const pruneMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const response = await fetch('/api/website/telemetry', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error((payload as { error?: string }).error || 'Prune request failed')
      }
      return response.json()
    },
    onSuccess: (_data, variables) => {
      onUpdated()
      if (variables && typeof variables === 'object' && 'deleteArchiveIndex' in variables) {
        setSelectedArchiveIndex(null)
      }
    },
  })

  const clearMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const response = await fetch('/api/website/telemetry', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error((payload as { error?: string }).error || 'Clear request failed')
      }
      return response.json()
    },
    onSuccess: () => onUpdated(),
  })

  const disabled = !token

  const exportLiveJson = () => {
    downloadText(`site-${siteId}-section-ops.json`, JSON.stringify(filteredLive, null, 2), 'application/json')
  }

  const exportLiveCsv = () => {
    downloadText(`site-${siteId}-section-ops.csv`, eventsToCsv(filteredLive), 'text/csv;charset=utf-8')
  }

  const exportArchiveJson = (index: number) => {
    const arch = archives[index]
    if (!arch) return
    downloadText(
      `site-${siteId}-archive-${index}-${arch.label.replace(/[^a-z0-9-_]+/gi, '_')}.json`,
      JSON.stringify(arch, null, 2),
      'application/json'
    )
  }

  const handlePruneLive = () => {
    const n = Math.floor(Number(pruneMax))
    if (!Number.isFinite(n) || n < 0 || n > 500) return
    pruneMutation.mutate({ siteId, maxHistory: n })
  }

  const handleKeepLastArchives = () => {
    const n = Math.floor(Number(keepLastArchives))
    if (!Number.isFinite(n) || n < 1 || n > 50) return
    pruneMutation.mutate({ siteId, maxHistory: cap, keepLastArchives: n })
  }

  const handleDeleteSelectedArchive = () => {
    if (selectedArchiveIndex === null) return
    if (!window.confirm(`Delete archive #${selectedArchiveIndex} from the server?`)) return
    pruneMutation.mutate({ siteId, maxHistory: cap, deleteArchiveIndex: selectedArchiveIndex })
  }

  const sectionOpsUpdatedAt =
    typeof editorTelemetry?.sectionOpsUpdatedAt === 'string' ? editorTelemetry.sectionOpsUpdatedAt : null
  const archiveUpdatedAt =
    typeof editorTelemetry?.archiveUpdatedAt === 'string' ? editorTelemetry.archiveUpdatedAt : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Section telemetry</CardTitle>
        <CardDescription>
          Live section ops (virtual list; click a row for full JSON and multi-line detail below). Detail column truncates
          with hover; newest-first and jump to latest; paginated archives. Exports use stored order (oldest to newest).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
          <span>Live events: {sectionOps.length}</span>
          <span>Cap: {cap}</span>
          {sectionOpsUpdatedAt && <span>Ops updated: {new Date(sectionOpsUpdatedAt).toLocaleString()}</span>}
          {archiveUpdatedAt && <span>Archives updated: {new Date(archiveUpdatedAt).toLocaleString()}</span>}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">Live operations</p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={liveFilter}
              onChange={(e) => setLiveFilter(e.target.value)}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm"
            >
              <option value="">All types</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" variant="outline" onClick={exportLiveJson} disabled={disabled}>
              Export JSON
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={exportLiveCsv} disabled={disabled}>
              Export CSV
            </Button>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={liveNewestFirst}
                onChange={(e) => setLiveNewestFirst(e.target.checked)}
              />
              Newest first
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={scrollLiveToLatest}
              disabled={filteredLive.length === 0}
            >
              Jump to latest
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            JSON and CSV exports always use stored order (oldest to newest), independent of this view. Click a row to
            inspect one event (same row again or change filter to close).
          </p>
          <div className="rounded-md border border-gray-200 text-xs">
            {filteredLive.length === 0 ? (
              <p className="p-3 text-gray-500">No events in the current filter.</p>
            ) : (
              <VirtualizedLiveOpsList
                key={`${liveFilter}-${filteredLive.length}-${liveNewestFirst}`}
                ref={liveListScrollRef}
                events={orderedLive}
                selectedLinearIndex={selectedLiveLinearIndex}
                onSelectLinearIndex={setSelectedLiveLinearIndex}
              />
            )}
          </div>
          {selectedLiveEvent && (
            <div className="rounded-md border border-blue-200 bg-blue-50/40 p-3 text-xs text-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-gray-900">Selected event</span>
                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedLiveLinearIndex(null)}>
                  Close
                </Button>
              </div>
              {selectedLiveEvent.detail?.trim() ? (
                <div className="mt-2">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-gray-700">Detail</p>
                    <CopyAction
                      textToCopy={selectedLiveEvent.detail}
                      successMessage="Detail text copied to clipboard."
                      label="Copy detail"
                      copiedLabel="Copied"
                      buttonProps={{ variant: 'outline', size: 'sm', className: 'h-8 shrink-0 text-xs' }}
                      {...COPY_ACTION_PRESETS.compactSettingsLongCopy}
                    />
                  </div>
                  <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded border border-gray-200 bg-white p-2 font-sans text-gray-800">
                    {selectedLiveEvent.detail}
                  </pre>
                </div>
              ) : null}
              <div className={selectedLiveEvent.detail?.trim() ? 'mt-3' : 'mt-2'}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-gray-700">Full payload (JSON)</p>
                  <CopyAction
                    textToCopy={selectedLiveEventJson}
                    successMessage="Event JSON copied to clipboard."
                    label="Copy JSON"
                    copiedLabel="Copied"
                    buttonProps={{ variant: 'outline', size: 'sm', className: 'h-8 shrink-0 text-xs' }}
                    {...COPY_ACTION_PRESETS.compactSettingsLongCopy}
                  />
                </div>
                <pre className="max-h-48 overflow-auto rounded border border-gray-200 bg-white p-2 font-mono text-[11px] leading-relaxed text-gray-800">
                  {selectedLiveEventJson}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3">
          <p className="text-sm font-medium text-gray-800">Retention</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-600" htmlFor="telemetry-prune-max">
                Max live history (prune)
              </label>
              <Input
                id="telemetry-prune-max"
                className="h-9 w-24"
                type="number"
                min={0}
                max={500}
                value={pruneMax}
                onChange={(e) => setPruneMax(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || pruneMutation.isPending}
              onClick={handlePruneLive}
            >
              {pruneMutation.isPending ? 'Applying…' : 'Prune live ops'}
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-gray-600" htmlFor="telemetry-keep-archives">
                Keep last N archives
              </label>
              <Input
                id="telemetry-keep-archives"
                className="h-9 w-24"
                type="number"
                min={1}
                max={50}
                placeholder="1–50"
                value={keepLastArchives}
                onChange={(e) => setKeepLastArchives(e.target.value)}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || pruneMutation.isPending}
              onClick={handleKeepLastArchives}
            >
              Trim archives
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">Snapshot current live ops</p>
          <div className="flex flex-wrap items-end gap-2">
            <Input
              className="h-9 max-w-xs"
              placeholder="Archive label (optional)"
              value={archiveLabel}
              onChange={(e) => setArchiveLabel(e.target.value)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || archiveMutation.isPending}
              onClick={() => archiveMutation.mutate({ siteId, label: archiveLabel.trim() || undefined })}
            >
              {archiveMutation.isPending ? 'Archiving…' : 'Archive now'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-800">Clear live ops</p>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={clearArchiveBefore}
              onChange={(e) => setClearArchiveBefore(e.target.checked)}
            />
            Archive live ops before clear
          </label>
          {clearArchiveBefore && (
            <Input
              className="h-9 max-w-xs"
              placeholder="Pre-clear archive label"
              value={clearArchiveLabel}
              onChange={(e) => setClearArchiveLabel(e.target.value)}
            />
          )}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={disabled || clearMutation.isPending}
            onClick={() =>
              clearMutation.mutate({
                siteId,
                archiveBeforeClear: clearArchiveBefore,
                archiveLabel: clearArchiveBefore ? clearArchiveLabel.trim() || undefined : undefined,
              })
            }
          >
            {clearMutation.isPending ? 'Clearing…' : 'Clear live telemetry'}
          </Button>
        </div>

        <div className="space-y-3 border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-800">Archives ({archives.length} stored)</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Input
              placeholder="Filter by label"
              value={archiveLabelFilter}
              onChange={(e) => setArchiveLabelFilter(e.target.value)}
            />
            <Input type="date" value={archiveFrom} onChange={(e) => setArchiveFrom(e.target.value)} />
            <Input type="date" value={archiveTo} onChange={(e) => setArchiveTo(e.target.value)} />
          </div>
          <p className="text-xs text-gray-500">
            Filtered: {filteredArchiveEntries.length} — page {archiveDisplayPage + 1} of {archivePageLabelTotal} (
            {ARCHIVE_PAGE_SIZE} per page)
          </p>

          {filteredArchiveEntries.length === 0 ? (
            <p className="text-sm text-gray-500">No archives match the current filters.</p>
          ) : (
            <ul className="space-y-2">
              {pagedArchives.map(({ entry, originalIndex }) => (
                <li
                  key={`${originalIndex}-${entry.archivedAt}`}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white p-2 text-sm"
                >
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="telemetry-archive"
                      checked={selectedArchiveIndex === originalIndex}
                      onChange={() => setSelectedArchiveIndex(originalIndex)}
                    />
                    <span className="font-medium">{entry.label}</span>
                    <span className="text-xs text-gray-500">
                      #{originalIndex} · {entry.count} events · {new Date(entry.archivedAt).toLocaleString()}
                    </span>
                  </label>
                  <Button type="button" size="sm" variant="outline" onClick={() => exportArchiveJson(originalIndex)}>
                    Export JSON
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {filteredArchiveEntries.length > ARCHIVE_PAGE_SIZE && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={archiveDisplayPage <= 0}
                onClick={() => setArchivePage(Math.max(0, archiveDisplayPage - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={archiveDisplayPage >= archiveMaxPage}
                onClick={() => setArchivePage(Math.min(archiveMaxPage, archiveDisplayPage + 1))}
              >
                Next
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || selectedArchiveIndex === null}
              onClick={() => selectedArchiveIndex !== null && exportArchiveJson(selectedArchiveIndex)}
            >
              Export selected
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled || pruneMutation.isPending || selectedArchiveIndex === null}
              onClick={handleDeleteSelectedArchive}
            >
              Delete selected archive
            </Button>
          </div>
        </div>

        {(archiveMutation.isError || pruneMutation.isError || clearMutation.isError) && (
          <p className="text-sm text-red-600">
            {(archiveMutation.error || pruneMutation.error || clearMutation.error) instanceof Error
              ? (archiveMutation.error || pruneMutation.error || clearMutation.error)?.message
              : 'Request failed'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
