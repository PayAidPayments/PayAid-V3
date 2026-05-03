'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/StatCard'
import { formatINR } from '@/lib/utils/formatINR'
import { useAuthStore } from '@/lib/stores/auth'
import {
  Receipt,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HRExpensesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const token = useAuthStore((s) => s.token)

  const { data, isLoading } = useQuery({
    queryKey: ['hr-reimbursements-expenses', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/reimbursements?limit=100', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { expenses: [], summary: {} }
      const j = await res.json()
      const list = j.reimbursements ?? []
      const pending = list.filter((e: { status: string }) => (e.status ?? '').toUpperCase() === 'PENDING')
      const approved = list.filter((e: { status: string }) => (e.status ?? '').toUpperCase() === 'APPROVED')
      const totalPending = pending.reduce((s: number, e: { amount?: number }) => s + (Number(e.amount) || 0), 0)
      const totalApproved = approved.reduce((s: number, e: { amount?: number }) => s + (Number(e.amount) || 0), 0)
      return {
        expenses: list,
        summary: {
          pendingCount: pending.length,
          approvedCount: approved.length,
          totalPending,
          totalApproved,
        },
      }
    },
    enabled: !!token,
  })

  const expenses = data?.expenses ?? []
  const summary = data?.summary ?? {}
  const pendingCount = summary.pendingCount ?? 0
  const totalPending = summary.totalPending ?? 0
  const totalApproved = summary.totalApproved ?? 0

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Travel & Expense
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Reimbursement claims, approval workflow, payroll sync
          </p>
        </div>
        <Link href={`/hr/${tenantId}/Reimbursements`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New claim
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Pending claims"
          value={pendingCount}
          subtitle="Awaiting approval"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Pending amount"
          value={formatINR(totalPending)}
          subtitle="To be approved"
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatCard
          title="Approved (month)"
          value={formatINR(totalApproved)}
          subtitle="Ready for payroll"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Policy"
          subtitle="Meals ₹500/day · Travel ₹2,000/km"
          value="—"
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent claims</CardTitle>
          <CardDescription>
            Upload receipt → OCR amount → auto-categorise · Employee → Manager → Finance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500 py-4">Loading…</p>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <Receipt className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No expense claims yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Submit claims from Reimbursements; they sync here for approval and payroll.
              </p>
              <Link href={`/hr/${tenantId}/Reimbursements`}>
                <Button variant="outline" size="sm" className="mt-4">
                  Open Reimbursements
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.slice(0, 10).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {e.employee
                        ? `${e.employee.firstName ?? ''} ${e.employee.lastName ?? ''}`.trim() || '—'
                        : '—'}
                    </TableCell>
                    <TableCell>{e.category ?? '—'}</TableCell>
                    <TableCell>{formatINR(Number(e.amount) || 0)}</TableCell>
                    <TableCell>
                      {e.expenseDate ? format(new Date(e.expenseDate), 'dd MMM yyyy') : e.createdAt ? format(new Date(e.createdAt), 'dd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (e.status ?? '').toUpperCase() === 'APPROVED'
                            ? 'default'
                            : (e.status ?? '').toUpperCase() === 'REJECTED'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {e.status ?? 'PENDING'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {expenses.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Link href={`/hr/${tenantId}/Reimbursements`}>
                <Button variant="outline" size="sm" className="gap-2">
                  View all <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
