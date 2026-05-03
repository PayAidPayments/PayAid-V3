'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, XCircle, Loader2, FileCheck, Calendar, Receipt, ShoppingCart } from 'lucide-react'
import { formatINR } from '@/lib/utils/formatINR'

type ApprovalItem = {
  id: string
  type: string
  title: string
  amount?: number
  total?: number
  days?: number
  requester?: string
  createdAt: string
}

type ReimbursementItem = {
  id: string
  amount: number
  category?: string
  status: string
  employee?: { firstName: string; lastName: string }
  createdAt: string
}

export default function ApprovalsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<ApprovalItem[]>([])
  const [leaveRequests, setLeaveRequests] = useState<ApprovalItem[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<ApprovalItem[]>([])
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([])
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) return
    setLoading(true)
    Promise.all([
      fetch('/api/approvals', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : { expenses: [], leaveRequests: [], purchaseOrders: [] })),
      fetch(`/api/hr/reimbursements?status=PENDING&limit=50`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d) => (Array.isArray(d.reimbursements) ? d.reimbursements : Array.isArray(d) ? d : []))
        .catch(() => []),
    ])
      .then(([approvalData, reimbList]) => {
        setExpenses(approvalData.expenses ?? [])
        setLeaveRequests(approvalData.leaveRequests ?? [])
        setPurchaseOrders(approvalData.purchaseOrders ?? [])
        setReimbursements(Array.isArray(reimbList) ? reimbList.filter((r: ReimbursementItem) => r.status === 'PENDING') : [])
      })
      .finally(() => setLoading(false))
  }, [tenantId, token])

  const handleApprove = async (type: string, id: string) => {
    if (!token) return
    setActioning(`${type}-${id}`)
    try {
      let url = ''
      let method = 'PUT'
      let body: Record<string, unknown> = {}
      if (type === 'expense') {
        url = `/api/accounting/expenses/${id}/approve`
        method = 'PUT'
      } else if (type === 'leave') {
        url = `/api/hr/leave/requests/${id}/approve`
        method = 'PUT'
      } else if (type === 'purchase_order') {
        url = `/api/purchases/orders/${id}/approve`
        method = 'POST'
        body = { approved: true }
      } else if (type === 'reimbursement') {
        url = `/api/hr/reimbursements/${id}/approve`
        method = 'PUT'
      }
      if (!url) return
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      })
      if (res.ok) {
        setExpenses((p) => p.filter((e) => e.id !== id || e.type !== type))
        setLeaveRequests((p) => p.filter((e) => e.id !== id || e.type !== type))
        setPurchaseOrders((p) => p.filter((e) => e.id !== id || e.type !== type))
        setReimbursements((p) => p.filter((e) => e.id !== id))
      }
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async (type: string, id: string) => {
    if (!token) return
    setActioning(`${type}-${id}`)
    try {
      let url = ''
      let method = 'PUT'
      let body: Record<string, unknown> = { comments: 'Rejected from Approvals' }
      if (type === 'expense') url = `/api/accounting/expenses/${id}/reject`
      else if (type === 'leave') url = `/api/hr/leave/requests/${id}/reject`
      else if (type === 'purchase_order') {
        url = `/api/purchases/orders/${id}/approve`
        method = 'POST'
        body = { approved: false, rejectionReason: 'Rejected from Approvals' }
      } else if (type === 'reimbursement') {
        url = `/api/hr/reimbursements/${id}/reject`
        body = { reason: 'Rejected from Approvals' }
      }
      if (!url) return
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: method === 'POST' || type === 'reimbursement' ? JSON.stringify(body) : JSON.stringify(body),
      })
      if (res.ok) {
        setExpenses((p) => p.filter((e) => e.id !== id || e.type !== type))
        setLeaveRequests((p) => p.filter((e) => e.id !== id || e.type !== type))
        setPurchaseOrders((p) => p.filter((e) => e.id !== id || e.type !== type))
        setReimbursements((p) => p.filter((e) => e.id !== id))
      }
    } finally {
      setActioning(null)
    }
  }

  const totalPending = expenses.length + leaveRequests.length + purchaseOrders.length + reimbursements.length
  const pendingAmount = expenses.reduce((s, e) => s + (e.amount ?? 0), 0) +
    purchaseOrders.reduce((s, p) => s + (p.total ?? 0), 0) +
    reimbursements.reduce((s, r) => s + (r.amount ?? 0), 0)

  const renderList = (
    title: string,
    icon: React.ReactNode,
    items: ApprovalItem[] | ReimbursementItem[],
    type: string,
    subtitle?: (i: ApprovalItem | ReimbursementItem) => string
  ) => (
    <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <CardDescription className="text-xs">{items.length} pending</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No pending items</p>
        ) : (
          <ul className="space-y-2">
            {items.map((i) => (
              <li
                key={`${type}-${i.id}`}
                className="flex items-center justify-between py-2 border-b border-slate-200/80 dark:border-slate-800 last:border-0"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                    {'title' in i ? i.title : (i as ReimbursementItem).category ?? 'Reimbursement'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {subtitle?.(i) ?? ('requester' in i ? (i as ApprovalItem).requester : (i as ReimbursementItem).employee ? `${(i as ReimbursementItem).employee!.firstName} ${(i as ReimbursementItem).employee!.lastName}` : '')}
                    {'amount' in i && (i as ReimbursementItem).amount != null && ` · ${formatINR((i as ReimbursementItem).amount)}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="dark:border-slate-600 dark:text-slate-300" disabled={!!actioning} onClick={() => handleReject(type, i.id)}>
                    {actioning === `${type}-${i.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled={!!actioning} onClick={() => handleApprove(type, i.id)}>
                    {actioning === `${type}-${i.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* ——— Sticky header ——— */}
        <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={tenantId ? `/home/${tenantId}` : '/home'} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Pending approvals hub</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Leave, expenses, reimbursements, purchase orders</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">Total pending: {totalPending}</Badge>
              {pendingAmount > 0 && <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatINR(pendingAmount)}</span>}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 py-8">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            {/* ——— Two-column summary ——— */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="h-4 w-4" /> Leave
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{leaveRequests.length}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Receipt className="h-4 w-4" /> Reimbursements
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{reimbursements.length}</p>
                  {reimbursements.length > 0 && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatINR(reimbursements.reduce((s, r) => s + (r.amount ?? 0), 0))}</p>}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <FileCheck className="h-4 w-4" /> Expenses
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{expenses.length}</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <ShoppingCart className="h-4 w-4" /> Purchase orders
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{purchaseOrders.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* ——— Full-width cards per type ——— */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {renderList('Leave requests', <Calendar className="h-4 w-4" />, leaveRequests, 'leave', (i) => `${(i as ApprovalItem).days ?? 0} days · ${(i as ApprovalItem).requester ?? ''}`)}
              {renderList('Reimbursements', <Receipt className="h-4 w-4" />, reimbursements, 'reimbursement', (i) => (i as ReimbursementItem).employee ? `${(i as ReimbursementItem).employee!.firstName} ${(i as ReimbursementItem).employee!.lastName}` : undefined)}
              {renderList('Expenses', <FileCheck className="h-4 w-4" />, expenses, 'expense', (i) => (i as ApprovalItem).amount != null ? formatINR((i as ApprovalItem).amount!) : (i as ApprovalItem).requester)}
              {renderList('Purchase orders', <ShoppingCart className="h-4 w-4" />, purchaseOrders, 'purchase_order', (i) => (i as ApprovalItem).total != null ? formatINR((i as ApprovalItem).total!) : undefined)}
            </div>

            {tenantId && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/hr/${tenantId}/Reimbursements`}>
                  <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">Reimbursement queue</Button>
                </Link>
                <Link href={tenantId ? `/home/${tenantId}` : '/home'}>
                  <Button variant="ghost" size="sm" className="dark:text-slate-400">Back to home</Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
