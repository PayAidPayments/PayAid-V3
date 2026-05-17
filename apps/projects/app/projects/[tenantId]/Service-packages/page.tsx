'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'
import { GlassCard } from '@/components/modules/GlassCard'
import { Package } from 'lucide-react'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ServicePackageRow = {
  id: string
  name: string
  billingType: string
  monthlyHours: number | null
  monthApprovedHours: number
  utilizationPercent: number | null
  projectedMonthEndHours: number
  projectedUtilizationPercent: number | null
  capacitySignal: 'BREACHED' | 'AT_RISK' | 'ON_TRACK' | 'UNTRACKED'
  capacitySignalReason: string
  capacityPolicy?: {
    warnUtilizationPercent: number
    breachUtilizationPercent: number
    projectedWarnUtilizationPercent: number
    source: 'defaults' | 'overageRules'
  }
  sla: string | null
  renewalDate: string | null
  status: string
  projectCount: number
  client: { id: string; name: string; email: string | null }
}

type ServicePackageSummary = {
  activePackages: number
  trackedPackages: number
  breachedPackages: number
  atRiskPackages: number
  onTrackPackages: number
  untrackedPackages: number
  slaConfiguredPackages: number
  renewalsDueIn30Days: number
  totalMonthlyHours: number
  totalApprovedHoursMonth: number
  totalProjectedHoursMonth: number
  utilizationPercentRollup: number | null
  projectedUtilizationPercentRollup: number | null
  overdueMilestones: number
  overdueTasks: number
  slaBreachProxyTotal: number
  slaOpenWarnCount: number
  slaOpenBreachCount: number
}

type OpenSlaIncidentRow = {
  id: string
  servicePackageId: string | null
  projectId: string
  sourceType: string
  sourceId: string
  severity: string
  status: string
  title: string
  detail: string | null
  detectedAt: string
}

const thresholdSchema = z
  .object({
    warnUtilizationPercent: z.number().min(1).max(500).optional(),
    projectedWarnUtilizationPercent: z.number().min(1).max(500).optional(),
    breachUtilizationPercent: z.number().min(1).max(500).optional(),
  })
  .superRefine((v, ctx) => {
    if (
      v.warnUtilizationPercent !== undefined &&
      v.breachUtilizationPercent !== undefined &&
      v.warnUtilizationPercent > v.breachUtilizationPercent
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['warnUtilizationPercent'],
        message: 'Warn threshold must be <= breach threshold',
      })
    }
    if (
      v.projectedWarnUtilizationPercent !== undefined &&
      v.breachUtilizationPercent !== undefined &&
      v.projectedWarnUtilizationPercent > v.breachUtilizationPercent
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['projectedWarnUtilizationPercent'],
        message: 'Projected warn threshold must be <= breach threshold',
      })
    }
  })

function signalTone(signal: ServicePackageRow['capacitySignal']) {
  if (signal === 'BREACHED') return 'text-red-700 dark:text-red-300'
  if (signal === 'AT_RISK') return 'text-amber-700 dark:text-amber-300'
  if (signal === 'ON_TRACK') return 'text-emerald-700 dark:text-emerald-300'
  return 'text-gray-600 dark:text-gray-400'
}

