'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import {
  LogOut,
  User,
  Check,
  Circle,
  AlertCircle,
  ArrowLeft,
  Laptop,
  MessageSquare,
  Calculator,
} from 'lucide-react'
import { formatINR } from '@/lib/utils/formatINR'
import { cn } from '@/lib/utils/cn'

// Demo data for Rajesh Kumar, Sales Rep (replace with API)
const DEMO = {
  employeeName: 'Rajesh Kumar',
  role: 'Sales Rep',
  department: 'Sales',
  exitDate: '2026-03-20',
  reason: 'Better Opportunity',
  progressPct: 68,
  settlementPending: 45200,
  hrOwner: 'Priya Sharma',
  manager: 'Amit Patel',
  tenure: '14 months',
  noticeGiven: '2026-03-01',
  noticeServed: true,
  exitInterviewDate: '2026-03-18',
  finalSalary: 45200,
  relievingLetter: 'Draft',
  clearance: { total: 25, done: 17, hr: { done: 8, total: 10 }, it: { done: 4, total: 6 }, finance: { done: 3, total: 5 }, manager: { done: 2, total: 4 }, overdue: 2 },
  checklist: {
    hr: [
      { id: 'hr1', title: 'Collect resignation letter', done: true },
      { id: 'hr2', title: 'Conduct exit interview', done: true },
      { id: 'hr3', title: 'Issue experience certificate', done: true },
      { id: 'hr4', title: 'Full & final settlement', done: false, overdue: false },
    ],
    it: [
      { id: 'it1', title: 'Laptop return', done: true },
      { id: 'it2', title: 'Email deactivation', done: true },
      { id: 'it3', title: 'Access revocation', done: true },
      { id: 'it4', title: 'Password handoff', done: false, overdue: true },
    ],
    finance: [
      { id: 'fin1', title: 'Final payslip generated', done: true },
      { id: 'fin2', title: 'No dues clearance', done: true },
      { id: 'fin3', title: 'PF/Gratuity transfer', done: false },
    ],
    manager: [
      { id: 'm1', title: 'Client handoff complete', done: true },
      { id: 'm2', title: 'Knowledge transfer doc', done: true },
      { id: 'm3', title: 'Pipeline handoff', done: false, overdue: true },
    ],
  },
  knowledgeTransfer: {
    items: ['ABC Corp relationship (key client)', 'Q2 sales pipeline handoff', 'CRM custom reports folder'],
    statusPct: 60,
  },
  assets: {
    physical: [
      { name: 'Laptop MacBook Pro', status: 'Pending Return', overdue: true },
      { name: 'Monitor Dell 24"', status: 'Collected ✓', overdue: false },
      { name: 'ID Card', status: 'Collected ✓', overdue: false },
    ],
    digital: [
      { name: 'Email archive', status: 'Exported' },
      { name: 'Drive folder access', status: 'Transferred' },
    ],
  },
  feedback: {
    nps: 6,
    strengths: 'Great with clients',
    reasons: 'Better pay + growth',
    recommend: 5,
    openFeedback: 'More training needed',
    interviewDate: '2026-03-18',
  },
  actionItems: [
    { text: 'Rajesh: Return laptop by Mar 15', critical: true },
    { text: 'IT: Deactivate email access Mar 20', critical: true },
    { text: 'Finance: Process final settlement Mar 18', critical: true },
  ],
  // Full & Final calculator (demo)
  fnf: {
    earnedSalary: 38400,
    leaveEncashment: 6800,
    grossPayable: 45200,
    deductions: { tds: 4200, pf: 0, pt: 200, other: 0 },
    recoveries: { advance: 0, loan: 0, excessLeave: 0 },
    netPayable: 40800,
    notes: 'TDS as per applicable slab; no PF deduction in final month.',
  },
}

