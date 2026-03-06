'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react'

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

export default function ApprovalsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<ApprovalItem[]>([])
  const [leaveRequests, setLeaveRequests] = useState<ApprovalItem[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<ApprovalItem[]>([])
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) return
    setLoading(true)
    fetch('/api/approvals', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { expenses: [], leaveRequests: [], purchaseOrders: [] }))
      .then((data) => {
        setExpenses(data.expenses ?? [])
        setLeaveRequests(data.leaveRequests ?? [])
        setPurchaseOrders(data.purchaseOrders ?? [])
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
      }
      if (!url) return
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setExpenses((p) => p.filter((e) => e.id !== id || e.type !== type))
        setLeaveRequests((p) => p.filter((e) => e.id !== id || e.type !== type))
        setPurchaseOrders((p) => p.filter((e) => e.id !== id || e.type !== type))
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
      }
      if (!url) return
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setExpenses((p) => p.filter((e) => e.id !== id || e.type !== type))
        setLeaveRequests((p) => p.filter((e) => e.id !== id || e.type !== type))
        setPurchaseOrders((p) => p.filter((e) => e.id !== id || e.type !== type))
      }
    } finally {
      setActioning(null)
    }
  }

  const formatINR = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  const renderList = (
    title: string,
    items: ApprovalItem[],
    type: string,
    subtitle?: (i: ApprovalItem) => string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Approve or reject</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No pending items</p>
        ) : (
          <ul className="space-y-3">
            {items.map((i) => (
              <li
                key={`${type}-${i.id}`}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{i.title}</p>
                  {(subtitle?.(i) || i.requester || (i.amount != null && formatINR(i.amount)) || (i.total != null && formatINR(i.total))) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {subtitle?.(i) ?? i.requester ?? (i.amount != null ? formatINR(i.amount) : i.total != null ? formatINR(i.total) : '')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!!actioning}
                    onClick={() => handleReject(type, i.id)}
                  >
                    {actioning === `${type}-${i.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!!actioning}
                    onClick={() => handleApprove(type, i.id)}
                  >
                    {actioning === `${type}-${i.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Link href={tenantId ? `/home/${tenantId}` : '/home'} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Approvals</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Expense, leave, and purchase order approvals</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-6">
            {renderList('Expenses', expenses, 'expense', (i) => i.amount != null ? formatINR(i.amount) : i.requester)}
            {renderList('Leave requests', leaveRequests, 'leave', (i) => `${i.days ?? 0} days · ${i.requester ?? ''}`)}
            {renderList('Purchase orders', purchaseOrders, 'purchase_order', (i) => i.total != null ? formatINR(i.total) : undefined)}
          </div>
        )}
      </div>
    </div>
  )
}
