'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface ActivationPreview {
  destination: 'crm' | 'marketing' | 'sequence'
  accountCount: number
  contactCount: number
  options: {
    createTasks?: boolean
    assignOwner?: boolean
    startSequence?: boolean
    skipDuplicates?: boolean
  }
  warnings: string[]
}

interface ActivationSetItem {
  id: string
  createdAt: string
  payload?: {
    setName?: string
    setNote?: string
    setTag?: string
    archivedAt?: string
    accountIds?: string[]
    contactIds?: string[]
    accountCount?: number
    contactCount?: number
    savedAt?: string
  }
}

interface ActivationSetListResponse {
  items: ActivationSetItem[]
  total: number
  page: number
  pageSize: number
  sort: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'archived_first'
}

interface BulkReportHistoryItem {
  id: string
  reportId: string
  createdAt: string
  action: string
  total: number
  processed: number
  succeeded: number
  failed: number
}

interface BulkRetentionSettings {
  keepLast: number
  maxAgeDays: number
}

interface BulkSchedulerStatus {
  scheduler?: {
    hasActiveLock?: boolean
    lock?: Record<string, unknown> | null
    status?: Record<string, unknown> | null
    health?: {
      ok?: boolean
      severity?: 'healthy' | 'warning' | 'critical'
      reasons?: string[]
      metrics?: {
        consecutiveSkipped?: number
      }
    }
  }
  latestRetentionLog?: {
    action?: string
    reason?: string | null
    performedAt?: string
    performedBy?: string
  } | null
  latestBulkReport?: {
    entityId?: string
    createdAt?: string
  } | null
}

interface BulkRetentionPreview {
  totalReports: number
  wouldDelete: number
  keepLastApplied: number
  maxAgeDaysApplied: number
  cutoffIso: string
}

async function fetchActivationSets(
  tenantId: string,
  q = '',
  includeArchived = false,
  page = 1,
  pageSize = 10,
  sort: 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'archived_first' = 'newest',
): Promise<ActivationSetListResponse> {
  const query = new URLSearchParams()
  query.set('tenantId', tenantId)
  if (q.trim()) query.set('q', q.trim())
  if (includeArchived) query.set('includeArchived', '1')
  query.set('page', String(page))
  query.set('pageSize', String(pageSize))
  query.set('sort', sort)
  const response = await fetch(`/api/activation/sets?${query.toString()}`)
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error ?? 'Failed to load activation sets')
  return {
    items: Array.isArray(data.items) ? (data.items as ActivationSetItem[]) : [],
    total: Number(data.total ?? 0),
    page: Number(data.page ?? page),
    pageSize: Number(data.pageSize ?? pageSize),
    sort: (data.sort as ActivationSetListResponse['sort']) ?? sort,
  }
}

