'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { EmailCampaignList } from '@/components/marketing/EmailCampaignList'

const HISTORY_CHANNEL_OPTIONS = [
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'FACEBOOK',
  'INSTAGRAM',
  'TWITTER',
  'LINKEDIN',
  'YOUTUBE',
] as const

const HISTORY_STATUS_OPTIONS = ['DRAFT', 'SCHEDULED', 'SENT', 'PUBLISHED', 'FAILED'] as const
const HISTORY_SORT_OPTIONS = [
  { id: 'created_desc', label: 'Created (newest first)' },
  { id: 'created_asc', label: 'Created (oldest first)' },
] as const

type SocialHistoryPost = {
  id: string
  channel: string
  status: string
  createdAt: string
  scheduledFor: string | null
}

type RetryEvent = {
  id: string
  atIso: string
  changedBy?: string
  changedByLabel?: string
}

type FailureAnalyticsResponse = {
  windowDays: number
  totalFailed: number
  since: string
  topCategories: Array<{ category: string; label: string; count: number }>
  topReasons: Array<{ reason: string; count: number }>
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function escapeCsv(value: unknown): string {
  const raw = String(value ?? '')
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

function buildExportMetadataRows(params: {
  channelFilter: string
  statusFilter: string
  fromDate: string
  toDate: string
  sortBy: 'created_desc' | 'created_asc'
  page: number
  pageSize: number
  rowsOnPage: number
}): string[][] {
  return [
    ['meta', 'exportedAt', new Date().toISOString()],
    ['meta', 'channelFilter', params.channelFilter || 'ALL'],
    ['meta', 'statusFilter', params.statusFilter || 'ALL'],
    ['meta', 'fromDate', params.fromDate || ''],
    ['meta', 'toDate', params.toDate || ''],
    ['meta', 'sort', params.sortBy],
    ['meta', 'page', String(params.page)],
    ['meta', 'pageSize', String(params.pageSize)],
    ['meta', 'rowsOnPage', String(params.rowsOnPage)],
  ]
}

export function MarketingHistoryPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tenantId = params?.tenantId as string
  const [socialPosts, setSocialPosts] = useState<SocialHistoryPost[]>([])
  const [socialLoading, setSocialLoading] = useState(true)
  const [socialError, setSocialError] = useState<string | null>(null)
  const [channelFilter, setChannelFilter] = useState<'ALL' | string>(
    () => (searchParams.get('channel') || 'ALL').toUpperCase()
  )
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>(
    () => (searchParams.get('status') || 'ALL').toUpperCase()
  )
  const [fromDate, setFromDate] = useState(() => searchParams.get('from') || '')
  const [toDate, setToDate] = useState(() => searchParams.get('to') || '')
  const [refreshTick, setRefreshTick] = useState(0)
  const [page, setPage] = useState(() => {
    const raw = Number(searchParams.get('page') || '1')
    return Number.isFinite(raw) ? Math.max(Math.trunc(raw), 1) : 1
  })
  const [pageSize, setPageSize] = useState(() => {
    const raw = Number(searchParams.get('pageSize') || '20')
    if (!Number.isFinite(raw)) return 20
    const normalized = Math.max(Math.trunc(raw), 1)
    if (normalized <= 10) return 10
    if (normalized <= 20) return 20
    return 50
  })
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc'>(
    () => (searchParams.get('sort') === 'created_asc' ? 'created_asc' : 'created_desc')
  )
  const [socialTotal, setSocialTotal] = useState(0)
  const [retryingById, setRetryingById] = useState<Record<string, boolean>>({})
  const [bulkRetrying, setBulkRetrying] = useState(false)
  const [selectedFailedIds, setSelectedFailedIds] = useState<string[]>([])
  const [retryNotice, setRetryNotice] = useState<string | null>(null)
  const [recentRetries, setRecentRetries] = useState<RetryEvent[]>([])
  const [copiedLink, setCopiedLink] = useState(false)
  const [failureWindowDays, setFailureWindowDays] = useState<7 | 30>(7)
  const [failureLoading, setFailureLoading] = useState(false)
  const [failureError, setFailureError] = useState<string | null>(null)
  const [failureAnalytics, setFailureAnalytics] = useState<FailureAnalyticsResponse | null>(null)
  const lastSyncedQueryRef = useRef<string>('')
  const dateRangeError =
    fromDate && toDate && new Date(`${fromDate}T00:00:00`).getTime() > new Date(`${toDate}T23:59:59`).getTime()
      ? 'From date must be earlier than or equal to To date.'
      : null

  useEffect(() => {
    const query = new URLSearchParams()
    if (channelFilter !== 'ALL') query.set('channel', channelFilter)
    if (statusFilter !== 'ALL') query.set('status', statusFilter)
    if (fromDate) query.set('from', fromDate)
    if (toDate) query.set('to', toDate)
    if (page > 1) query.set('page', String(page))
    if (pageSize !== 20) query.set('pageSize', String(pageSize))
    if (sortBy !== 'created_desc') query.set('sort', sortBy)
    const nextQuery = query.toString()
    if (nextQuery === lastSyncedQueryRef.current) return
    lastSyncedQueryRef.current = nextQuery
    const href = nextQuery ? `${pathname}?${nextQuery}` : pathname
    router.replace(href, { scroll: false })
  }, [channelFilter, statusFilter, fromDate, toDate, page, pageSize, sortBy, pathname, router])

  useEffect(() => {
    let cancelled = false
    const loadRecentRetries = async () => {
      try {
        const res = await fetch('/api/social/posts/retries?limit=3')
        if (!res.ok) return
        const data = (await res.json().catch(() => ({}))) as { events?: RetryEvent[] }
        if (!cancelled) setRecentRetries(Array.isArray(data.events) ? data.events : [])
      } catch {
        if (!cancelled) setRecentRetries([])
      }
    }
    void loadRecentRetries()
    return () => {
      cancelled = true
    }
  }, [refreshTick])

  useEffect(() => {
    let cancelled = false
    const loadFailureAnalytics = async () => {
      try {
        setFailureLoading(true)
        setFailureError(null)
        const search = new URLSearchParams()
        search.set('days', String(failureWindowDays))
        if (channelFilter !== 'ALL') search.set('channel', channelFilter)
        const res = await fetch(`/api/social/posts/failure-analytics?${search.toString()}`)
        const data = (await res.json().catch(() => ({}))) as FailureAnalyticsResponse & {
          error?: string
        }
        if (!res.ok) {
          if (!cancelled) {
            setFailureError(data.error || 'Failed to load failure analytics.')
            setFailureAnalytics(null)
          }
          return
        }
        if (!cancelled) setFailureAnalytics(data)
      } catch {
        if (!cancelled) {
          setFailureError('Failed to load failure analytics.')
          setFailureAnalytics(null)
        }
      } finally {
        if (!cancelled) setFailureLoading(false)
      }
    }
    void loadFailureAnalytics()
    return () => {
      cancelled = true
    }
  }, [failureWindowDays, channelFilter, refreshTick])

  useEffect(() => {
    let cancelled = false
    const loadSocialHistory = async () => {
      try {
        setSocialLoading(true)
        setSocialError(null)
        const search = new URLSearchParams()
        search.set('limit', String(pageSize))
        search.set('offset', String((page - 1) * pageSize))
        if (channelFilter !== 'ALL') search.set('channel', channelFilter)
        if (statusFilter !== 'ALL') search.set('status', statusFilter)
        if (fromDate && !dateRangeError) search.set('from', fromDate)
        if (toDate && !dateRangeError) search.set('to', toDate)
        search.set('sort', sortBy)
        const res = await fetch(`/api/social/posts?${search.toString()}`)
        if (!res.ok) {
          throw new Error(`Failed to load social history (${res.status})`)
        }
        const data = (await res.json()) as { posts?: SocialHistoryPost[]; total?: number }
        if (!cancelled) {
          setSocialPosts(Array.isArray(data.posts) ? data.posts : [])
          setSocialTotal(typeof data.total === 'number' ? data.total : 0)
        }
      } catch (error) {
        if (!cancelled) {
          setSocialPosts([])
          setSocialTotal(0)
          setSocialError(error instanceof Error ? error.message : 'Failed to load social history')
        }
      } finally {
        if (!cancelled) setSocialLoading(false)
      }
    }
    loadSocialHistory()
    return () => {
      cancelled = true
    }
  }, [channelFilter, statusFilter, fromDate, toDate, sortBy, dateRangeError, refreshTick, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [channelFilter, statusFilter, fromDate, toDate, pageSize, sortBy])

  const getStatusBadgeClass = (status: string) => {
    const normalized = status.toUpperCase()
    if (normalized === 'SENT' || normalized === 'PUBLISHED') {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    }
    if (normalized === 'FAILED') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    }
    if (normalized === 'SCHEDULED') {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const totalPages = Math.max(1, Math.ceil(socialTotal / pageSize))
  const startRow = socialTotal === 0 ? 0 : (page - 1) * pageSize + 1
  const endRow = socialTotal === 0 ? 0 : Math.min(page * pageSize, socialTotal)
  const hasActiveFilters = channelFilter !== 'ALL' || statusFilter !== 'ALL' || Boolean(fromDate) || Boolean(toDate)
  const applyPreset = (daysBack: 0 | 7 | 30) => {
    const end = new Date()
    const start = new Date()
    if (daysBack > 0) {
      start.setDate(end.getDate() - (daysBack - 1))
    }
    setFromDate(toDateInputValue(start))
    setToDate(toDateInputValue(end))
    setPage(1)
  }
  const exportCurrentViewCsv = () => {
    if (socialPosts.length === 0) return
    const metadataRows = buildExportMetadataRows({
      channelFilter,
      statusFilter,
      fromDate,
      toDate,
      sortBy,
      page,
      pageSize,
      rowsOnPage: socialPosts.length,
    })
    const header = ['postId', 'channel', 'status', 'createdAt', 'scheduledFor']
    const rows = socialPosts.map((post) => [
      post.id,
      post.channel,
      post.status,
      new Date(post.createdAt).toISOString(),
      post.scheduledFor ? new Date(post.scheduledFor).toISOString() : '',
    ])
    const csv = [...metadataRows, [], header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    a.download = `marketing-history-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  const exportFilteredCsv = () => {
    const search = new URLSearchParams()
    if (channelFilter !== 'ALL') search.set('channel', channelFilter)
    if (statusFilter !== 'ALL') search.set('status', statusFilter)
    if (fromDate) search.set('from', fromDate)
    if (toDate) search.set('to', toDate)
    search.set('sort', sortBy)
    search.set('maxRows', '5000')
    const href = `/api/social/posts/export?${search.toString()}`
    window.open(href, '_blank', 'noopener,noreferrer')
  }
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      window.setTimeout(() => setCopiedLink(false), 1500)
    } catch {
      setSocialError('Failed to copy share link.')
    }
  }

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])
  useEffect(() => {
    const visibleFailed = new Set(
      socialPosts.filter((p) => p.status.toUpperCase() === 'FAILED').map((p) => p.id)
    )
    setSelectedFailedIds((prev) => prev.filter((id) => visibleFailed.has(id)))
  }, [socialPosts])

  const failedRowsOnPage = socialPosts.filter((p) => p.status.toUpperCase() === 'FAILED')
  const allFailedRowsOnPageSelected =
    failedRowsOnPage.length > 0 &&
    failedRowsOnPage.every((p) => selectedFailedIds.includes(p.id))

  const handleBulkRetry = async () => {
    if (selectedFailedIds.length === 0) return
    setBulkRetrying(true)
    setSocialError(null)
    setRetryNotice(null)
    try {
      const res = await fetch('/api/social/posts/retry-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedFailedIds }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        retriedCount?: number
        skippedCount?: number
      }
      if (!res.ok) {
        setSocialError(data.error || 'Failed to bulk retry posts.')
        return
      }
      setRetryNotice(
        `Bulk retry queued ${data.retriedCount || 0} post(s)` +
          ((data.skippedCount || 0) > 0 ? `; skipped ${data.skippedCount}.` : '.')
      )
      setSelectedFailedIds([])
      if (statusFilter.toUpperCase() === 'FAILED') {
        setStatusFilter('ALL')
      }
      setRefreshTick((v) => v + 1)
    } catch {
      setSocialError('Failed to bulk retry posts.')
    } finally {
      setBulkRetrying(false)
    }
  }
  const handleRetryFilteredFailed = async () => {
    if (dateRangeError) return
    setBulkRetrying(true)
    setSocialError(null)
    setRetryNotice(null)
    try {
      const res = await fetch('/api/social/posts/retry-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'filtered_failed',
          filters: {
            channel: channelFilter !== 'ALL' ? channelFilter : undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
          },
          maxRows: 500,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        retriedCount?: number
        skippedCount?: number
      }
      if (!res.ok) {
        setSocialError(data.error || 'Failed to retry filtered failed posts.')
        return
      }
      setRetryNotice(
        `Filtered retry queued ${data.retriedCount || 0} failed post(s)` +
          ((data.skippedCount || 0) > 0 ? `; skipped ${data.skippedCount}.` : '.')
      )
      setSelectedFailedIds([])
      if (statusFilter.toUpperCase() === 'FAILED') {
        setStatusFilter('ALL')
      }
      setRefreshTick((v) => v + 1)
    } catch {
      setSocialError('Failed to retry filtered failed posts.')
    } finally {
      setBulkRetrying(false)
    }
  }
  const handleRetryPost = async (id: string) => {
    const postId = id.trim()
    if (!postId) return
    setRetryingById((prev) => ({ ...prev, [postId]: true }))
    setSocialError(null)
    setRetryNotice(null)
    try {
      const res = await fetch(`/api/social/posts/${encodeURIComponent(postId)}/retry`, {
        method: 'POST',
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setSocialError(data.error || 'Failed to retry post.')
        return
      }
      if (statusFilter.toUpperCase() === 'FAILED') {
        setStatusFilter('ALL')
      }
      setRetryNotice(`Post ${postId} re-queued. Status will move from FAILED to SCHEDULED shortly.`)
      setRefreshTick((v) => v + 1)
    } catch {
      setSocialError('Failed to retry post.')
    } finally {
      setRetryingById((prev) => ({ ...prev, [postId]: false }))
    }
  }

  return (
    <section className="flex-1 space-y-5">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">History</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Review campaign outcomes and recent social dispatch activity in one place.
      </p>
      <div className="space-y-5">
        <EmailCampaignList organizationId={tenantId} />
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 shadow">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Social Posts</h2>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                Showing {startRow}-{endRow} of {socialTotal} matched posts
              </span>
              <button
                type="button"
                onClick={() => void copyShareLink()}
                className="rounded border border-slate-300 dark:border-slate-600 px-2 py-0.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {copiedLink ? 'Link copied' : 'Copy share link'}
              </button>
            </div>
            {retryNotice ? (
              <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                {retryNotice}
              </div>
            ) : null}
            {recentRetries.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Recent retries:</span>
                {recentRetries.map((event) => (
                  <Link
                    key={`${event.id}-${event.atIso}`}
                    href={`/marketing/${tenantId}/Studio?auditPostId=${encodeURIComponent(event.id)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-slate-700 dark:text-slate-200"
                    title={`${new Date(event.atIso).toLocaleString()}${event.changedByLabel ? ` • by ${event.changedByLabel}` : event.changedBy ? ` • by ${event.changedBy}` : ''}`}
                  >
                    <span className="font-mono">{event.id.slice(0, 8)}</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {new Date(event.atIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {event.changedByLabel || event.changedBy ? (
                      <span className="text-slate-500 dark:text-slate-400">
                        by {event.changedByLabel || event.changedBy}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  Top failure reasons
                </p>
                <div className="inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-600 p-0.5">
                  <button
                    type="button"
                    onClick={() => setFailureWindowDays(7)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      failureWindowDays === 7
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    7d
                  </button>
                  <button
                    type="button"
                    onClick={() => setFailureWindowDays(30)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      failureWindowDays === 30
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    30d
                  </button>
                </div>
              </div>
              {failureLoading ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading failure analytics...</p>
              ) : failureError ? (
                <p className="text-xs text-rose-700 dark:text-rose-300">{failureError}</p>
              ) : !failureAnalytics || failureAnalytics.totalFailed === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No failed social posts in the selected window.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {failureAnalytics.totalFailed} failed post(s) in the last {failureAnalytics.windowDays} days
                    {channelFilter !== 'ALL' ? ` for ${channelFilter}` : ''}.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {failureAnalytics.topCategories.map((row) => (
                      <span
                        key={row.category}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-200"
                      >
                        <span>{row.label}</span>
                        <span className="font-semibold">{row.count}</span>
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {failureAnalytics.topReasons.map((row) => (
                      <p key={row.reason} className="text-xs text-slate-600 dark:text-slate-300">
                        {row.count}x - {row.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-9 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-sm"
              >
                <option value="ALL">All channels</option>
                {HISTORY_CHANNEL_OPTIONS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                {HISTORY_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-sm"
                aria-label="From date"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-sm"
                aria-label="To date"
              />
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setRefreshTick((v) => v + 1)
                }}
                className="h-9 rounded border border-slate-300 dark:border-slate-600 px-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={exportCurrentViewCsv}
                disabled={socialPosts.length === 0}
                className="h-9 rounded border border-slate-300 dark:border-slate-600 px-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Export page CSV
              </button>
              <button
                type="button"
                onClick={exportFilteredCsv}
                disabled={dateRangeError != null}
                className="h-9 rounded border border-slate-300 dark:border-slate-600 px-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                title="Export full filtered result set (up to 5000 rows)"
              >
                Export filtered CSV
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_desc' | 'created_asc')}
                className="h-8 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-xs"
              >
                {HISTORY_SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allFailedRowsOnPageSelected}
                  onChange={(e) => {
                    const checked = e.target.checked
                    if (checked) {
                      setSelectedFailedIds((prev) =>
                        Array.from(new Set([...prev, ...failedRowsOnPage.map((p) => p.id)]))
                      )
                    } else {
                      const pageIds = new Set(failedRowsOnPage.map((p) => p.id))
                      setSelectedFailedIds((prev) => prev.filter((id) => !pageIds.has(id)))
                    }
                  }}
                />
                Select all failed on page
              </label>
              <button
                type="button"
                onClick={() => void handleBulkRetry()}
                disabled={selectedFailedIds.length === 0 || bulkRetrying}
                className="rounded border border-amber-300 dark:border-amber-700 px-2 py-0.5 font-medium text-amber-800 dark:text-amber-200 disabled:opacity-50"
              >
                {bulkRetrying ? 'Retrying selected…' : `Retry selected (${selectedFailedIds.length})`}
              </button>
              <button
                type="button"
                onClick={() => void handleRetryFilteredFailed()}
                disabled={bulkRetrying || dateRangeError != null}
                className="rounded border border-red-300 dark:border-red-700 px-2 py-0.5 font-medium text-red-800 dark:text-red-200 disabled:opacity-50"
                title="Retries up to 500 FAILED posts in the current channel/date filter."
              >
                {bulkRetrying ? 'Retrying filtered…' : 'Retry all failed (filtered)'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Quick range:</span>
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPreset(7)}
                className="rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Last 7 days
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="rounded-full border border-slate-300 dark:border-slate-600 px-2 py-0.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Last 30 days
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              {dateRangeError ? (
                <p className="text-xs text-red-600 dark:text-red-300">{dateRangeError}</p>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Tip: copy URL to share this exact filter view.
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setChannelFilter('ALL')
                  setStatusFilter('ALL')
                  setFromDate('')
                  setToDate('')
                  setPage(1)
                  setPageSize(20)
                  setSortBy('created_desc')
                  setRefreshTick((v) => v + 1)
                }}
                className="text-xs font-medium text-slate-600 hover:underline dark:text-slate-300"
              >
                Clear filters
              </button>
            </div>
          </div>
          {socialLoading ? (
            <div className="p-4 text-sm text-slate-500 dark:text-slate-300">Loading social history...</div>
          ) : socialError ? (
            <div className="p-4 text-sm text-red-600 dark:text-red-300">{socialError}</div>
          ) : socialPosts.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 dark:text-slate-300">
              {hasActiveFilters
                ? 'No social posts match the current filters. Adjust filters or clear them to view more results.'
                : 'No social posts found yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                    <th className="p-4">Select</th>
                    <th className="p-4">Post ID</th>
                    <th className="p-4">Channel</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created</th>
                    <th className="p-4">Scheduled</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {socialPosts.map((post) => (
                    <tr key={post.id} className="border-b border-slate-100 dark:border-slate-700/60">
                      <td className="p-4">
                        {post.status.toUpperCase() === 'FAILED' ? (
                          <input
                            type="checkbox"
                            checked={selectedFailedIds.includes(post.id)}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setSelectedFailedIds((prev) =>
                                checked
                                  ? prev.includes(post.id)
                                    ? prev
                                    : [...prev, post.id]
                                  : prev.filter((id) => id !== post.id)
                              )
                            }}
                          />
                        ) : null}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-200">{post.id}</td>
                      <td className="p-4">{post.channel}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {new Date(post.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/marketing/${tenantId}/Studio?auditPostId=${encodeURIComponent(post.id)}`}
                            className="text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                          >
                            Open audit
                          </Link>
                          {post.status.toUpperCase() === 'FAILED' ? (
                            <button
                              type="button"
                              onClick={() => void handleRetryPost(post.id)}
                              disabled={Boolean(retryingById[post.id])}
                              className="text-xs font-medium text-amber-700 hover:underline disabled:opacity-60 dark:text-amber-400"
                            >
                              {retryingById[post.id] ? 'Retrying…' : 'Retry'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value) || 20)}
                    className="h-7 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-1"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span>
                    Page {Math.min(page, totalPages)} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded border border-slate-300 dark:border-slate-600 px-2 py-1 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
