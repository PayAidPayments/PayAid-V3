'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageLoading } from '@/components/ui/loading'
import { format, isPast, addDays } from 'date-fns'
import { Check, Circle, AlertCircle, User, Calendar, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINR } from '@/lib/utils/formatINR'
import { cn } from '@/lib/utils/cn'

// Demo data for Priya Sharma, React Developer (used when API returns 404 or no instance)
const DEMO = {
  employeeName: 'Priya Sharma',
  role: 'React Developer',
  department: 'Engineering',
  team: 'Web Team',
  reportingTo: 'Amit Patel (Senior Engineer)',
  startDate: '2026-03-10',
  progressPct: 45,
  buddy: 'Amit Patel',
  hiringManager: 'Ravi Kumar',
  ctc: 900000,
  probationDays: 90,
  offerAccepted: '2026-03-05',
  documentsSigned: true,
  stats: { active: 3, completed: 8, avgDays: 18, thisWeek: 2, overdue: 1 },
  day1: [
    { id: 'd1', title: 'Laptop issued & setup', done: true },
    { id: 'd2', title: 'Email & accounts created', done: true },
    { id: 'd3', title: 'Company handbook signed', done: true },
    { id: 'd4', title: 'Org chart reviewed', done: true },
    { id: 'd5', title: 'First team meeting scheduled', done: true },
    { id: 'd6', title: 'HR orientation completed', done: true },
    { id: 'd7', title: 'Desk/seat assigned', done: false },
    { id: 'd8', title: 'Security badge issued', done: false },
  ],
  week1: [
    { id: 'w1', title: 'Project access granted', done: true },
    { id: 'w2', title: 'First goals assigned', done: true },
    { id: 'w3', title: '1:1 with manager completed', done: true },
    { id: 'w4', title: 'Team lunch attended', done: true },
    { id: 'w5', title: 'Training videos watched', done: false },
    { id: 'w6', title: 'First task assigned', done: false },
    { id: 'w7', title: 'Feedback session scheduled', done: false },
  ],
  milestones30: [
    { id: 'm1', title: 'Week 1 review completed', done: true },
    { id: 'm2', title: 'First deliverable submitted', done: false },
    { id: 'm3', title: '30‑day probation check‑in', done: false },
    { id: 'm4', title: 'Performance goals set', done: false },
    { id: 'm5', title: 'Equipment handoff complete', done: false },
  ],
  assignedTasks: [
    { id: 't1', title: 'Watch Security Training', due: '2026-03-12', assignee: 'new_hire', overdue: false },
    { id: 't2', title: 'Complete Expense Policy Quiz', due: '2026-03-11', assignee: 'new_hire', overdue: false },
    { id: 't3', title: 'Submit Bank Details', due: '2026-03-10', assignee: 'new_hire', overdue: true },
    { id: 't4', title: 'Schedule Week 1 1:1', due: '2026-03-17', assignee: 'manager', overdue: false },
  ],
  actionItems: [
    { text: 'Priya: Submit bank details (overdue 1 day)', priority: 'high' },
    { text: 'Manager: Schedule team intro (due tomorrow)', priority: 'high' },
    { text: 'HR: Issue security badge', priority: 'medium' },
  ],
}

type ChecklistItem = { id: string; title: string; done: boolean }