export function ActivationReviewClient() {
  const searchParams = useSearchParams()
  const [tenantId, setTenantId] = useState('')
  const [accountIdsRaw, setAccountIdsRaw] = useState('')
  const [contactIdsRaw, setContactIdsRaw] = useState('')
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [createTasks, setCreateTasks] = useState(true)
  const [assignOwner, setAssignOwner] = useState(true)
  const [ownerUserId, setOwnerUserId] = useState('')
  const [setName, setSetName] = useState('')
  const [setNote, setSetNote] = useState('')
  const [setTag, setSetTag] = useState('')
  const [preview, setPreview] = useState<ActivationPreview | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | null>(null)
  const [jobSummary, setJobSummary] = useState<Record<string, unknown> | null>(null)
  const [savedSets, setSavedSets] = useState<ActivationSetItem[]>([])
  const [setsTotal, setSetsTotal] = useState(0)
  const [setsPage, setSetsPage] = useState(1)
  const [setsPageSize] = useState(10)
  const [setSort, setSetSort] = useState<ActivationSetListResponse['sort']>('newest')
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([])
  const [setsLoading, setSetsLoading] = useState(false)
  const [setSearch, setSetSearch] = useState('')
  const [includeArchivedSets, setIncludeArchivedSets] = useState(false)
  const [isSavingSet, setIsSavingSet] = useState(false)
  const [saveSetMessage, setSaveSetMessage] = useState<string | null>(null)
  const [isExportingBulkReport, setIsExportingBulkReport] = useState(false)
  const [bulkReportHistory, setBulkReportHistory] = useState<BulkReportHistoryItem[]>([])
  const [bulkReportHistoryLoading, setBulkReportHistoryLoading] = useState(false)
  const [retentionSettings, setRetentionSettings] = useState<BulkRetentionSettings>({ keepLast: 50, maxAgeDays: 90 })
  const [retentionLoading, setRetentionLoading] = useState(false)
  const [retentionApplyNow, setRetentionApplyNow] = useState(false)
  const [retentionPreview, setRetentionPreview] = useState<BulkRetentionPreview | null>(null)
  const [schedulerStatus, setSchedulerStatus] = useState<BulkSchedulerStatus | null>(null)
  const [schedulerStatusLoading, setSchedulerStatusLoading] = useState(false)
  const [confirmState, setConfirmState] = useState<{
    open: boolean
    item: ActivationSetItem | null
    action: 'archive' | 'delete' | null
  }>({ open: false, item: null, action: null })
  const [undoState, setUndoState] = useState<{
    message: string
    undoAction: (() => Promise<void>) | null
    expiresAt: number
  } | null>(null)
  const [bulkProgress, setBulkProgress] = useState<{
    active: boolean
    action: 'duplicate' | 'archive' | 'delete' | null
    total: number
    processed: number
    succeeded: number
    failed: number
    failures: string[]
  }>({
    active: false,
    action: null,
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    failures: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function reloadBulkReportHistory() {
    if (!tenantId) {
      setBulkReportHistory([])
      return
    }
    setBulkReportHistoryLoading(true)
    try {
      const response = await fetch(`/api/activation/bulk-reports?tenantId=${encodeURIComponent(tenantId)}&limit=20`)
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to load bulk report history')
      setBulkReportHistory(Array.isArray(data.items) ? (data.items as BulkReportHistoryItem[]) : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bulk report history')
    } finally {
      setBulkReportHistoryLoading(false)
    }
  }

  async function reloadRetentionSettings() {
    if (!tenantId) return
    setRetentionLoading(true)
    try {
      const response = await fetch(`/api/activation/bulk-reports/retention?tenantId=${encodeURIComponent(tenantId)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to load retention settings')
      const settings = (data.settings ?? {}) as Partial<BulkRetentionSettings>
      setRetentionSettings({
        keepLast: Number(settings.keepLast ?? 50),
        maxAgeDays: Number(settings.maxAgeDays ?? 90),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load retention settings')
    } finally {
      setRetentionLoading(false)
    }
  }

  async function reloadSchedulerStatus() {
    if (!tenantId) {
      setSchedulerStatus(null)
      return
    }
    setSchedulerStatusLoading(true)
    try {
      const response = await fetch(
        `/api/activation/bulk-reports/scheduler-status?tenantId=${encodeURIComponent(tenantId)}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to load scheduler status')
      setSchedulerStatus(data as BulkSchedulerStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduler status')
    } finally {
      setSchedulerStatusLoading(false)
    }
  }

  useEffect(() => {
    const initialTenantId = searchParams.get('tenantId')
    const initialAccountIds = searchParams.get('accountIds')
    const initialContactIds = searchParams.get('contactIds')

    if (initialTenantId) setTenantId(initialTenantId)
    if (initialAccountIds) setAccountIdsRaw(initialAccountIds)
    if (initialContactIds) setContactIdsRaw(initialContactIds)
  }, [searchParams])

  useEffect(() => {
    void reloadBulkReportHistory()
    void reloadRetentionSettings()
    void reloadSchedulerStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  async function reloadSets(options?: { keepLoading?: boolean }) {
    if (!tenantId) {
      setSavedSets([])
      setSetsTotal(0)
      return
    }
    if (options?.keepLoading !== false) setSetsLoading(true)
    try {
      const sets = await fetchActivationSets(tenantId, setSearch, includeArchivedSets, setsPage, setsPageSize, setSort)
      setSavedSets(sets.items)
      setSetsTotal(sets.total)
    } finally {
      if (options?.keepLoading !== false) setSetsLoading(false)
    }
  }

  useEffect(() => {
    if (!tenantId) {
      setSavedSets([])
      setSetsTotal(0)
      setSelectedSetIds([])
      return
    }
    let cancelled = false
    const loadSets = async () => {
      setSetsLoading(true)
      try {
        const sets = await fetchActivationSets(tenantId, setSearch, includeArchivedSets, setsPage, setsPageSize, setSort)
        if (cancelled) return
        setSavedSets(sets.items)
        setSetsTotal(sets.total)
      } finally {
        if (!cancelled) setSetsLoading(false)
      }
    }
    loadSets()
    return () => {
      cancelled = true
    }
  }, [tenantId, jobId, setSearch, includeArchivedSets, setsPage, setsPageSize, setSort])

  useEffect(() => {
    const visibleIds = new Set(savedSets.map((item) => item.id))
    setSelectedSetIds((prev) => prev.filter((id) => visibleIds.has(id)))
  }, [savedSets])

  useEffect(() => {
    const setId = searchParams.get('setId')
    const setTenantId = searchParams.get('tenantId')
    if (!setId || !setTenantId) return

    let cancelled = false
    const loadSet = async () => {
      try {
        const response = await fetch(`/api/activation/sets/${setId}?tenantId=${encodeURIComponent(setTenantId)}`)
        const data = await response.json()
        if (!response.ok || cancelled) return
        const payload = (data.payload ?? {}) as {
          setName?: string
          setNote?: string
          setTag?: string
          accountIds?: string[]
          contactIds?: string[]
          tenantId?: string
        }
        if (payload.tenantId) setTenantId(payload.tenantId)
        if (payload.setName) setSetName(payload.setName)
        if (payload.setNote) setSetNote(payload.setNote)
        if (payload.setTag) setSetTag(payload.setTag)
        if (Array.isArray(payload.accountIds)) setAccountIdsRaw(payload.accountIds.join(','))
        if (Array.isArray(payload.contactIds)) setContactIdsRaw(payload.contactIds.join(','))
      } catch {
        // Best effort hydration; keep direct query input untouched on errors.
      }
    }

    loadSet()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  const payload = useMemo(() => {
    const accountIds = accountIdsRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    const contactIds = contactIdsRaw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    return {
      orgId: tenantId,
      accountIds,
      contactIds,
      destination: 'crm' as const,
      options: {
        skipDuplicates,
        createTasks,
        assignOwner,
        ownerUserId: ownerUserId.trim() || undefined,
      },
    }
  }, [accountIdsRaw, assignOwner, contactIdsRaw, createTasks, ownerUserId, skipDuplicates, tenantId])

  useEffect(() => {
    if (!jobId || !tenantId) return
    let cancelled = false

    const poll = async () => {
      try {
        const response = await fetch(`/api/activation/jobs/${jobId}?tenantId=${encodeURIComponent(tenantId)}`)
        const data = await response.json()
        if (!response.ok || cancelled) return

        setJobStatus(data.status ?? null)
        setJobSummary((data.resultSummary as Record<string, unknown> | null) ?? null)

        if (data.status === 'COMPLETED' || data.status === 'FAILED') return
        setTimeout(poll, 1500)
      } catch {
        if (!cancelled) setTimeout(poll, 2000)
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [jobId, tenantId])

  async function runPreview() {
    setIsLoading(true)
    setError(null)
    setJobId(null)
    setJobStatus(null)
    setJobSummary(null)
    setSaveSetMessage(null)

    try {
      const response = await fetch('/api/activation/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to preview activation')
      }

      setPreview(data.preview ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected activation preview error')
    } finally {
      setIsLoading(false)
    }
  }

  async function confirmAndEnqueue() {
    setIsLoading(true)
    setError(null)
    setJobId(null)
    setJobStatus(null)
    setJobSummary(null)
    setSaveSetMessage(null)

    try {
      const response = await fetch('/api/activation/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, confirmEnqueue: true }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to enqueue activation')
      }

      setPreview(data.preview ?? null)
      setJobId(data.jobId ?? null)
      setJobStatus('RUNNING')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected activation enqueue error')
    } finally {
      setIsLoading(false)
    }
  }

  function loadSetIntoForm(item: ActivationSetItem) {
    const accountIds = item.payload?.accountIds ?? []
    const contactIds = item.payload?.contactIds ?? []
    setAccountIdsRaw(accountIds.join(','))
    setContactIdsRaw(contactIds.join(','))
    setSetName(item.payload?.setName ?? '')
    setSetNote(item.payload?.setNote ?? '')
    setSetTag(item.payload?.setTag ?? '')
    setPreview(null)
    setError(null)
    setSaveSetMessage(`Loaded activation set ${item.id}`)
  }

  function toggleSetSelection(setId: string) {
    setSelectedSetIds((prev) => (prev.includes(setId) ? prev.filter((id) => id !== setId) : [...prev, setId]))
  }

  function selectAllVisibleSets() {
    setSelectedSetIds(savedSets.map((item) => item.id))
  }

  function clearSelectedSets() {
    setSelectedSetIds([])
  }

  async function saveAsNewActivationSet() {
    if (!tenantId || payload.accountIds.length === 0) return
    setIsSavingSet(true)
    setSaveSetMessage(null)
    setError(null)
    try {
      const response = await fetch('/api/activation/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          setName,
          setNote,
          setTag,
          accountIds: payload.accountIds,
          contactIds: payload.contactIds,
          initiatedById: 'system',
          source: 'activation_review',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to save activation set')
      setSaveSetMessage(`Saved new activation set ${data.id}`)
      await reloadSets({ keepLoading: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save activation set')
    } finally {
      setIsSavingSet(false)
    }
  }

  async function applySetAction(item: ActivationSetItem, action: 'duplicate' | 'archive' | 'unarchive' | 'delete') {
    if (!tenantId) return
    setError(null)
    setSaveSetMessage(null)
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/activation/sets/${item.id}?tenantId=${encodeURIComponent(tenantId)}`, {
          method: 'DELETE',
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error ?? 'Failed to delete set')
        setSaveSetMessage(`Deleted activation set ${item.id}`)
      } else {
        const response = await fetch(`/api/activation/sets/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            action,
            initiatedById: 'system',
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error ?? 'Failed to update set')
        if (action === 'duplicate') {
          setSaveSetMessage(`Duplicated activation set to ${data.id}`)
        } else if (action === 'archive') {
          setSaveSetMessage(`Archived activation set ${item.id}`)
          setUndoState({
            message: `Archived ${item.payload?.setName ?? item.id}.`,
            undoAction: async () => {
              await applySetAction(item, 'unarchive')
            },
            expiresAt: Date.now() + 8000,
          })
        } else {
          setSaveSetMessage(`Unarchived activation set ${item.id}`)
        }
      }
      await reloadSets({ keepLoading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run set action'
      setError(message)
      throw new Error(message)
    }
  }

  async function runBulkAction(action: 'duplicate' | 'archive' | 'delete') {
    if (selectedSetIds.length === 0) return
    const selectedItems = savedSets.filter((item) => selectedSetIds.includes(item.id))
    if (selectedItems.length === 0) return

    setBulkProgress({
      active: true,
      action,
      total: selectedItems.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      failures: [],
    })
    setSaveSetMessage(null)

    if (action === 'archive') {
      for (const item of selectedItems) {
        try {
          if (!item.payload?.archivedAt) {
            await applySetAction(item, 'archive')
          }
          setBulkProgress((state) => ({
            ...state,
            processed: state.processed + 1,
            succeeded: state.succeeded + 1,
          }))
        } catch (error) {
          setBulkProgress((state) => ({
            ...state,
            processed: state.processed + 1,
            failed: state.failed + 1,
            failures: [...state.failures, `${item.id}: ${error instanceof Error ? error.message : 'archive failed'}`],
          }))
        }
      }
      setSaveSetMessage(`Archived ${selectedItems.length} selected sets`)
      setSelectedSetIds([])
      await reloadSets({ keepLoading: false })
      setBulkProgress((state) => ({ ...state, active: false }))
      return
    }

    if (action === 'duplicate') {
      for (const item of selectedItems) {
        try {
          await applySetAction(item, 'duplicate')
          setBulkProgress((state) => ({
            ...state,
            processed: state.processed + 1,
            succeeded: state.succeeded + 1,
          }))
        } catch (error) {
          setBulkProgress((state) => ({
            ...state,
            processed: state.processed + 1,
            failed: state.failed + 1,
            failures: [...state.failures, `${item.id}: ${error instanceof Error ? error.message : 'duplicate failed'}`],
          }))
        }
      }
      setSaveSetMessage(`Duplicated ${selectedItems.length} selected sets`)
      setSelectedSetIds([])
      await reloadSets({ keepLoading: false })
      setBulkProgress((state) => ({ ...state, active: false }))
      return
    }

    // delete
    const timeoutMs = 6000
    const timer = setTimeout(() => {
      void (async () => {
        for (const item of selectedItems) {
          try {
            await applySetAction(item, 'delete')
            setBulkProgress((state) => ({
              ...state,
              processed: state.processed + 1,
              succeeded: state.succeeded + 1,
            }))
          } catch (error) {
            setBulkProgress((state) => ({
              ...state,
              processed: state.processed + 1,
              failed: state.failed + 1,
              failures: [...state.failures, `${item.id}: ${error instanceof Error ? error.message : 'delete failed'}`],
            }))
          }
        }
        setSaveSetMessage(`Deleted ${selectedItems.length} selected sets`)
        setSelectedSetIds([])
        setBulkProgress((state) => ({ ...state, active: false }))
      })()
    }, timeoutMs)

    setUndoState({
      message: `Deleting ${selectedItems.length} selected sets in ${Math.floor(timeoutMs / 1000)}s.`,
      undoAction: async () => {
        clearTimeout(timer)
        setSaveSetMessage('Bulk delete cancelled')
        setBulkProgress((state) => ({ ...state, active: false }))
      },
      expiresAt: Date.now() + timeoutMs,
    })
  }

  function downloadTextFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  async function exportBulkReport() {
    if (!tenantId || bulkProgress.total === 0) return
    setIsExportingBulkReport(true)
    setError(null)
    try {
      const response = await fetch('/api/activation/bulk-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          action: bulkProgress.action,
          total: bulkProgress.total,
          processed: bulkProgress.processed,
          succeeded: bulkProgress.succeeded,
          failed: bulkProgress.failed,
          failures: bulkProgress.failures,
          generatedAt: new Date().toISOString(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to export bulk report')

      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      downloadTextFile(
        `${stamp}-lead-activation-bulk-report-${data.reportId}.json`,
        JSON.stringify({ reportId: data.reportId, ...data.json }, null, 2),
        'application/json',
      )
      downloadTextFile(
        `${stamp}-lead-activation-bulk-report-${data.reportId}.md`,
        String(data.markdown ?? ''),
        'text/markdown',
      )
      setSaveSetMessage(`Exported bulk report ${data.reportId}`)
      await reloadBulkReportHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export bulk report')
    } finally {
      setIsExportingBulkReport(false)
    }
  }

  async function downloadHistoricalBulkReport(reportId: string) {
    if (!tenantId) return
    setError(null)
    try {
      const response = await fetch(
        `/api/activation/bulk-reports/${encodeURIComponent(reportId)}?tenantId=${encodeURIComponent(tenantId)}`,
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to fetch bulk report')
      const stamp = new Date(data.createdAt ?? new Date().toISOString()).toISOString().replace(/[:.]/g, '-')
      downloadTextFile(
        `${stamp}-lead-activation-bulk-report-${data.reportId}.json`,
        JSON.stringify({ reportId: data.reportId, ...data.json }, null, 2),
        'application/json',
      )
      downloadTextFile(
        `${stamp}-lead-activation-bulk-report-${data.reportId}.md`,
        String(data.markdown ?? ''),
        'text/markdown',
      )
      setSaveSetMessage(`Downloaded report ${data.reportId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download historical report')
    }
  }

  async function saveRetentionSettings() {
    if (!tenantId) return
    setRetentionLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/activation/bulk-reports/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          keepLast: retentionSettings.keepLast,
          maxAgeDays: retentionSettings.maxAgeDays,
          applyNow: retentionApplyNow,
          performedBy: ownerUserId.trim() || 'system',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to save retention settings')
      setSaveSetMessage(
        retentionApplyNow
          ? `Retention applied. Deleted ${Number(data.deleted ?? 0)} old report records.`
          : 'Retention settings saved.',
      )
      setRetentionApplyNow(false)
      await reloadBulkReportHistory()
      setRetentionPreview(null)
      await reloadSchedulerStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save retention settings')
    } finally {
      setRetentionLoading(false)
    }
  }

  async function previewRetentionImpact() {
    if (!tenantId) return
    setRetentionLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/activation/bulk-reports/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          keepLast: retentionSettings.keepLast,
          maxAgeDays: retentionSettings.maxAgeDays,
          dryRun: true,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Failed to preview retention')
      setRetentionPreview((data.preview ?? null) as BulkRetentionPreview | null)
      setSaveSetMessage('Retention preview generated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview retention')
    } finally {
      setRetentionLoading(false)
    }
  }

  useEffect(() => {
    if (!undoState) return
    const remaining = undoState.expiresAt - Date.now()
    if (remaining <= 0) {
      setUndoState(null)
      return
    }
    const timer = setTimeout(() => setUndoState(null), remaining)
    return () => clearTimeout(timer)
  }, [undoState])

  function openConfirm(item: ActivationSetItem, action: 'archive' | 'delete') {
    setConfirmState({ open: true, item, action })
  }

  async function confirmAction() {
    if (!confirmState.item || !confirmState.action) return
    const { item, action } = confirmState
    setConfirmState({ open: false, item: null, action: null })
    if (action === 'archive') {
      await applySetAction(item, 'archive')
      return
    }

    const timeoutMs = 6000
    const executeDelete = async () => applySetAction(item, 'delete')
    const timer = setTimeout(() => {
      void executeDelete()
    }, timeoutMs)
    setUndoState({
      message: `Deleting ${item.payload?.setName ?? item.id} in ${Math.floor(timeoutMs / 1000)}s.`,
      undoAction: async () => {
        clearTimeout(timer)
        setSaveSetMessage(`Delete cancelled for ${item.payload?.setName ?? item.id}`)
      },
      expiresAt: Date.now() + timeoutMs,
    })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Activation Input</h2>
        <p className="mt-1 text-xs text-slate-600">
          Draft-first flow: preview runs guardrails first, then explicit enqueue executes CRM sync.
        </p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Tenant ID
            <input
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="tenantId"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Account IDs (comma-separated)
            <textarea
              value={accountIdsRaw}
              onChange={(event) => setAccountIdsRaw(event.target.value)}
              className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="acc_1, acc_2, acc_3"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Contact IDs (comma-separated, optional)
            <textarea
              value={contactIdsRaw}
              onChange={(event) => setContactIdsRaw(event.target.value)}
              className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="contact_1, contact_2"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Set Name
            <input
              value={setName}
              onChange={(event) => setSetName(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Mumbai logistics CFO batch - week 1"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Set Tag
            <input
              value={setTag}
              onChange={(event) => setSetTag(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="mumbai-logistics"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Set Note
            <textarea
              value={setNote}
              onChange={(event) => setSetNote(event.target.value)}
              className="min-h-16 rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Use this set for April outbound sequence with owner auto-assignment."
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={skipDuplicates} onChange={(event) => setSkipDuplicates(event.target.checked)} />
            Skip duplicate updates
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={createTasks} onChange={(event) => setCreateTasks(event.target.checked)} />
            Create follow-up tasks
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={assignOwner} onChange={(event) => setAssignOwner(event.target.checked)} />
            Assign owner automatically
          </label>
        </div>
        <label className="mt-3 grid gap-1 text-xs font-medium text-slate-700">
          Preferred owner user ID (optional)
          <input
            value={ownerUserId}
            onChange={(event) => setOwnerUserId(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="user_cuid"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={runPreview}
            disabled={isLoading || !payload.orgId || payload.accountIds.length === 0}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Preview Activation
          </button>
          <button
            type="button"
            onClick={confirmAndEnqueue}
            disabled={isLoading || !preview}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Confirm and Enqueue
          </button>
          <button
            type="button"
            onClick={saveAsNewActivationSet}
            disabled={isSavingSet || !tenantId || payload.accountIds.length === 0}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isSavingSet ? 'Saving set...' : 'Save as New Set'}
          </button>
        </div>
        {saveSetMessage ? <p className="mt-2 text-xs text-emerald-700">{saveSetMessage}</p> : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Bulk Reports History</h2>
        <p className="mt-1 text-xs text-slate-600">Previously exported bulk-run reports for this tenant.</p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-900">Scheduler Status</p>
            <button
              type="button"
              onClick={() => void reloadSchedulerStatus()}
              disabled={schedulerStatusLoading || !tenantId}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {schedulerStatusLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {!tenantId ? (
            <p className="mt-1 text-slate-500">Enter tenant ID to inspect scheduler status.</p>
          ) : schedulerStatus ? (
            <div className="mt-1 space-y-1">
              <p>
                Health: {String(schedulerStatus.scheduler?.health?.severity ?? 'unknown')}
                {schedulerStatus.scheduler?.health?.ok ? ' (ok)' : ' (attention)'}
              </p>
              {schedulerStatus.scheduler?.health?.reasons?.length ? (
                <p>Reasons: {schedulerStatus.scheduler.health.reasons.join(', ')}</p>
              ) : null}
              <p>Active lock: {schedulerStatus.scheduler?.hasActiveLock ? 'yes' : 'no'}</p>
              <p>Last state: {String(schedulerStatus.scheduler?.status?.state ?? 'unknown')}</p>
              <p>Last run at: {String(schedulerStatus.scheduler?.status?.updatedAt ?? '-')}</p>
              <p>Consecutive skips: {Number(schedulerStatus.scheduler?.health?.metrics?.consecutiveSkipped ?? 0)}</p>
              <p>
                Latest retention log: {schedulerStatus.latestRetentionLog?.action ?? '-'} at{' '}
                {schedulerStatus.latestRetentionLog?.performedAt ?? '-'}
              </p>
              <p>Latest report export: {schedulerStatus.latestBulkReport?.createdAt ?? '-'}</p>
            </div>
          ) : (
            <p className="mt-1 text-slate-500">No scheduler status available yet.</p>
          )}
        </div>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold text-slate-800">Retention Settings</p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs text-slate-700">
              Keep last N reports
              <input
                type="number"
                min={1}
                max={500}
                value={retentionSettings.keepLast}
                onChange={(event) =>
                  setRetentionSettings((prev) => ({ ...prev, keepLast: Number(event.target.value || 1) }))
                }
                className="w-32 rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
            </label>
            <label className="grid gap-1 text-xs text-slate-700">
              Max age (days)
              <input
                type="number"
                min={1}
                max={3650}
                value={retentionSettings.maxAgeDays}
                onChange={(event) =>
                  setRetentionSettings((prev) => ({ ...prev, maxAgeDays: Number(event.target.value || 1) }))
                }
                className="w-32 rounded-md border border-slate-300 px-2 py-1 text-xs"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={retentionApplyNow}
                onChange={(event) => setRetentionApplyNow(event.target.checked)}
              />
              Apply cleanup now
            </label>
            <button
              type="button"
              onClick={() => void previewRetentionImpact()}
              disabled={retentionLoading || !tenantId}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {retentionLoading ? 'Working...' : 'Preview Impact'}
            </button>
            <button
              type="button"
              onClick={() => void saveRetentionSettings()}
              disabled={retentionLoading || !tenantId}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {retentionLoading ? 'Saving...' : 'Save Retention'}
            </button>
          </div>
          {retentionPreview ? (
            <div className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700">
              <p className="font-medium text-slate-900">Dry-run preview</p>
              <p>Total reports: {retentionPreview.totalReports}</p>
              <p>Would delete: {retentionPreview.wouldDelete}</p>
              <p>Keep last: {retentionPreview.keepLastApplied}</p>
              <p>Max age days: {retentionPreview.maxAgeDaysApplied}</p>
              <p>Cutoff: {retentionPreview.cutoffIso}</p>
            </div>
          ) : null}
        </div>
        {!tenantId ? (
          <p className="mt-3 text-sm text-slate-500">Enter tenant ID to load report history.</p>
        ) : bulkReportHistoryLoading ? (
          <p className="mt-3 text-sm text-slate-500">Loading report history...</p>
        ) : bulkReportHistory.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No bulk reports exported yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {bulkReportHistory.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div className="text-xs text-slate-700">
                  <p className="font-medium text-slate-900">Report {report.reportId}</p>
                  <p>Action: {report.action}</p>
                  <p>
                    Processed: {report.processed}/{report.total} | Success: {report.succeeded} | Failed: {report.failed}
                  </p>
                  <p className="text-slate-500">Created: {report.createdAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void downloadHistoricalBulkReport(report.reportId)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Activation Set History</h2>
        <p className="mt-1 text-xs text-slate-600">Recent saved activation snapshots for this tenant.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            value={setSearch}
            onChange={(event) => {
              setSetsPage(1)
              setSetSearch(event.target.value)
            }}
            className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-xs"
            placeholder="Search by set name, tag, note, or ID"
          />
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={includeArchivedSets}
              onChange={(event) => {
                setSetsPage(1)
                setIncludeArchivedSets(event.target.checked)
              }}
            />
            Include archived
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-700">
            Sort
            <select
              value={setSort}
              onChange={(event) => {
                setSetsPage(1)
                setSetSort(event.target.value as ActivationSetListResponse['sort'])
              }}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="archived_first">Archived first</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <p className="font-medium text-slate-700">Selected sets: {selectedSetIds.length}</p>
          <button
            type="button"
            onClick={selectAllVisibleSets}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            Select visible
          </button>
          <button
            type="button"
            onClick={clearSelectedSets}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => void runBulkAction('duplicate')}
            disabled={selectedSetIds.length === 0}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Duplicate selected
          </button>
          <button
            type="button"
            onClick={() => void runBulkAction('archive')}
            disabled={selectedSetIds.length === 0}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Archive selected
          </button>
          <button
            type="button"
            onClick={() => void runBulkAction('delete')}
            disabled={selectedSetIds.length === 0}
            className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
          >
            Delete selected
          </button>
        </div>
        {bulkProgress.total > 0 ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p className="font-medium text-slate-900">
              Bulk {bulkProgress.action ?? 'action'} progress: {bulkProgress.processed}/{bulkProgress.total}
            </p>
            <p>
              Success: {bulkProgress.succeeded} | Failed: {bulkProgress.failed}
            </p>
            {bulkProgress.active ? <p className="text-slate-500">Running...</p> : <p className="text-slate-500">Completed.</p>}
            {bulkProgress.failures.length > 0 ? (
              <details className="mt-1">
                <summary className="cursor-pointer text-red-700">View failures ({bulkProgress.failures.length})</summary>
                <ul className="mt-1 list-disc pl-5 text-red-700">
                  {bulkProgress.failures.map((failure) => (
                    <li key={failure}>{failure}</li>
                  ))}
                </ul>
              </details>
            ) : null}
            {!bulkProgress.active ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => void exportBulkReport()}
                  disabled={isExportingBulkReport}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {isExportingBulkReport ? 'Exporting report...' : 'Export bulk report (.json + .md)'}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!tenantId ? (
          <p className="mt-3 text-sm text-slate-500">Enter tenant ID to load activation set history.</p>
        ) : setsLoading ? (
          <p className="mt-3 text-sm text-slate-500">Loading activation sets...</p>
        ) : savedSets.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No saved activation sets yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {savedSets.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedSetIds.includes(item.id)}
                    onChange={() => toggleSetSelection(item.id)}
                    aria-label={`Select activation set ${item.id}`}
                    className="mt-1"
                  />
                  <div className="text-xs text-slate-700">
                  <p className="font-medium text-slate-900">{item.payload?.setName ?? `Set ${item.id}`}</p>
                  <p className="text-slate-500">
                    Tag: {item.payload?.setTag ?? '-'}
                  </p>
                  {item.payload?.archivedAt ? <p className="text-amber-600">Archived</p> : null}
                  <p>
                    Accounts: {item.payload?.accountCount ?? item.payload?.accountIds?.length ?? 0} | Contacts:{' '}
                    {item.payload?.contactCount ?? item.payload?.contactIds?.length ?? 0}
                  </p>
                  {item.payload?.setNote ? <p className="text-slate-600">{item.payload.setNote}</p> : null}
                  <p className="text-slate-500">
                    Saved: {item.payload?.savedAt ?? item.createdAt}
                  </p>
                </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => loadSetIntoForm(item)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => applySetAction(item, 'duplicate')}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    Duplicate
                  </button>
                  {item.payload?.archivedAt ? (
                    <button
                      type="button"
                      onClick={() => applySetAction(item, 'unarchive')}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      Unarchive
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openConfirm(item, 'archive')}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openConfirm(item, 'delete')}
                    className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {setsTotal > setsPageSize ? (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
            <p>
              Page {setsPage} of {Math.max(1, Math.ceil(setsTotal / setsPageSize))} ({setsTotal} sets)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSetsPage((page) => Math.max(1, page - 1))}
                disabled={setsPage <= 1}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setSetsPage((page) => page + 1)}
                disabled={setsPage >= Math.ceil(setsTotal / setsPageSize)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {preview ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Activation Preview</h2>
          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-slate-700 md:grid-cols-3">
            <p>Destination: <span className="font-medium">{preview.destination}</span></p>
            <p>Accounts: <span className="font-medium">{preview.accountCount}</span></p>
            <p>Contacts: <span className="font-medium">{preview.contactCount}</span></p>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Guardrail warnings</p>
            {preview.warnings.length === 0 ? (
              <p className="mt-1 text-sm text-emerald-700">No duplicate/suppression warnings detected.</p>
            ) : (
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-700">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      {jobId ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-800">Activation job: {jobId}</p>
          <p className="mt-1 text-sm text-emerald-700">Status: {jobStatus ?? 'RUNNING'}</p>
          {jobSummary ? (
            <div className="mt-2 rounded-md border border-emerald-200 bg-white p-3 text-xs text-slate-700">
              <p className="font-semibold text-slate-800">Result summary</p>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap">{JSON.stringify(jobSummary, null, 2)}</pre>
            </div>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </section>
      ) : null}

      {undoState ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-amber-800">{undoState.message}</p>
            <button
              type="button"
              onClick={() => {
                const run = undoState.undoAction
                setUndoState(null)
                if (run) void run()
              }}
              className="rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800"
            >
              Undo
            </button>
          </div>
        </section>
      ) : null}

      {confirmState.open && confirmState.item ? (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900">Confirm action</h3>
            <p className="mt-2 text-sm text-slate-700">
              {confirmState.action === 'archive'
                ? `Archive "${confirmState.item.payload?.setName ?? confirmState.item.id}"?`
                : `Delete "${confirmState.item.payload?.setName ?? confirmState.item.id}"? This can be undone only within a short window.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmState({ open: false, item: null, action: null })}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmAction()}
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