export default function OffboardingDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [localChecklist, setLocalChecklist] = useState(DEMO.checklist)

  const toggle = (section: keyof typeof localChecklist, id: string) => {
    setLocalChecklist((prev) => ({
      ...prev,
      [section]: prev[section].map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    }))
  }

  const totalDone = Object.values(localChecklist).flat().filter((i) => i.done).length
  const totalAll = Object.values(localChecklist).flat().length
  const progressPct = totalAll ? Math.round((totalDone / totalAll) * 100) : DEMO.progressPct

  return (
    <div className="space-y-5 pb-24">
      {/* ——— Header ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{DEMO.employeeName} ({DEMO.role})</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Exit: {format(new Date(DEMO.exitDate), 'MMM d')} · Reason: {DEMO.reason} · Progress: {progressPct}% · Final settlement: {formatINR(DEMO.settlementPending)} pending
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              HR Owner: {DEMO.hrOwner} · Manager: {DEMO.manager}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Complete Exit</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Extend Deadline</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Rehire Candidate</Button>
            <Link href={`/hr/${tenantId}/Offboarding`}>
              <Button variant="ghost" size="sm" className="dark:text-slate-400"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ——— Two-column: Exit Details | Clearance Status ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <User className="h-4 w-4" /> Exit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-slate-500 dark:text-slate-400">Role:</span> {DEMO.role} · <span className="text-slate-500 dark:text-slate-400">Dept:</span> {DEMO.department} · Tenure: {DEMO.tenure}</p>
            <p><span className="text-slate-500 dark:text-slate-400">Last day:</span> {format(new Date(DEMO.exitDate), 'MMM d, yyyy')} · Notice given: {format(new Date(DEMO.noticeGiven), 'MMM d')} (served ✓)</p>
            <p><span className="text-slate-500 dark:text-slate-400">Exit interview:</span> Scheduled {format(new Date(DEMO.exitInterviewDate), 'MMM d')}</p>
            <p><span className="text-slate-500 dark:text-slate-400">Final salary:</span> {formatINR(DEMO.finalSalary)} · Relieving letter: {DEMO.relievingLetter}</p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Resignation Letter</Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Generate Relieving Letter</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Clearance Status
            </CardTitle>
            <CardDescription className="text-xs">Overall: {totalDone}/{totalAll} complete</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <span>HR</span>
                <span className="font-medium text-green-600 dark:text-green-400">{localChecklist.hr.filter((i) => i.done).length}/{localChecklist.hr.length} ✓</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <span>IT</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{localChecklist.it.filter((i) => i.done).length}/{localChecklist.it.length} ⚠️</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <span>Finance</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">{localChecklist.finance.filter((i) => i.done).length}/{localChecklist.finance.length} ⏳</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <span>Manager</span>
                <span className="font-medium text-slate-600 dark:text-slate-400">{localChecklist.manager.filter((i) => i.done).length}/{localChecklist.manager.length}</span>
              </div>
            </div>
            <p className="text-xs text-red-600 dark:text-red-400">Overdue: {DEMO.clearance.overdue} items (laptop return, client handoff)</p>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Print Clearance Form</Button>
          </CardContent>
        </Card>
      </div>

      {/* ——— Full & Final Calculator ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Full & Final Calculator
          </CardTitle>
          <CardDescription className="text-xs">Earned salary, leave encashment, deductions & recoveries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Earnings</p>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Earned salary (prorated)</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">{formatINR(DEMO.fnf.earnedSalary)}</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Leave encashment</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">{formatINR(DEMO.fnf.leaveEncashment)}</span>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 flex justify-between border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gross payable</span>
                <span className="font-semibold text-green-700 dark:text-green-400">{formatINR(DEMO.fnf.grossPayable)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Deductions & Recoveries</p>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">TDS</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">−{formatINR(DEMO.fnf.deductions.tds)}</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">PF · PT · Other</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">−{formatINR(DEMO.fnf.deductions.pf + DEMO.fnf.deductions.pt + DEMO.fnf.deductions.other)}</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2 flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Recoveries (advance / loan)</span>
                <span className="font-medium text-slate-900 dark:text-slate-50">−{formatINR(DEMO.fnf.recoveries.advance + DEMO.fnf.recoveries.loan + DEMO.fnf.recoveries.excessLeave)}</span>
              </div>
              <div className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 flex justify-between border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-50">Net payable</span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-50">{formatINR(DEMO.fnf.netPayable)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{DEMO.fnf.notes}</p>
          <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Export F&F Statement</Button>
        </CardContent>
      </Card>

      {/* ——— Exit Checklist (by owner) ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Exit Checklist</CardTitle>
          <CardDescription className="text-xs">By owner: HR · IT · Finance · Manager</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(['hr', 'it', 'finance', 'manager'] as const).map((section) => {
            const items = localChecklist[section]
            const doneCount = items.filter((i) => i.done).length
            const label = section.charAt(0).toUpperCase() + section.slice(1)
            return (
              <div key={section}>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  {label} ({doneCount}/{items.length})
                </p>
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-1">
                      <button
                        type="button"
                        onClick={() => toggle(section, item.id)}
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                          item.done ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'
                        )}
                      >
                        {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                      <span className={cn('text-sm', item.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-slate-50')}>
                        {item.title}
                      </span>
                      {item.overdue && !item.done && (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Mark Complete</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Assign Owner</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Knowledge Transfer ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Knowledge Transfer</CardTitle>
          <CardDescription className="text-xs">Critical items · Status: {DEMO.knowledgeTransfer.statusPct}% complete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Critical items</p>
          <ul className="list-disc list-inside text-sm text-slate-700 dark:text-slate-300 space-y-1">
            {DEMO.knowledgeTransfer.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Progress value={DEMO.knowledgeTransfer.statusPct} className="h-2 flex-1 max-w-[200px]" />
            <span className="text-sm font-medium">{DEMO.knowledgeTransfer.statusPct}%</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Knowledge Transfer Doc</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Client Contact List</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Review KT Doc</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Asset Recovery ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Laptop className="h-4 w-4" /> Asset Recovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Physical assets</p>
            <ul className="space-y-2">
              {DEMO.assets.physical.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{a.name}</span>
                  <Badge variant={a.status.includes('Collected') ? 'default' : a.overdue ? 'destructive' : 'secondary'} className="text-xs">
                    {a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Digital assets</p>
            <ul className="space-y-2">
              {DEMO.assets.digital.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{a.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{a.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Asset Inventory</Button>
        </CardContent>
      </Card>

      {/* ——— Exit Feedback ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Exit Feedback
          </CardTitle>
          <CardDescription className="text-xs">Exit interview ({format(new Date(DEMO.feedback.interviewDate), 'MMM d')})</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">NPS score</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{DEMO.feedback.nps}/10</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Likelihood to recommend</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{DEMO.feedback.recommend}/10</p>
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            <p><span className="text-slate-500 dark:text-slate-400">Strengths:</span> &ldquo;{DEMO.feedback.strengths}&rdquo;</p>
            <p><span className="text-slate-500 dark:text-slate-400">Reasons for leaving:</span> &ldquo;{DEMO.feedback.reasons}&rdquo;</p>
            <p><span className="text-slate-500 dark:text-slate-400">Open feedback:</span> &ldquo;{DEMO.feedback.openFeedback}&rdquo;</p>
          </div>
          <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Full Feedback Report</Button>
        </CardContent>
      </Card>

      {/* ——— Action Items (sticky bottom) ——— */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-slate-900 dark:text-slate-50">Critical ({DEMO.actionItems.length})</span>
          </div>
          <ul className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            {DEMO.actionItems.map((item, i) => (
              <li key={i} className={item.critical ? 'text-amber-600 dark:text-amber-400' : ''}>{item.text}</li>
            ))}
          </ul>
          <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Take Action</Button>
        </div>
      </div>
    </div>
  )
}
