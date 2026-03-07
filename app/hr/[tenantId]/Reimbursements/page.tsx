'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, Plus, MessageCircle, CheckCircle, Clock, XCircle, IndianRupee, ArrowLeft, Inbox } from 'lucide-react'
import { formatINR } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ReimbursementRow = {
  id: string
  amount: number
  category?: string | null
  status: string
  employee?: { firstName: string; lastName: string } | null
  createdAt: string
  submittedDate?: string
  approvedBy?: string | null
  approvedAt?: string | null
  expenseDate?: string | null
  whatsappApproval?: boolean
}

const DEMO_LIST: ReimbursementRow[] = [
  { id: '1', employee: { firstName: 'Rajesh', lastName: 'Kumar' }, category: 'Travel', amount: 5000, submittedDate: '2026-02-15', status: 'PENDING', createdAt: '2026-02-15T10:00:00Z', whatsappApproval: true },
  { id: '2', employee: { firstName: 'Priya', lastName: 'Sharma' }, category: 'Meals', amount: 2500, submittedDate: '2026-02-14', status: 'APPROVED', approvedBy: 'Manager', approvedAt: '2026-02-14T15:00:00Z', createdAt: '2026-02-14T09:00:00Z', whatsappApproval: true },
  { id: '3', employee: { firstName: 'Amit', lastName: 'Patel' }, category: 'Office Supplies', amount: 3000, submittedDate: '2026-02-13', status: 'REJECTED', createdAt: '2026-02-13T11:00:00Z', whatsappApproval: false },
]

function empName(r: ReimbursementRow): string {
  if (r.employee) return `${r.employee.firstName} ${r.employee.lastName}`.trim()
  return '—'
}
function amountNum(r: ReimbursementRow): number {
  return typeof r.amount === 'number' ? r.amount : Number(r.amount) || 0
}