export default function ProjectsServicePackagesPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [rows, setRows] = useState<ServicePackageRow[]>([])
  const [summary, setSummary] = useState<ServicePackageSummary | null>(null)
  const [openSlaIncidents, setOpenSlaIncidents] = useState<OpenSlaIncidentRow[]>([])
  const [incidentUpdatingId, setIncidentUpdatingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [clientQuery, setClientQuery] = useState('')
  const [clientOptions, setClientOptions] = useState<Array<{ id: string; name: string; email?: string | null }>>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientFetchError, setClientFetchError] = useState<string | null>(null)
  const [clientsFromCache, setClientsFromCache] = useState(false)
  const [clientsCacheAgeSeconds, setClientsCacheAgeSeconds] = useState<number | null>(null)
  const [clientsLiveAgeSeconds, setClientsLiveAgeSeconds] = useState<number | null>(null)
  const [selectedClientLabel, setSelectedClientLabel] = useState<string>('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editClientQuery, setEditClientQuery] = useState('')
  const [editClientOptions, setEditClientOptions] = useState<
    Array<{ id: string; name: string; email?: string | null }>
  >([])
  const [editClientsLoading, setEditClientsLoading] = useState(false)
  const [editClientFetchError, setEditClientFetchError] = useState<string | null>(null)
  const [editClientsFromCache, setEditClientsFromCache] = useState(false)
  const [editClientsCacheAgeSeconds, setEditClientsCacheAgeSeconds] = useState<number | null>(null)
  const [editClientsLiveAgeSeconds, setEditClientsLiveAgeSeconds] = useState<number | null>(null)
  const [editSelectedClientLabel, setEditSelectedClientLabel] = useState<string>('')
  const [isClearClientDialogOpen, setIsClearClientDialogOpen] = useState(false)
  const clientSearchCacheRef = useRef<
    Map<string, { at: number; rows: Array<{ id: string; name: string; email?: string | null }> }>
  >(new Map())
  const clientSearchRequestSeqRef = useRef({ create: 0, edit: 0 })
  const clientSearchAbortRef = useRef<{ create: AbortController | null; edit: AbortController | null }>({
    create: null,
    edit: null,
  })
  const lastLiveFetchAtRef = useRef<{ create: number | null; edit: number | null }>({
    create: null,
    edit: null,
  })
  const CLIENT_SEARCH_CACHE_TTL_MS = 60 * 1000
  const CLIENT_SEARCH_CACHE_MAX_ENTRIES = 30
  const CLIENT_SEARCH_MIN_CHARS = 2
  const [editForm, setEditForm] = useState({
    clientId: '',
    billingType: '',
    monthlyHours: '',
    warnUtilizationPercent: '',
    projectedWarnUtilizationPercent: '',
    breachUtilizationPercent: '',
  })
  const [form, setForm] = useState({
    name: '',
    clientId: '',
    billingType: 'RETAINER',
    monthlyHours: '',
    warnUtilizationPercent: '90',
    projectedWarnUtilizationPercent: '95',
    breachUtilizationPercent: '100',
  })

  const loadPackages = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      if (!token) {
        setError('Not signed in')
        setSummary(null)
        return
      }
      const res = await fetch('/api/projects/service-packages', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load service packages')
      }
      setRows(Array.isArray(data.packages) ? data.packages : [])
      setSummary(data.summary && typeof data.summary === 'object' ? (data.summary as ServicePackageSummary) : null)
      setOpenSlaIncidents(Array.isArray(data.openSlaIncidents) ? data.openSlaIncidents : [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }

  useEffect(() => {
    void loadPackages()
  }, [tenantId])

  const patchSlaIncident = async (incidentId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    const token = useAuthStore.getState().token
    if (!token) return
    setIncidentUpdatingId(incidentId)
    try {
      const res = await fetch(`/api/projects/service-packages/sla-incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update incident')
      }
      await loadPackages({ silent: true })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update SLA incident')
    } finally {
      setIncidentUpdatingId(null)
    }
  }

  const fetchClients = async (query: string, forEdit = false) => {
    const modeKey = forEdit ? 'edit' : 'create'
    const requestId = ++clientSearchRequestSeqRef.current[modeKey]
    clientSearchAbortRef.current[modeKey]?.abort()
    const controller = new AbortController()
    clientSearchAbortRef.current[modeKey] = controller
    const token = useAuthStore.getState().token
    if (!token) return
    const cacheKey = query.trim().toLowerCase()
    if (cacheKey.length < CLIENT_SEARCH_MIN_CHARS) {
      if (forEdit) {
        setEditClientOptions([])
        setEditClientFetchError(null)
        setEditClientsFromCache(false)
        setEditClientsCacheAgeSeconds(null)
        setEditClientsLiveAgeSeconds(null)
        setEditClientsLoading(false)
      } else {
        setClientOptions([])
        setClientFetchError(null)
        setClientsFromCache(false)
        setClientsCacheAgeSeconds(null)
        setClientsLiveAgeSeconds(null)
        setClientsLoading(false)
      }
      return
    }
    const cached = clientSearchCacheRef.current.get(cacheKey)
    const now = Date.now()
    if (cached) {
      if (now - cached.at <= CLIENT_SEARCH_CACHE_TTL_MS) {
        if (forEdit) setEditClientOptions(cached.rows)
        else setClientOptions(cached.rows)
        if (forEdit) setEditClientFetchError(null)
        else setClientFetchError(null)
        if (forEdit) setEditClientsFromCache(true)
        else setClientsFromCache(true)
        const age = Math.max(0, Math.round((now - cached.at) / 1000))
        if (forEdit) setEditClientsCacheAgeSeconds(age)
        else setClientsCacheAgeSeconds(age)
        if (forEdit) setEditClientsLiveAgeSeconds(null)
        else setClientsLiveAgeSeconds(null)
        return
      }
      clientSearchCacheRef.current.delete(cacheKey)
    }
    if (forEdit) setEditClientFetchError(null)
    else setClientFetchError(null)
    if (forEdit) setEditClientsLoading(true)
    else setClientsLoading(true)
    try {
      const qp = new URLSearchParams()
      qp.set('limit', '20')
      if (query.trim()) qp.set('search', query.trim())
      const res = await fetch(`/api/contacts?${qp.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to search clients')
      const rows = Array.isArray(data.contacts)
        ? data.contacts
        : Array.isArray(data?.data?.contacts)
          ? data.data.contacts
          : []
      const options = rows
        .map((c: any) => ({
          id: c?.id,
          name: c?.name || c?.fullName || c?.email || 'Unnamed',
          email: c?.email ?? null,
        }))
        .filter((c: { id?: string }) => !!c.id) as Array<{ id: string; name: string; email?: string | null }>
      if (requestId !== clientSearchRequestSeqRef.current[modeKey]) return
      if (clientSearchCacheRef.current.size >= CLIENT_SEARCH_CACHE_MAX_ENTRIES) {
        // Evict oldest cache entry to keep memory bounded.
        let oldestKey: string | null = null
        let oldestAt = Number.POSITIVE_INFINITY
        for (const [k, v] of clientSearchCacheRef.current.entries()) {
          if (v.at < oldestAt) {
            oldestAt = v.at
            oldestKey = k
          }
        }
        if (oldestKey) clientSearchCacheRef.current.delete(oldestKey)
      }
      clientSearchCacheRef.current.set(cacheKey, { at: Date.now(), rows: options })
      if (forEdit) setEditClientOptions(options)
      else setClientOptions(options)
      if (forEdit) setEditClientsFromCache(false)
      else setClientsFromCache(false)
      if (forEdit) setEditClientsCacheAgeSeconds(null)
      else setClientsCacheAgeSeconds(null)
      lastLiveFetchAtRef.current[modeKey] = Date.now()
      if (forEdit) setEditClientsLiveAgeSeconds(0)
      else setClientsLiveAgeSeconds(0)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      if (requestId !== clientSearchRequestSeqRef.current[modeKey]) return
      if (forEdit) setEditClientOptions([])
      else setClientOptions([])
      const msg = e instanceof Error ? e.message : 'Failed to search clients'
      if (forEdit) setEditClientFetchError(msg)
      else setClientFetchError(msg)
    } finally {
      if (forEdit) setEditClientsLoading(false)
      else setClientsLoading(false)
    }
  }

  useEffect(() => {
    setClientFetchError(null)
    const t = setTimeout(() => {
      void fetchClients(clientQuery, false)
    }, 250)
    return () => clearTimeout(t)
  }, [clientQuery])

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const createAt = lastLiveFetchAtRef.current.create
      const editAt = lastLiveFetchAtRef.current.edit
      if (!clientsFromCache && createAt) {
        setClientsLiveAgeSeconds(Math.max(0, Math.round((now - createAt) / 1000)))
      }
      if (!editClientsFromCache && editAt) {
        setEditClientsLiveAgeSeconds(Math.max(0, Math.round((now - editAt) / 1000)))
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [clientsFromCache, editClientsFromCache])

  useEffect(() => {
    return () => {
      clientSearchAbortRef.current.create?.abort()
      clientSearchAbortRef.current.edit?.abort()
    }
  }, [])

  const retryClientSearch = async (forEdit = false) => {
    if (forEdit) {
      const key = editClientQuery.trim().toLowerCase()
      clientSearchCacheRef.current.delete(key)
      await fetchClients(editClientQuery, true)
      return
    }
    const key = clientQuery.trim().toLowerCase()
    clientSearchCacheRef.current.delete(key)
    await fetchClients(clientQuery, false)
  }

  const clearCreateClientSelection = () => {
    setForm((p) => ({ ...p, clientId: '' }))
    setSelectedClientLabel('')
    setClientsLiveAgeSeconds(null)
  }

  const clearEditClientSelection = () => {
    setEditForm((p) => ({ ...p, clientId: '' }))
    setEditSelectedClientLabel('')
    setEditClientsLiveAgeSeconds(null)
    setIsClearClientDialogOpen(false)
  }

  const createPickerOptions = form.clientId
    ? [
        ...clientOptions,
        ...(selectedClientLabel &&
        !clientOptions.some((c) => c.id === form.clientId)
          ? [
              {
                id: form.clientId,
                name: selectedClientLabel,
                email: null,
              },
            ]
          : []),
      ]
    : clientOptions

  const editPickerOptions = editForm.clientId
    ? [
        ...editClientOptions,
        ...(editSelectedClientLabel &&
        !editClientOptions.some((c) => c.id === editForm.clientId)
          ? [
              {
                id: editForm.clientId,
                name: editSelectedClientLabel,
                email: null,
              },
            ]
          : []),
      ]
    : editClientOptions

  const startEdit = (row: ServicePackageRow) => {
    setEditError(null)
    setEditClientFetchError(null)
    setEditClientsFromCache(false)
    setEditClientsCacheAgeSeconds(null)
    setEditClientsLiveAgeSeconds(null)
    setEditId(row.id)
    setEditClientQuery(row.client?.name || '')
    setEditSelectedClientLabel(
      row.client?.name ? `${row.client.name}${row.client.email ? ` (${row.client.email})` : ''}` : ''
    )
    setEditForm({
      clientId: row.client?.id || '',
      billingType: row.billingType || 'RETAINER',
      monthlyHours: row.monthlyHours != null ? String(row.monthlyHours) : '',
      warnUtilizationPercent: String(row.capacityPolicy?.warnUtilizationPercent ?? 90),
      projectedWarnUtilizationPercent: String(
        row.capacityPolicy?.projectedWarnUtilizationPercent ?? 95
      ),
      breachUtilizationPercent: String(row.capacityPolicy?.breachUtilizationPercent ?? 100),
    })
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditError(null)
    setEditClientOptions([])
    setEditSelectedClientLabel('')
    setEditClientFetchError(null)
    setEditClientsFromCache(false)
    setEditClientsCacheAgeSeconds(null)
    setEditClientsLiveAgeSeconds(null)
  }

  useEffect(() => {
    if (!editId) return
    setEditClientFetchError(null)
    const t = setTimeout(() => {
      void fetchClients(editClientQuery, true)
    }, 250)
    return () => clearTimeout(t)
  }, [editClientQuery, editId])

  const saveEdit = async (rowId: string) => {
    setEditError(null)
    const clientId = editForm.clientId.trim()
    if (!clientId) {
      setEditError('Client is required')
      return
    }
    const billingType = editForm.billingType.trim()
    const monthlyHours = editForm.monthlyHours === '' ? null : Number(editForm.monthlyHours)
    if (!billingType) {
      setEditError('Billing type is required')
      return
    }
    if (monthlyHours !== null && (!Number.isFinite(monthlyHours) || monthlyHours < 0)) {
      setEditError('Monthly hours must be a non-negative number')
      return
    }
    const warn = editForm.warnUtilizationPercent ? Number(editForm.warnUtilizationPercent) : undefined
    const projectedWarn = editForm.projectedWarnUtilizationPercent
      ? Number(editForm.projectedWarnUtilizationPercent)
      : undefined
    const breach = editForm.breachUtilizationPercent ? Number(editForm.breachUtilizationPercent) : undefined
    const policyValidation = thresholdSchema.safeParse({
      warnUtilizationPercent: warn,
      projectedWarnUtilizationPercent: projectedWarn,
      breachUtilizationPercent: breach,
    })
    if (!policyValidation.success) {
      setEditError(policyValidation.error.issues.map((i) => i.message).join('; '))
      return
    }

    const token = useAuthStore.getState().token
    if (!token) {
      setEditError('Not signed in')
      return
    }

    setSavingId(rowId)
    try {
      const res = await fetch(`/api/projects/service-packages/${rowId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          billingType,
          monthlyHours,
          overageRules: policyValidation.data,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const details = Array.isArray(data.details)
          ? data.details.map((d: { path?: string; message?: string }) => d?.message).join('; ')
          : ''
        throw new Error(details || data.error || 'Failed to update thresholds')
      }
      setEditId(null)
      await loadPackages()
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Failed to update thresholds')
    } finally {
      setSavingId(null)
    }
  }

  const createPackage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const warn = form.warnUtilizationPercent ? Number(form.warnUtilizationPercent) : undefined
    const projectedWarn = form.projectedWarnUtilizationPercent
      ? Number(form.projectedWarnUtilizationPercent)
      : undefined
    const breach = form.breachUtilizationPercent ? Number(form.breachUtilizationPercent) : undefined
    const policyValidation = thresholdSchema.safeParse({
      warnUtilizationPercent: warn,
      projectedWarnUtilizationPercent: projectedWarn,
      breachUtilizationPercent: breach,
    })
    if (!policyValidation.success) {
      setFormError(policyValidation.error.issues.map((i) => i.message).join('; '))
      return
    }

    const token = useAuthStore.getState().token
    if (!token) {
      setFormError('Not signed in')
      return
    }

    const body = {
      name: form.name.trim(),
      clientId: form.clientId.trim(),
      billingType: form.billingType.trim() || 'RETAINER',
      monthlyHours: form.monthlyHours ? Number(form.monthlyHours) : undefined,
      overageRules: policyValidation.data,
    }
    if (!body.name || !body.clientId) {
      setFormError('Name and Client ID are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/projects/service-packages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const details = Array.isArray(data.details)
          ? data.details.map((d: { path?: string; message?: string }) => d?.message).join('; ')
          : ''
        throw new Error(details || data.error || 'Failed to create package')
      }
      setFormSuccess('Service package created')
      setForm((prev) => ({
        ...prev,
        name: '',
        clientId: '',
        monthlyHours: '',
      }))
      setSelectedClientLabel('')
      setClientQuery('')
      setClientsFromCache(false)
      setClientsCacheAgeSeconds(null)
      setClientsLiveAgeSeconds(null)
      await loadPackages()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create package')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoading message="Loading service packages..." fullScreen />
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-7 h-7" />
            Service packages
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Retainers and outsourcing capacity linked to CRM clients. Attach a package to a project from project
            settings via{' '}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">PATCH /api/projects/[id]</code> with{' '}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">servicePackageId</code>.
          </p>
        </div>
        <Link
          href={`/projects/${tenantId}/Home`}
          className="text-sm text-violet-700 dark:text-violet-300 hover:underline shrink-0"
        >
          Back to Projects home
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {summary && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Service ops rollup</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Active packages only. Utilization rollups sum approved time vs monthly hour buckets for packages with{' '}
            <span className="font-medium">monthlyHours</span> set.
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Active packages</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{summary.activePackages}</div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {summary.trackedPackages} tracked / {summary.untrackedPackages} untracked capacity
              </div>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-3">
              <div className="text-xs text-red-700 dark:text-red-300">Capacity breached</div>
              <div className="text-xl font-semibold text-red-700 dark:text-red-300">{summary.breachedPackages}</div>
              <div className="text-[11px] text-gray-600 dark:text-gray-400 mt-1">
                At risk: <span className="font-medium">{summary.atRiskPackages}</span> · On track:{' '}
                <span className="font-medium">{summary.onTrackPackages}</span>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Portfolio utilization (MTD)</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {summary.utilizationPercentRollup != null ? `${summary.utilizationPercentRollup}%` : '—'}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Approved {summary.totalApprovedHoursMonth}h / bucket {summary.totalMonthlyHours}h
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">Projected month-end</div>
              <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {summary.projectedUtilizationPercentRollup != null
                  ? `${summary.projectedUtilizationPercentRollup}%`
                  : '—'}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Forecast {summary.totalProjectedHoursMonth}h (pace-adjusted)
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-600 dark:text-gray-400">
            <span className="rounded-full border border-gray-200 dark:border-gray-800 px-2 py-0.5">
              SLA text set: {summary.slaConfiguredPackages}
            </span>
            <span className="rounded-full border border-red-200 dark:border-red-900/40 px-2 py-0.5 text-red-700 dark:text-red-300">
              SLA breach proxy: {summary.slaBreachProxyTotal} (milestones {summary.overdueMilestones} + tasks{' '}
              {summary.overdueTasks})
            </span>
            <span className="rounded-full border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 text-amber-800 dark:text-amber-300">
              SLA incidents (OPEN WARN): {summary.slaOpenWarnCount ?? 0}
            </span>
            <span className="rounded-full border border-red-300 dark:border-red-900/50 px-2 py-0.5 text-red-800 dark:text-red-200">
              SLA incidents (OPEN BREACH): {summary.slaOpenBreachCount ?? 0}
            </span>
            <span className="rounded-full border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 text-amber-800 dark:text-amber-200">
              Renewals ≤30d: {summary.renewalsDueIn30Days}
            </span>
          </div>
        </GlassCard>
      )}

      {openSlaIncidents.length > 0 && (
        <GlassCard>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Open delivery SLA incidents</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Reconciled on each load from milestone/task dates vs optional per-package{' '}
            <code className="text-[11px] bg-gray-100 dark:bg-gray-800 px-1 rounded">slaPolicy</code>. Acknowledge keeps
            the row active until the underlying date risk clears or you resolve it manually.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-3 font-medium">Severity</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Detail</th>
                  <th className="py-2 pr-3 font-medium">Detected</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {openSlaIncidents.map((inc) => (
                  <tr key={inc.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3 font-medium">{inc.severity}</td>
                    <td className="py-2 pr-3">{inc.status}</td>
                    <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">
                      {inc.sourceType}:
                      {inc.sourceId.length > 12
                        ? `${inc.sourceId.slice(0, 8)}…`
                        : inc.sourceId}
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-700 dark:text-gray-300 max-w-md">
                      <div title={inc.detail || undefined}>{inc.detail || '—'}</div>
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(inc.detectedAt).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {inc.status === 'OPEN' && (
                          <button
                            type="button"
                            disabled={incidentUpdatingId === inc.id}
                            onClick={() => void patchSlaIncident(inc.id, 'ACKNOWLEDGED')}
                            className="text-xs rounded px-2 py-0.5 border border-amber-300 text-amber-800 dark:text-amber-200 disabled:opacity-50"
                          >
                            Ack
                          </button>
                        )}
                        {(inc.status === 'OPEN' || inc.status === 'ACKNOWLEDGED') && (
                          <button
                            type="button"
                            disabled={incidentUpdatingId === inc.id}
                            onClick={() => void patchSlaIncident(inc.id, 'RESOLVED')}
                            className="text-xs rounded px-2 py-0.5 border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create service package</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Configure thresholds without raw JSON. Tooltips explain each policy field.
        </p>
        <form onSubmit={createPackage} className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            placeholder="Package name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            placeholder="Search client by name/email (min 2 chars)"
            value={clientQuery}
            onChange={(e) => setClientQuery(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            value={form.clientId}
            onChange={(e) => {
              const id = e.target.value
              const selected = clientOptions.find((c) => c.id === id)
              setForm((p) => ({ ...p, clientId: id }))
              const label = selected
                ? `${selected.name}${selected.email ? ` (${selected.email})` : ''}`
                : ''
              setSelectedClientLabel(label)
              if (selected?.name) setClientQuery(selected.name)
            }}
          >
            <option value="">Select client</option>
            {createPickerOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.email ? ` (${c.email})` : ''}
              </option>
            ))}
          </select>
          <input
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            placeholder="Billing type (optional)"
            value={form.billingType}
            onChange={(e) => setForm((p) => ({ ...p, billingType: e.target.value }))}
          />
          <input
            type="number"
            min={0}
            step="0.25"
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            placeholder="Monthly hours"
            value={form.monthlyHours}
            onChange={(e) => setForm((p) => ({ ...p, monthlyHours: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            max={500}
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            title="Current utilization threshold where package becomes at risk."
            placeholder="Warn %"
            value={form.warnUtilizationPercent}
            onChange={(e) => setForm((p) => ({ ...p, warnUtilizationPercent: e.target.value }))}
          />
          <input
            type="number"
            min={1}
            max={500}
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            title="Projected month-end utilization threshold for at-risk signal."
            placeholder="Projected warn %"
            value={form.projectedWarnUtilizationPercent}
            onChange={(e) =>
              setForm((p) => ({ ...p, projectedWarnUtilizationPercent: e.target.value }))
            }
          />
          <input
            type="number"
            min={1}
            max={500}
            className="border rounded-md px-3 py-2 bg-white dark:bg-gray-900"
            title="Current utilization threshold where package is considered breached."
            placeholder="Breach %"
            value={form.breachUtilizationPercent}
            onChange={(e) => setForm((p) => ({ ...p, breachUtilizationPercent: e.target.value }))}
          />
          <button
            type="submit"
            disabled={submitting || !form.clientId}
            className="rounded-md px-3 py-2 bg-violet-600 text-white disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create package'}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {clientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS
            ? `Type at least ${CLIENT_SEARCH_MIN_CHARS} characters to search clients`
            : clientsLoading
              ? 'Searching clients…'
              : `Clients shown: ${clientOptions.length}`}
        </p>
        {!clientsLoading &&
          clientQuery.trim().length >= CLIENT_SEARCH_MIN_CHARS &&
          clientOptions.length === 0 &&
          !clientFetchError && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No clients found for this search.
            </p>
          )}
        {!clientsFromCache && clientsLiveAgeSeconds !== null && !clientsLoading && (
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
            Live results updated {clientsLiveAgeSeconds}s ago
          </p>
        )}
        {clientsFromCache && !clientsLoading && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Showing cached results
              {clientsCacheAgeSeconds !== null ? ` (${clientsCacheAgeSeconds}s old)` : ''}
            </p>
            <button
              type="button"
              onClick={() => void retryClientSearch(false)}
              disabled={clientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS || clientsLoading}
              title={
                clientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS
                  ? `Type at least ${CLIENT_SEARCH_MIN_CHARS} characters to refresh`
                  : clientsLoading
                    ? 'Search already in progress'
                    : 'Refresh client results'
              }
              className="text-xs rounded px-2 py-0.5 border border-amber-300 text-amber-700 dark:text-amber-300 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        )}
        {clientFetchError && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-red-600">Client search error: {clientFetchError}</p>
            <button
              type="button"
              onClick={() => void retryClientSearch(false)}
              disabled={clientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS || clientsLoading}
              title={
                clientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS
                  ? `Type at least ${CLIENT_SEARCH_MIN_CHARS} characters to retry`
                  : clientsLoading
                    ? 'Search already in progress'
                    : 'Retry client search'
              }
              className="text-xs rounded px-2 py-0.5 border border-red-300 text-red-700 dark:text-red-300 disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}
        {selectedClientLabel && (
          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Selected client: {selectedClientLabel}
            </p>
            <button
              type="button"
              onClick={clearCreateClientSelection}
              disabled={!form.clientId}
              className="text-xs rounded px-2 py-0.5 border border-violet-300 text-violet-700 dark:text-violet-300 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        )}
        {formError && <p className="text-sm text-red-600 mt-2">{formError}</p>}
        {formSuccess && <p className="text-sm text-emerald-600 mt-2">{formSuccess}</p>}
      </GlassCard>

      <GlassCard>
        {rows.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No service packages yet. Create one with{' '}
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">POST /api/projects/service-packages</code>{' '}
            (name, clientId, optional billingType, monthlyHours, sla, renewalDate).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 font-medium">Package</th>
                  <th className="py-2 pr-4 font-medium">Client</th>
                  <th className="py-2 pr-4 font-medium">Billing</th>
                  <th className="py-2 pr-4 font-medium">Monthly hours</th>
                  <th className="py-2 pr-4 font-medium">Approved this month</th>
                  <th className="py-2 pr-4 font-medium">Utilization</th>
                  <th className="py-2 pr-4 font-medium">Projected month-end</th>
                  <th className="py-2 pr-4 font-medium">Projected utilization</th>
                  <th className="py-2 pr-4 font-medium">Capacity signal</th>
                  <th className="py-2 pr-4 font-medium">Signal details</th>
                  <th className="py-2 pr-4 font-medium">SLA</th>
                  <th className="py-2 pr-4 font-medium">Projects</th>
                  <th className="py-2 pr-4 font-medium">Thresholds</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                    <td className="py-2 pr-4">
                      <span className="text-gray-800 dark:text-gray-200">{r.client?.name || '—'}</span>
                    </td>
                    <td className="py-2 pr-4">{r.billingType}</td>
                    <td className="py-2 pr-4">{r.monthlyHours != null ? r.monthlyHours : '—'}</td>
                    <td className="py-2 pr-4">{r.monthApprovedHours}</td>
                    <td className="py-2 pr-4">
                      {r.utilizationPercent != null ? `${r.utilizationPercent}%` : '—'}
                    </td>
                    <td className="py-2 pr-4">{r.projectedMonthEndHours}</td>
                    <td className="py-2 pr-4">
                      {r.projectedUtilizationPercent != null ? `${r.projectedUtilizationPercent}%` : '—'}
                    </td>
                    <td className={`py-2 pr-4 font-medium ${signalTone(r.capacitySignal)}`}>
                      {r.capacitySignal}
                    </td>
                    <td className="py-2 pr-4 text-xs text-gray-600 dark:text-gray-400 max-w-sm">
                      <div title={r.capacitySignalReason}>{r.capacitySignalReason}</div>
                      {r.capacityPolicy && (
                        <div className="mt-1">
                          thresholds {r.capacityPolicy.warnUtilizationPercent}/
                          {r.capacityPolicy.projectedWarnUtilizationPercent}/
                          {r.capacityPolicy.breachUtilizationPercent}% ({r.capacityPolicy.source})
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-4 max-w-xs truncate" title={r.sla || undefined}>
                      {r.sla || '—'}
                    </td>
                    <td className="py-2 pr-4">{r.projectCount}</td>
                    <td className="py-2 pr-4">
                      {editId === r.id ? (
                        <div className="space-y-2 min-w-[240px]">
                          <div className="grid grid-cols-1 gap-1">
                            <input
                              className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                              placeholder="Search client by name/email (min 2 chars)"
                              value={editClientQuery}
                              onChange={(e) => setEditClientQuery(e.target.value)}
                            />
                            <select
                              className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                              value={editForm.clientId}
                              onChange={(e) => {
                                const id = e.target.value
                                const selected = editClientOptions.find((c) => c.id === id)
                                setEditForm((p) => ({ ...p, clientId: id }))
                                const label = selected
                                  ? `${selected.name}${selected.email ? ` (${selected.email})` : ''}`
                                  : ''
                                setEditSelectedClientLabel(label)
                                if (selected?.name) setEditClientQuery(selected.name)
                              }}
                            >
                              <option value="">Select client</option>
                              {editPickerOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                  {c.email ? ` (${c.email})` : ''}
                                </option>
                              ))}
                            </select>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              {editClientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS
                                ? `Type at least ${CLIENT_SEARCH_MIN_CHARS} characters to search clients`
                                : editClientsLoading
                                  ? 'Searching clients…'
                                  : `Clients shown: ${editClientOptions.length}`}
                            </div>
                            {!editClientsLoading &&
                              editClientQuery.trim().length >= CLIENT_SEARCH_MIN_CHARS &&
                              editClientOptions.length === 0 &&
                              !editClientFetchError && (
                                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                  No clients found for this search.
                                </div>
                              )}
                            {!editClientsFromCache &&
                              editClientsLiveAgeSeconds !== null &&
                              !editClientsLoading && (
                                <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                                  Live results updated {editClientsLiveAgeSeconds}s ago
                                </div>
                              )}
                            {editClientsFromCache && !editClientsLoading && (
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] text-amber-700 dark:text-amber-300">
                                  Showing cached results
                                  {editClientsCacheAgeSeconds !== null
                                    ? ` (${editClientsCacheAgeSeconds}s old)`
                                    : ''}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void retryClientSearch(true)}
                                  disabled={
                                    editClientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS ||
                                    editClientsLoading
                                  }
                                  title={
                                    editClientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS
                                      ? `Type at least ${CLIENT_SEARCH_MIN_CHARS} characters to refresh`
                                      : editClientsLoading
                                        ? 'Search already in progress'
                                        : 'Refresh client results'
                                  }
                                  className="text-[11px] rounded px-2 py-0.5 border border-amber-300 text-amber-700 dark:text-amber-300 disabled:opacity-50"
                                >
                                  Refresh
                                </button>
                              </div>
                            )}
                            {editClientFetchError && (
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] text-red-600">
                                  Client search error: {editClientFetchError}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void retryClientSearch(true)}
                                  disabled={
                                    editClientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS ||
                                    editClientsLoading
                                  }
                                  title={
                                    editClientQuery.trim().length < CLIENT_SEARCH_MIN_CHARS
                                      ? `Type at least ${CLIENT_SEARCH_MIN_CHARS} characters to retry`
                                      : editClientsLoading
                                        ? 'Search already in progress'
                                        : 'Retry client search'
                                  }
                                  className="text-[11px] rounded px-2 py-0.5 border border-red-300 text-red-700 dark:text-red-300 disabled:opacity-50"
                                >
                                  Retry
                                </button>
                              </div>
                            )}
                            {editSelectedClientLabel && (
                              <div className="flex items-center gap-2">
                                <div className="text-[11px] text-violet-700 dark:text-violet-300">
                                  Selected client: {editSelectedClientLabel}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editForm.clientId) return
                                    setIsClearClientDialogOpen(true)
                                  }}
                                  disabled={!editForm.clientId}
                                  className="text-[11px] rounded px-2 py-0.5 border border-violet-300 text-violet-700 dark:text-violet-300 disabled:opacity-50"
                                >
                                  Clear
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                              title="Billing type"
                              value={editForm.billingType}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, billingType: e.target.value }))
                              }
                            />
                            <input
                              type="number"
                              min={0}
                              step="0.25"
                              className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                              title="Monthly hours"
                              value={editForm.monthlyHours}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, monthlyHours: e.target.value }))
                              }
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <input
                              type="number"
                              min={1}
                              max={500}
                              className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                              title="Warn"
                              value={editForm.warnUtilizationPercent}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, warnUtilizationPercent: e.target.value }))
                              }
                            />
                            <input
                              type="number"
                              min={1}
                              max={500}
                              className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                              title="Projected warn"
                              value={editForm.projectedWarnUtilizationPercent}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  projectedWarnUtilizationPercent: e.target.value,
                                }))
                              }
                            />
                            <input
                              type="number"
                              min={1}
                              max={500}
                              className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
                              title="Breach"
                              value={editForm.breachUtilizationPercent}
                              onChange={(e) =>
                                setEditForm((p) => ({ ...p, breachUtilizationPercent: e.target.value }))
                              }
                            />
                          </div>
                          {editError && <div className="text-xs text-red-600">{editError}</div>}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(r.id)}
                              disabled={savingId === r.id || !editForm.clientId}
                              className="text-xs rounded px-2 py-1 bg-violet-600 text-white disabled:opacity-60"
                            >
                              {savingId === r.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-xs rounded px-2 py-1 border border-gray-300 dark:border-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="text-xs rounded px-2 py-1 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          Edit thresholds
                        </button>
                      )}
                    </td>
                    <td className="py-2">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Dialog open={isClearClientDialogOpen} onOpenChange={setIsClearClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear selected client?</DialogTitle>
            <DialogDescription>
              This removes the currently selected client from the edit form. You must select a client again before
              saving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsClearClientDialogOpen(false)}
              className="text-sm rounded px-3 py-2 border border-gray-300 dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={clearEditClientSelection}
              className="text-sm rounded px-3 py-2 bg-violet-600 text-white"
            >
              Clear client
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