export default function OnboardingChecklistPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const { token } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: instance, isLoading } = useQuery({
    queryKey: ['onboarding-instance', id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/onboarding/instances/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to fetch')
      }
      return res.json()
    },
    enabled: !!token && !!id,
  })

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/hr/onboarding/instances/${id}/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to complete task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-instance', id] })
    },
  })

  const [localDay1, setLocalDay1] = useState<ChecklistItem[]>(DEMO.day1)
  const [localWeek1, setLocalWeek1] = useState<ChecklistItem[]>(DEMO.week1)
  const [localMilestones, setLocalMilestones] = useState<ChecklistItem[]>(DEMO.milestones30)

  function toggleLocal(list: ChecklistItem[], setList: React.Dispatch<React.SetStateAction<ChecklistItem[]>>, itemId: string) {
    setList((prev) => prev.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)))
  }

  const useDemo = !instance && !isLoading

  const instanceTasks = instance?.tasks ?? []
  const day1Tasks = instanceTasks.filter((t) => t.task.dueDaysRelative >= 0 && t.task.dueDaysRelative <= 1)
  const week1Tasks = instanceTasks.filter((t) => t.task.dueDaysRelative >= 2 && t.task.dueDaysRelative <= 7)
  const milestoneTasks = instanceTasks.filter((t) => t.task.dueDaysRelative >= 8 && t.task.dueDaysRelative <= 30)

  const displayName = instance?.employee ? `${instance.employee.firstName} ${instance.employee.lastName}` : DEMO.employeeName
  const role = instance?.employee?.designation?.name || DEMO.role
  const startDate = instance?.startDate ? format(new Date(instance.startDate), 'MMM d, yyyy') : format(new Date(DEMO.startDate), 'MMM d, yyyy')

  const completedDay1 = useDemo ? localDay1.filter((i) => i.done).length : day1Tasks.filter((t) => t.status === 'COMPLETED').length
  const totalDay1 = useDemo ? localDay1.length : day1Tasks.length || DEMO.day1.length
  const completedWeek1 = useDemo ? localWeek1.filter((i) => i.done).length : week1Tasks.filter((t) => t.status === 'COMPLETED').length
  const totalWeek1 = useDemo ? localWeek1.length : week1Tasks.length || DEMO.week1.length
  const completedMilestones = useDemo ? localMilestones.filter((i) => i.done).length : milestoneTasks.filter((t) => t.status === 'COMPLETED').length
  const totalMilestones = useDemo ? localMilestones.length : milestoneTasks.length || DEMO.milestones30.length

  const totalDone = completedDay1 + completedWeek1 + completedMilestones
  const totalAll = (totalDay1 + totalWeek1 + totalMilestones) || 1
  const progressPct = useDemo
    ? Math.round((totalDone / totalAll) * 100)
    : totalAll ? Math.round((totalDone / totalAll) * 100) : DEMO.progressPct

  const getDueBadge = (due: string) => {
    const d = new Date(due)
    if (isPast(d)) return { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' }
    const tomorrow = addDays(new Date(), 1)
    if (d.toDateString() === tomorrow.toDateString()) return { label: 'Tomorrow', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' }
    return { label: format(d, 'MMM d'), className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
  }

  if (isLoading) {
    return <PageLoading message="Loading onboarding..." fullScreen={false} />
  }

  return (
    <div className="space-y-5 pb-24">
      {/* ——— Header ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{displayName} ({role})</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Start: {startDate} · Progress: {progressPct}% · Buddy: {DEMO.buddy} · Hiring Manager: {DEMO.hiringManager}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Mark Complete</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Extend Deadline</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Archive Onboarding</Button>
            <Link href={`/hr/${tenantId}/Onboarding`}>
              <Button variant="ghost" size="sm" className="dark:text-slate-400"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ——— Two-column: New Hire Details | Onboarding Stats ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <User className="h-4 w-4" /> New Hire Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="text-slate-500 dark:text-slate-400">Role:</span> {role} · <span className="text-slate-500 dark:text-slate-400">Dept:</span> {instance?.employee?.department?.name ?? DEMO.department} · Team: {DEMO.team}</p>
            <p><span className="text-slate-500 dark:text-slate-400">Reporting to:</span> {instance?.employee?.manager ? `${instance.employee.manager.firstName} ${instance.employee.manager.lastName}` : DEMO.reportingTo}</p>
            <p><span className="text-slate-500 dark:text-slate-400">CTC:</span> {instance?.employee?.ctcAnnualInr ? formatINR(Number(instance.employee.ctcAnnualInr)) : formatINR(DEMO.ctc)} · Probation: {DEMO.probationDays} days</p>
            <p><span className="text-slate-500 dark:text-slate-400">Offer accepted:</span> {format(new Date(DEMO.offerAccepted), 'MMM d')} · Documents signed: {DEMO.documentsSigned ? '✓' : 'Pending'}</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Offer Letter</Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Employee File</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Onboarding Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Active: <strong>{DEMO.stats.active}</strong> · Completed: <strong>{DEMO.stats.completed}</strong> · Avg time: <strong>{DEMO.stats.avgDays} days</strong></p>
            <p>This week: <strong>{DEMO.stats.thisWeek}</strong> new hires · Overdue: <strong className="text-red-600 dark:text-red-400">{DEMO.stats.overdue}</strong> task</p>
            <Link href={`/hr/${tenantId}/Onboarding`}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">Onboarding Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ——— Day 1 Checklist ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Day 1 Checklist</CardTitle>
          <CardDescription className="text-xs">Status: {completedDay1}/{totalDay1} complete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {useDemo
            ? localDay1.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => toggleLocal(localDay1, setLocalDay1, item.id)}
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      item.done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                    )}
                  >
                    {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                  <span className={cn('text-sm', item.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-slate-50')}>{item.title}</span>
                </div>
              ))
            : day1Tasks.map((t) => {
                const done = t.status === 'COMPLETED'
                return (
                  <div key={t.id} className="flex items-center gap-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => !done && completeTaskMutation.mutate(t.task.id)}
                      disabled={done || completeTaskMutation.isPending}
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                    <span className={cn('text-sm', done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-slate-50')}>{t.task.title}</span>
                  </div>
                )
              })}
          {totalDay1 === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No Day 1 tasks in this template.</p>}
          <div className="flex gap-2 pt-3">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Mark All Complete</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Print Checklist</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Week 1 Checklist ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Week 1 Checklist</CardTitle>
          <CardDescription className="text-xs">Status: {completedWeek1}/{totalWeek1} complete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {useDemo
            ? localWeek1.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => toggleLocal(localWeek1, setLocalWeek1, item.id)}
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      item.done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                    )}
                  >
                    {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                  <span className={cn('text-sm', item.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-slate-50')}>{item.title}</span>
                </div>
              ))
            : week1Tasks.map((t) => {
                const done = t.status === 'COMPLETED'
                return (
                  <div key={t.id} className="flex items-center gap-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => !done && completeTaskMutation.mutate(t.task.id)}
                      disabled={done || completeTaskMutation.isPending}
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                    <span className={cn('text-sm', done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-slate-50')}>{t.task.title}</span>
                  </div>
                )
              })}
          {totalWeek1 === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No Week 1 tasks in this template.</p>}
          <div className="flex gap-2 pt-3">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Manager Actions</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>New Hire Actions</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— 30‑Day Milestones ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">30‑Day Milestones</CardTitle>
          <CardDescription className="text-xs">Status: {completedMilestones}/{totalMilestones} complete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {useDemo
            ? localMilestones.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => toggleLocal(localMilestones, setLocalMilestones, item.id)}
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      item.done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                    )}
                  >
                    {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                  <span className={cn('text-sm', item.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-slate-50')}>{item.title}</span>
                </div>
              ))
            : milestoneTasks.map((t) => {
                const done = t.status === 'COMPLETED'
                return (
                  <div key={t.id} className="flex items-center gap-3 py-1.5">
                    <button
                      type="button"
                      onClick={() => !done && completeTaskMutation.mutate(t.task.id)}
                      disabled={done || completeTaskMutation.isPending}
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                    <span className={cn('text-sm', done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-slate-50')}>{t.task.title}</span>
                  </div>
                )
              })}
          {totalMilestones === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No 30‑day tasks in this template.</p>}
          <Button variant="outline" size="sm" className="mt-2 dark:border-slate-600 dark:text-slate-300" disabled>Milestone Report</Button>
        </CardContent>
      </Card>

      {/* ——— Assigned Tasks ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Assigned Tasks</CardTitle>
          <CardDescription className="text-xs">Open tasks · Manager tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEMO.assignedTasks.filter((t) => t.assignee === 'new_hire').map((t) => {
            const badge = getDueBadge(t.due)
            return (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">{t.title}</p>
                  <Badge variant="secondary" className={cn('text-xs mt-1', badge.className)}>{badge.label}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Mark Done</Button>
                  {t.title.includes('Quiz') && <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Take Quiz</Button>}
                  {t.title.includes('Bank') && <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Upload</Button>}
                </div>
              </div>
            )
          })}
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">Manager tasks (3)</p>
          {DEMO.assignedTasks.filter((t) => t.assignee === 'manager').map((t) => {
            const badge = getDueBadge(t.due)
            return (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">{t.title}</p>
                  <Badge variant="secondary" className={cn('text-xs mt-1', badge.className)}>{badge.label}</Badge>
                </div>
              </div>
            )
          })}
          <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Assign New Task</Button>
        </CardContent>
      </Card>

      {/* ——— Action Items (sticky bottom) ——— */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-slate-900 dark:text-slate-50">Priority actions</span>
          </div>
          <ul className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            {DEMO.actionItems.map((item, i) => (
              <li key={i} className={item.priority === 'high' ? 'text-amber-600 dark:text-amber-400' : ''}>{item.text}</li>
            ))}
          </ul>
          <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Take Action</Button>
        </div>
      </div>
    </div>
  )
}
