'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Receipt, Calendar, User, Loader2, Download, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINR } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Payslip = { id: string; month: number; year: number; grossEarningsInr: number; netPayInr: number; payoutStatus: string }
type LeaveItem = { type: string; code: string; balance: number }
type AttendanceDay = { date: string; status: string; checkInTime: string | null; checkOutTime: string | null }

export default function ESSPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [me, setMe] = useState<{
    employee: { id: string; employeeCode: string; firstName: string; lastName: string; department?: string; designation?: string }
    leaveSummary: LeaveItem[]
    attendanceToday: { status: string; checkIn: string | null; checkOut: string | null } | null
    lastPayslip: { month: number; year: number; netPayInr: number } | null
  } | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [attendance, setAttendance] = useState<AttendanceDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch('/api/hr/ess/me', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/hr/ess/payslips', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/hr/ess/attendance?days=30', { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([rMe, rPayslips, rAtt]) => {
        if (!rMe.ok) {
          const j = await rMe.json().catch(() => ({}))
          throw new Error(j.error || 'Not linked to an employee')
        }
        const dataMe = await rMe.json()
        setMe(dataMe)
        const dataPayslips = rPayslips.ok ? await rPayslips.json() : { payslips: [] }
        setPayslips(dataPayslips.payslips || [])
        const dataAtt = rAtt.ok ? await rAtt.json() : { attendance: [] }
        setAttendance(dataAtt.attendance || [])
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [tenantId, token])

  const monthName = (month: number, year: number) => format(new Date(year, month - 1), 'MMM yyyy')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    )
  }

  if (error || !me) {
    return (
      <div className="space-y-5 pb-24">
        <div className="flex items-center gap-4">
          <Link href={`/hr/${tenantId}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">My Portal (ESS)</h1>
        </div>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto mb-3 text-slate-400" />
            <p className="font-medium text-slate-900 dark:text-slate-50">{error || 'Not an employee'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Link your account to an employee record to view payslips and leave.</p>
            <Link href={`/hr/${tenantId}`}>
              <Button variant="outline" size="sm" className="mt-4 dark:border-slate-600 dark:text-slate-300">Back to HR</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/hr/${tenantId}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">My Portal (ESS)</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {me.employee.firstName} {me.employee.lastName} · {me.employee.employeeCode}
                {me.employee.department && ` · ${me.employee.department}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <Receipt className="h-4 w-4" /> Last payslip
            </div>
            {me.lastPayslip ? (
              <>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">{monthName(me.lastPayslip.month, me.lastPayslip.year)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{formatINR(me.lastPayslip.netPayInr)} net</p>
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No payslip yet</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <Calendar className="h-4 w-4" /> Leave balance
            </div>
            {me.leaveSummary.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-300">
                {me.leaveSummary.slice(0, 3).map((l, i) => (
                  <li key={i}>{l.type}: {l.balance} days</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No leave data</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <Clock className="h-4 w-4" /> Today
            </div>
            {me.attendanceToday ? (
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mt-1 capitalize">{me.attendanceToday.status}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No check-in</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payslips */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Payslips
          </CardTitle>
          <CardDescription className="text-xs">Last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No payslips available.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="text-slate-600 dark:text-slate-400">Period</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Gross</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Net</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                  <TableHead className="w-[80px] text-slate-600 dark:text-slate-400">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((p) => (
                  <TableRow key={p.id} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="font-medium text-slate-900 dark:text-slate-50">{monthName(p.month, p.year)}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{formatINR(p.grossEarningsInr)}</TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-50">{formatINR(p.netPayInr)}</TableCell>
                    <TableCell>
                      <Badge variant={p.payoutStatus === 'PAID' ? 'default' : 'secondary'} className="text-xs">{p.payoutStatus}</Badge>
                    </TableCell>
                    <TableCell>
                      <a href={`/api/hr/payroll/runs/${p.id}/payslip`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-xs"><Download className="h-3 w-3 mr-1" /> PDF</Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Attendance (optional) */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Attendance (last 30 days)
          </CardTitle>
          <CardDescription className="text-xs">Check-in / check-out</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No attendance records.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800">
                  <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Check-in</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Check-out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.slice(0, 20).map((a, i) => (
                  <TableRow key={i} className="border-slate-200 dark:border-slate-800">
                    <TableCell className="text-slate-900 dark:text-slate-50">{format(new Date(a.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="capitalize text-slate-600 dark:text-slate-400">{a.status}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                      {a.checkInTime ? format(new Date(a.checkInTime), 'HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                      {a.checkOutTime ? format(new Date(a.checkOutTime), 'HH:mm') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
