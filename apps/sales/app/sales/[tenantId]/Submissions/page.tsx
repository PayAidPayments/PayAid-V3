'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/lib/stores/auth'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { PageLoading } from '@/components/ui/loading'
import { RefreshCw } from 'lucide-react'

type SubmissionRow = {
  id: string
  submittedAt: string
  salesPageId: string
  pageName: string
  pageSlug: string
  payload: Record<string, unknown>
  attribution?: Record<string, unknown> | null
  crmSyncStatus: 'received' | 'normalized' | 'crm_synced' | 'failed'
  contactId: string | null
  error?: string | null
  ownerId?: string | null
  leadScore?: number | null
}

function syncBadge(status: SubmissionRow['crmSyncStatus']) {
  if (status === 'crm_synced') return <Badge className="bg-green-100 text-green-800">CRM synced</Badge>
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>
  if (status === 'normalized') return <Badge variant="secondary">Normalized</Badge>
  return <Badge variant="outline">Received</Badge>
}

export default function SalesSubmissionsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<'ALL' | SubmissionRow['crmSyncStatus']>('ALL')

  const { data, isLoading, refetch, isFetching } = useQuery<{ submissions: SubmissionRow[] }>({
    queryKey: ['sales-submissions', tenantId],
    queryFn: async () => {
      const response = await fetch('/api/sales-submissions?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch submissions')
      return response.json()
    },
    enabled: Boolean(token),
  })

  const retryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch('/api/sales-submissions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ action: 'retry', entryId }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Retry failed')
      }
      return response.json()
    },
    onSuccess: () => refetch(),
  })

  const rows = useMemo(() => {
    const all = data?.submissions || []
    if (statusFilter === 'ALL') return all
    return all.filter((row) => row.crmSyncStatus === statusFilter)
  }, [data?.submissions, statusFilter])

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Sales</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/sales/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link
                href={`/sales/${tenantId}/Sales-Pages`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sales Pages
              </Link>
              <Link
                href={`/sales/${tenantId}/Submissions`}
                className="text-green-600 font-medium border-b-2 border-green-600 pb-2"
              >
                Submissions
              </Link>
              <Link
                href={`/sales/${tenantId}/Checkout-Pages`}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Checkout Pages
              </Link>
              <Link href={`/sales/${tenantId}/Orders`} className="text-gray-600 hover:text-gray-900 transition-colors">
                Orders
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <ModuleSwitcher currentModule="sales" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              Sales page form submissions with CRM sync status (bridge log on LandingPage). Lead Intelligence discovery
              is out of scope for this view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'crm_synced', 'failed', 'received', 'normalized'] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <PageLoading />
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet for this tenant.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Attribution</TableHead>
                    <TableHead>CRM sync</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const name = String(row.payload?.name || row.payload?.fullName || '—')
                    const email = String(row.payload?.email || row.payload?.Email || '—')
                    const phone = String(row.payload?.phone || row.payload?.Phone || '')
                    const source = String(row.attribution?.source || '—')
                    const campaign = String(row.attribution?.campaign || '')
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(row.submittedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{row.pageName}</div>
                          <div className="text-xs text-muted-foreground">{row.pageSlug}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{name}</div>
                          <div className="text-xs text-muted-foreground">{email}</div>
                          {phone ? <div className="text-xs text-muted-foreground">{phone}</div> : null}
                          {row.contactId ? (
                            <Link
                              href={`/crm/${tenantId}/Contacts/${row.contactId}`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Open contact
                            </Link>
                          ) : null}
                          {row.error ? <div className="text-xs text-red-600 mt-1">{row.error}</div> : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{source}</div>
                          {campaign ? <div className="text-xs text-muted-foreground">{campaign}</div> : null}
                        </TableCell>
                        <TableCell>{syncBadge(row.crmSyncStatus)}</TableCell>
                        <TableCell>{row.leadScore ?? '—'}</TableCell>
                        <TableCell className="text-right">
                          {row.crmSyncStatus === 'failed' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={retryMutation.isPending}
                              onClick={() => retryMutation.mutate(row.id)}
                            >
                              Retry CRM sync
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