export default function HRReimbursementsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectId, setRejectId] = useState<string | null>(null)

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['hr-reimbursements', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/reimbursements?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return { reimbursements: [], pagination: { total: 0 } }
      const j = await res.json()
      const raw = Array.isArray(j.reimbursements) ? j.reimbursements : []
      return {
        reimbursements: raw.map((r: any) => ({
          id: r.id,
          amount: Number(r.amount ?? 0),
          category: r.category ?? null,
          status: r.status ?? 'PENDING',
          employee: r.employee ?? null,
          createdAt: r.createdAt,
          approvedBy: r.approvedBy ?? null,
          approvedAt: r.approvedAt ?? null,
          expenseDate: r.expenseDate ?? null,
        })),
        pagination: j.pagination ?? { total: raw.length },
      }
    },
    enabled: !!tenantId && !!token,
  })

  const list: ReimbursementRow[] = (apiData?.reimbursements?.length ? apiData.reimbursements : DEMO_LIST) as ReimbursementRow[]
  const pending = list.filter((r) => r.status === 'PENDING')
  const approved = list.filter((r) => r.status === 'APPROVED')
  const rejected = list.filter((r) => r.status === 'REJECTED')
  const pendingCount = pending.length
  const pendingAmount = pending.reduce((s, r) => s + amountNum(r), 0)

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hr/reimbursements/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notes: '' }),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr-reimbursements', tenantId] }),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`/api/hr/reimbursements/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => {
      setRejectDialogOpen(false)
      setRejectionReason('')
      setRejectId(null)
      queryClient.invalidateQueries({ queryKey: ['hr-reimbursements', tenantId] })
    },
  })

  const handleApprove = (id: string) => approveMutation.mutate(id)
  const handleRejectClick = (id: string) => { setRejectId(id); setRejectDialogOpen(true) }
  const handleRejectConfirm = () => {
    if (rejectId && rejectionReason.trim()) rejectMutation.mutate({ id: rejectId, reason: rejectionReason.trim() })
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={tenantId ? `/hr/${tenantId}` : '/'} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Reimbursement queue</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending: {pendingCount} · {formatINR(pendingAmount)} to approve</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={tenantId ? `/approvals/${tenantId}` : '#'}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300"><Inbox className="h-4 w-4 mr-1" /> Approvals hub</Button>
            </Link>
            <Link href={`/hr/${tenantId}/Reimbursements/new`}>
              <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600"><Plus className="h-4 w-4 mr-1" /> Submit</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* WhatsApp banner */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm border-l-4 border-l-green-500">
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 text-sm">WhatsApp approval enabled</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Approve via WhatsApp</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">Configure WhatsApp</Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm h-28">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase"><Clock className="h-4 w-4" /> Pending</div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{pendingCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatINR(pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm h-28">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase"><CheckCircle className="h-4 w-4" /> Approved</div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{approved.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm h-28">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase"><IndianRupee className="h-4 w-4" /> Pending total</div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{formatINR(pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm h-28">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase"><Receipt className="h-4 w-4" /> Rejected</div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{rejected.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue: Pending table */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Queue · Pending approval</CardTitle>
          <CardDescription className="text-xs">Approve or reject. Buttons disabled while request is in progress.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-6">Loading…</p>
          ) : pending.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No pending reimbursements</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="text-slate-600 dark:text-slate-400">Employee</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Category</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Submitted</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">WhatsApp</TableHead>
                  <TableHead className="text-right text-slate-600 dark:text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((r) => (
                  <TableRow key={r.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-50">{empName(r)}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{r.category ?? '—'}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-50">{formatINR(amountNum(r))}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{format(new Date(r.createdAt || r.submittedDate || ''), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {r.whatsappApproval ? (
                        <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"><MessageCircle className="h-3 w-3 mr-1" /> Enabled</Badge>
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-slate-400">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" className="dark:border-slate-600" onClick={() => handleApprove(r.id)} disabled={approveMutation.isPending}>
                          {approveMutation.isPending && approveMutation.variables === r.id ? '…' : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" className="dark:border-slate-600" onClick={() => handleRejectClick(r.id)} disabled={rejectMutation.isPending}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Approved / Rejected / All */}
      <Tabs defaultValue="approved" className="space-y-4">
        <TabsList className="dark:bg-slate-800 dark:border dark:border-slate-700">
          <TabsTrigger value="approved" className="dark:data-[state=active]:bg-slate-700">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="dark:data-[state=active]:bg-slate-700">Rejected</TabsTrigger>
          <TabsTrigger value="all" className="dark:data-[state=active]:bg-slate-700">All</TabsTrigger>
        </TabsList>

        <TabsContent value="approved" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Approved</CardTitle>
              <CardDescription className="text-xs">Processed reimbursements</CardDescription>
            </CardHeader>
            <CardContent>
              {approved.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No approved items.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead className="text-slate-600 dark:text-slate-400">Employee</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Category</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Amount</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Approved</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approved.map((r) => (
                      <TableRow key={r.id} className="border-slate-200 dark:border-slate-800">
                        <TableCell className="font-medium text-slate-900 dark:text-slate-50">{empName(r)}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{r.category ?? '—'}</TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-slate-50">{formatINR(amountNum(r))}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{r.approvedBy ?? '—'}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{format(new Date(r.approvedAt || r.createdAt || ''), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Rejected</CardTitle>
              <CardDescription className="text-xs">Rejected requests</CardDescription>
            </CardHeader>
            <CardContent>
              {rejected.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No rejected reimbursements</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead className="text-slate-600 dark:text-slate-400">Employee</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Category</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Amount</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejected.map((r) => (
                      <TableRow key={r.id} className="border-slate-200 dark:border-slate-800">
                        <TableCell className="font-medium text-slate-900 dark:text-slate-50">{empName(r)}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{r.category ?? '—'}</TableCell>
                        <TableCell className="font-medium text-slate-900 dark:text-slate-50">{formatINR(amountNum(r))}</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{format(new Date(r.createdAt || ''), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">All reimbursements</CardTitle>
              <CardDescription className="text-xs">Complete list</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 dark:border-slate-800">
                    <TableHead className="text-slate-600 dark:text-slate-400">Employee</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Category</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((r) => (
                    <TableRow key={r.id} className="border-slate-200 dark:border-slate-800">
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{empName(r)}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{r.category ?? '—'}</TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-50">{formatINR(amountNum(r))}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'APPROVED' ? 'default' : r.status === 'REJECTED' ? 'destructive' : 'secondary'} className="dark:bg-slate-700 dark:text-slate-200">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{format(new Date(r.createdAt || r.submittedDate || ''), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-50">Reject reimbursement</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">Provide a reason (required by API).</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input placeholder="Rejection reason…" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-50" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectionReason(''); setRejectId(null) }} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || rejectMutation.isPending}>
              {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
