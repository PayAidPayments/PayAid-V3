'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bell, Calendar, User, FileText, Loader2, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth'

type Reminder = {
  id: string
  type: 'PROBATION_END' | 'CONTRACT_EXPIRY' | 'REVIEW_DUE'
  title: string
  dueDate: string | null
  meta?: Record<string, string>
}

export default function HRRemindersPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [probationCount, setProbationCount] = useState(0)
  const [contractCount, setContractCount] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    if (!tenantId || !token) return
    const timeoutId = globalThis.setTimeout(() => {
      setLoading(true)
      fetch(`/api/hr/reminders?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : { reminders: [], probationCount: 0, contractCount: 0, reviewCount: 0 }))
        .then((data) => {
          setReminders(data.reminders || [])
          setProbationCount(data.probationCount ?? 0)
          setContractCount(data.contractCount ?? 0)
          setReviewCount(data.reviewCount ?? 0)
        })
        .finally(() => setLoading(false))
    }, 0)
    return () => globalThis.clearTimeout(timeoutId)
  }, [tenantId, token, days])

  const allReminders = [...reminders].sort(
    (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')
  )

  const icon = (r: Reminder) => {
    if (r.type === 'PROBATION_END') return <User className="h-4 w-4 text-amber-500" />
    if (r.type === 'CONTRACT_EXPIRY') return <FileText className="h-4 w-4 text-blue-500" />
    return <Calendar className="h-4 w-4 text-green-500" />
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
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Proactive reminders</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Probation, reviews, contracts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm px-3 py-2"
            >
              <option value={7}>Next 7 days</option>
              <option value={30}>Next 30 days</option>
              <option value={60}>Next 60 days</option>
              <option value={90}>Next 90 days</option>
            </select>
            <Badge variant="secondary" className="text-xs">{allReminders.length} reminders</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <User className="h-4 w-4" /> Probation ending
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{probationCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">in next {days} days</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <FileText className="h-4 w-4" /> Contracts expiring
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{contractCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">in next {days} days</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <ClipboardList className="h-4 w-4" /> Reviews due
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{reviewCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">from review cycles (DB)</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <Bell className="h-4 w-4" /> Total
            </div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{allReminders.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">actionable</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Bell className="h-4 w-4" /> Upcoming
          </CardTitle>
          <CardDescription className="text-xs">Sorted by due date</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : allReminders.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No reminders in this window</p>
              <p className="text-sm mt-1">Change the period or add more data.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {allReminders.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {icon(r)}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50 text-sm">{r.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {r.type.replace('_', ' ')} {r.dueDate ? `· Due ${format(new Date(r.dueDate), 'MMM d, yyyy')}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">{r.type}</Badge>
                    {r.type === 'PROBATION_END' && (
                      <Link href={`/hr/${tenantId}/Employees/${r.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs dark:text-slate-400">View</Button>
                      </Link>
                    )}
                    {r.type === 'REVIEW_DUE' && (
                      <Link href={`/hr/${tenantId}/Performance`}>
                        <Button variant="ghost" size="sm" className="text-xs dark:text-slate-400">Open</Button>
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
