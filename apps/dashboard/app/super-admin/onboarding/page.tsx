'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, ChevronRight, FileCheck, Clock, AlertCircle } from 'lucide-react'

interface OnboardingRecord {
  id: string
  tenantId: string
  status: string
  kycStatus: string
  riskScore: number | null
  tenant: { id: string; name: string; email: string | null; createdAt: string; status: string }
  kycDocuments: Array<{ id: string; documentType: string; verificationStatus: string }>
  createdAt: string
}

interface Stats {
  total: number
  pendingReview: number
  approved: number
  rejected: number
  needsInfo: number
  kycVerified: number
  kycPending: number
}

export default function SuperAdminOnboardingQueuePage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<string>('created_desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    fetchQueue()
  }, [filter, sort])

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      params.set('sort', sort)
      const res = await fetch(`/api/super-admin/onboarding?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setRecords(json.data || [])
      setStats(json.stats || null)
    } catch (e) {
      console.error(e)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      case 'pending_review': return 'secondary'
      case 'needs_info': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Queue</h1>
        <p className="text-muted-foreground">
          Review and approve merchant onboarding applications
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReview}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Needs Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.needsInfo}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">KYC Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.kycVerified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending_review', 'approved', 'rejected', 'needs_info'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="created_desc">Newest first</option>
            <option value="created_asc">Oldest first</option>
            <option value="risk_desc">Risk (high first)</option>
            <option value="risk_asc">Risk (low first)</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && filter === 'pending_review' && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button
            size="sm"
            disabled={bulkLoading}
            onClick={async () => {
              setBulkLoading(true)
              try {
                const res = await fetch('/api/super-admin/onboarding/bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'approve', tenantIds: Array.from(selected) }),
                })
                const j = await res.json()
                if (res.ok && j.data) {
                  setSelected(new Set())
                  fetchQueue()
                } else {
                  alert(j.error || 'Bulk approve failed')
                }
              } finally {
                setBulkLoading(false)
              }
            }}
          >
            {bulkLoading ? 'Processing...' : 'Approve selected'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkLoading}
            onClick={async () => {
              if (!confirm(`Reject ${selected.size} application(s)?`)) return
              setBulkLoading(true)
              try {
                const res = await fetch('/api/super-admin/onboarding/bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'reject', tenantIds: Array.from(selected) }),
                })
                const j = await res.json()
                if (res.ok && j.data) {
                  setSelected(new Set())
                  fetchQueue()
                } else {
                  alert(j.error || 'Bulk reject failed')
                }
              } finally {
                setBulkLoading(false)
              }
            }}
          >
            Reject selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Applications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click a row to review documents and approve or reject
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No onboarding records found. New tenants will appear here when they start onboarding.
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {r.status === 'pending_review' && (
                    <input
                      type="checkbox"
                      checked={selected.has(r.tenantId)}
                      onChange={(e) => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(r.tenantId)
                        else next.delete(r.tenantId)
                        setSelected(next)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  )}
                  <Link
                    href={`/super-admin/onboarding/${r.tenantId}`}
                    className="flex flex-1 items-center justify-between min-w-0"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div>
                        <p className="font-medium">{r.tenant.name}</p>
                        <p className="text-sm text-muted-foreground">{r.tenant.email || '—'}</p>
                      </div>
                      <Badge variant={statusColor(r.status)}>{r.status.replace('_', ' ')}</Badge>
                      <Badge variant="outline">KYC: {r.kycStatus}</Badge>
                      {r.riskScore != null && (
                        <span className="text-sm text-muted-foreground">Risk: {r.riskScore}</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {r.kycDocuments.length} doc(s)
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4 text-sm text-muted-foreground">
        <Link href="/super-admin/onboarding-analytics" className="hover:underline flex items-center gap-1">
          <Clock className="h-4 w-4" /> Onboarding Analytics
        </Link>
        <Link href="/super-admin/kyc-verification" className="hover:underline flex items-center gap-1">
          <FileCheck className="h-4 w-4" /> KYC Verification
        </Link>
      </div>
    </div>
  )
}
