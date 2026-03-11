'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Clock,
  Calendar,
  Users,
  AlertCircle,
  Phone,
  MessageSquare,
  Download,
  TrendingUp,
  ChevronRight,
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// Demo data for attendance dashboard (replace with API)
const DEMO = {
  today: '2026-03-07',
  header: { present: 42, total: 47, late: 3, absent: 2, onLeave: 0 },
  byDepartment: [
    { name: 'Sales', present: 12, total: 14 },
    { name: 'Engineering', present: 18, total: 20 },
    { name: 'Finance', present: 8, total: 8 },
    { name: 'HR', present: 4, total: 5 },
  ],
  lateAbsentAlerts: [
    { id: '1', name: 'Rajesh K.', department: 'Sales', type: 'late', detail: 'Late 45min', action: 'Call' },
    { id: '2', name: 'Priya M.', department: 'Engineering', type: 'absent', detail: 'Absent', action: 'Message' },
    { id: '3', name: 'Amit S.', department: 'Finance', type: 'leave', detail: 'On Leave (planned)', action: null },
  ],
  calendarWeek: [
    { day: 'Mon', date: 'Mar 3', note: 'Team meeting 10AM', isHoliday: false },
    { day: 'Tue', date: 'Mar 4', note: null, isHoliday: false },
    { day: 'Wed', date: 'Mar 5', note: 'Public Holiday (Holi)', isHoliday: true },
    { day: 'Thu', date: 'Mar 6', note: null, isHoliday: false },
    { day: 'Fri', date: 'Mar 7', note: 'Half-day for all', isHoliday: false, isToday: true },
  ],
  trends: {
    overall30Days: 94,
    topPerformer: { name: 'Priya S.', rate: 98 },
    lowest: { name: 'Rajesh K.', rate: 82 },
    chart: [
      { week: 'W1 Feb', rate: 92 },
      { week: 'W2 Feb', rate: 93 },
      { week: 'W3 Feb', rate: 94 },
      { week: 'W4 Feb', rate: 95 },
      { week: 'W1 Mar', rate: 94 },
    ],
  },
  checkIns: [
    { time: '09:15', name: 'Priya S.', department: 'Engineering', isLate: false },
    { time: '09:22', name: 'Amit P.', department: 'Sales', isLate: false },
    { time: '10:05', name: 'Rajesh K.', department: 'Sales', isLate: true },
    { time: '09:08', name: 'Neha G.', department: 'Finance', isLate: false },
    { time: '09:45', name: 'Vikram S.', department: 'HR', isLate: false },
  ],
}

export default function HRAttendancePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const base = `/hr/${tenantId}/Attendance`

  return (
    <div className="space-y-5 pb-24">
      {/* ——— Header: Today's stats + actions ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-50">Today ({format(new Date(DEMO.today), 'MMM d')})</span>
            <span className="text-slate-600 dark:text-slate-400">
              Present: <strong className="text-green-600 dark:text-green-400">{DEMO.header.present}/{DEMO.header.total}</strong>
              {' · '}Late: <strong className="text-amber-600 dark:text-amber-400">{DEMO.header.late}</strong>
              {' · '}Absent: <strong className="text-red-600 dark:text-red-400">{DEMO.header.absent}</strong>
              {' · '}On Leave: <strong>{DEMO.header.onLeave}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`${base}/Mark`}>
              <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600">Mark Attendance</Button>
            </Link>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Export Today&apos;s Report</Button>
            <Link href={`${base}/Check-In`}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">Check In</Button>
            </Link>
            <Link href={`${base}/Calendar`}>
              <Button variant="ghost" size="sm" className="dark:text-slate-400"><Calendar className="h-4 w-4 mr-1" /> Calendar</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ——— Two-column: Today's Overview | Late/Absent Alert ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Users className="h-4 w-4" /> Today&apos;s Overview
            </CardTitle>
            <CardDescription className="text-xs">By department</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {DEMO.byDepartment.map((dept) => (
                <div key={dept.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-medium text-slate-900 dark:text-slate-50">{dept.name}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {dept.present}/{dept.total} Present
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="default" className="bg-green-600">Present</Badge>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">Late</Badge>
              <Badge variant="destructive">Absent</Badge>
              <Badge variant="outline">Leave</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Late / Absent Alert
            </CardTitle>
            <CardDescription className="text-xs">Urgent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO.lateAbsentAlerts.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">{a.name} <span className="text-slate-500 dark:text-slate-400 text-sm">({a.department})</span></p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.detail}</p>
                </div>
                {a.action && (
                  <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>
                    {a.action === 'Call' ? <Phone className="h-4 w-4 mr-1" /> : <MessageSquare className="h-4 w-4 mr-1" />}
                    {a.action}
                  </Button>
                )}
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Send Bulk Reminder</Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Reasons</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ——— Team Calendar (week view) ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Team Calendar
          </CardTitle>
          <CardDescription className="text-xs">Weekly view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {DEMO.calendarWeek.map((d) => (
              <div
                key={d.day}
                className={`min-w-[100px] rounded-xl p-3 text-center ${
                  d.isToday ? 'ring-2 ring-slate-400 dark:ring-slate-500 bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'
                }`}
              >
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{d.day}</p>
                <p className="font-semibold text-slate-900 dark:text-slate-50">{d.date}</p>
                {d.note && (
                  <p className={`text-xs mt-1 ${d.isHoliday ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {d.note}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Today</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Week</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Month</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Attendance Trends ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Attendance Trends
          </CardTitle>
          <CardDescription className="text-xs">30-day · Overall {DEMO.trends.overall30Days}%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Top performer</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50">{DEMO.trends.topPerformer.name} ({DEMO.trends.topPerformer.rate}%)</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Needs attention</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50">{DEMO.trends.lowest.name} ({DEMO.trends.lowest.rate}%)</p>
            </div>
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMO.trends.chart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="rate" fill="hsl(var(--primary))" name="Attendance %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Drill-down by Team</Button>
        </CardContent>
      </Card>

      {/* ——— Check-in History ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Check-in History</CardTitle>
          <CardDescription className="text-xs">Recent check-ins today</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {DEMO.checkIns.map((c, i) => (
              <li key={i} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-600 dark:text-slate-400 w-12">{c.time}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{c.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({c.department})</span>
                  {c.isLate && <Badge variant="secondary" className="text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200 text-xs">Late</Badge>}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Full Log</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Bulk Actions (sticky bottom) ——— */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Select employees:</span>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>All</Button>
            <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Late Today</Button>
            <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Low Attendance</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Mark Present</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Mark Absent</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Send Reminder</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Adjust Hours</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
