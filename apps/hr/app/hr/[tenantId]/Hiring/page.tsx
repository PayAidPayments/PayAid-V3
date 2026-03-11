'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Briefcase,
  Users,
  FileText,
  Calendar,
  Plus,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { formatINR } from '@/lib/utils/formatINR'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

// Demo data for hiring pipeline (replace with API)
const DEMO = {
  header: { activeRequisitions: 4, candidates: 23, interviewsScheduled: 8, offersExtended: 2 },
  openPositions: [
    { id: '1', title: 'Senior Sales Rep', applicants: 12, stage: 'Interviewing', href: 'Job-Requisitions/1' },
    { id: '2', title: 'React Developer', applicants: 8, stage: 'Screening', href: 'Job-Requisitions/2' },
    { id: '3', title: 'Accountant', applicants: 5, stage: 'Closed', href: 'Job-Requisitions/3' },
    { id: '4', title: 'Marketing Manager', applicants: 0, stage: 'Draft', href: 'Job-Requisitions/4' },
  ],
  pipelineStats: {
    applicants: 23,
    applicantsChange: 5,
    interviewConversion: 35,
    offerAcceptance: 75,
    timeToHireDays: 18,
    timeToHireTarget: 14,
    costPerHire: 28500,
  },
  pipeline: {
    screening: [
      { id: 'c1', name: 'Amit Patel', role: 'Sales Rep', source: 'LinkedIn', score: 87, lastAction: 'Applied Mar 5' },
      { id: 'c2', name: 'Kavita N.', role: 'React Dev', source: 'Referral', score: 78, lastAction: 'Screening Mar 4' },
    ],
    interview: [
      { id: 'c3', name: 'Priya Sharma', role: 'React Developer', source: 'Naukri', score: 92, lastAction: 'Interview Mar 8' },
      { id: 'c4', name: 'Rahul M.', role: 'Sales Rep', source: 'LinkedIn', score: 81, lastAction: 'Interview Mar 7' },
    ],
    offer: [
      { id: 'c5', name: 'Neha Gupta', role: 'Accountant', source: 'Referral', score: 81, lastAction: 'Offer extended' },
      { id: 'c6', name: 'Vikram S.', role: 'Sales Rep', source: 'LinkedIn', score: 79, lastAction: 'Offer sent' },
    ],
    hired: [{ id: 'c7', name: 'Anita K.', role: 'Accountant', source: 'Naukri', score: 85, lastAction: 'Joined Mar 1' }],
  },
  topCandidates: [
    { name: 'Priya Sharma', score: 92, role: 'React Developer', status: 'Interview scheduled' },
    { name: 'Amit Patel', score: 87, role: 'Sales Rep', status: 'Phone screen pending' },
    { name: 'Neha Gupta', score: 81, role: 'Accountant', status: 'Offer extended' },
  ],
  interviewsThisWeek: [
    { name: 'Amit Patel', role: 'Sales Rep', when: '2026-03-10T14:00:00', id: 'i1' },
    { name: 'Priya Sharma', role: 'React Dev', when: '2026-03-12T11:00:00', id: 'i2' },
  ],
  velocityStages: [
    { stage: 'Posted → Screened', days: 3 },
    { stage: 'Screened → Interview', days: 5 },
    { stage: 'Interview → Offer', days: 7 },
  ],
  velocityChart: [
    { month: 'Oct', days: 22 },
    { month: 'Nov', days: 20 },
    { month: 'Dec', days: 19 },
    { month: 'Jan', days: 18 },
    { month: 'Feb', days: 17 },
    { month: 'Mar', days: 18 },
  ],
  actionItems: [
    { label: 'Review 8 screening candidates', priority: 'high' },
    { label: 'Schedule phone screen for Amit Patel', priority: 'high' },
    { label: 'Send offer to Priya Sharma', priority: 'medium' },
    { label: 'Close filled positions', priority: 'low' },
  ],
}

export default function HRHiringPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const base = `/hr/${tenantId}/Hiring`

  return (
    <div className="space-y-5 pb-24">
      {/* ——— Header: Pipeline overview + actions ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-50">Hiring Pipeline</span>
            <span className="text-slate-600 dark:text-slate-400">
              Requisitions: <strong>{DEMO.header.activeRequisitions}</strong> · Candidates: <strong>{DEMO.header.candidates}</strong> · Interviews: <strong>{DEMO.header.interviewsScheduled}</strong> · Offers: <strong>{DEMO.header.offersExtended}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`${base}/Job-Requisitions/New`}>
              <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600">
                <Plus className="h-4 w-4 mr-1" /> Post New Job
              </Button>
            </Link>
            <Link href={`${base}/Candidates`}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">View All Candidates</Button>
            </Link>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Hiring Report</Button>
          </div>
        </div>
      </div>

      {/* ——— Two-column: Open Positions | Pipeline Stats ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Open Positions
            </CardTitle>
            <CardDescription className="text-xs">Job requisition dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO.openPositions.map((job) => (
              <Link key={job.id} href={`${base}/${job.href}`}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">{job.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{job.applicants} applicants</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{job.stage}</Badge>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
            <Link href={`${base}/Job-Requisitions`}>
              <Button variant="ghost" size="sm" className="w-full mt-2 dark:text-slate-400">View All Positions</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Pipeline Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Applicants</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{DEMO.pipelineStats.applicants} <span className="text-green-600 dark:text-green-400 text-sm">+{DEMO.pipelineStats.applicantsChange} this week</span></p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Interview conversion</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{DEMO.pipelineStats.interviewConversion}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Offer acceptance</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{DEMO.pipelineStats.offerAcceptance}%</p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Time to hire</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{DEMO.pipelineStats.timeToHireDays} days <span className="text-amber-600 dark:text-amber-400 text-xs">(target {DEMO.pipelineStats.timeToHireTarget})</span></p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Cost per hire: {formatINR(DEMO.pipelineStats.costPerHire)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ——— Candidate Pipeline (mini Kanban) ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Candidate Pipeline</CardTitle>
          <CardDescription className="text-xs">Screening → Interview → Offer → Hired</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 overflow-x-auto">
            {[
              { key: 'screening', title: 'Screening', count: DEMO.pipeline.screening.length, items: DEMO.pipeline.screening },
              { key: 'interview', title: 'Interview', count: DEMO.pipeline.interview.length, items: DEMO.pipeline.interview },
              { key: 'offer', title: 'Offer', count: DEMO.pipeline.offer.length, items: DEMO.pipeline.offer },
              { key: 'hired', title: 'Hired', count: DEMO.pipeline.hired.length, items: DEMO.pipeline.hired },
            ].map((col) => (
              <div key={col.key} className="min-w-[200px] rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{col.title} ({col.count})</p>
                <div className="space-y-2">
                  {col.items.map((c) => (
                    <Link key={c.id} href={`${base}/Candidates/${c.id}`}>
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                        <p className="font-medium text-slate-900 dark:text-slate-50 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{c.role} · {c.source}</p>
                        <p className="text-xs mt-1">Score {c.score}% · {c.lastAction}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ——— Top Candidates ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Top Candidates</CardTitle>
          <CardDescription className="text-xs">Ranked by AI score</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {DEMO.topCandidates.map((c, i) => (
              <li key={i}>
                <Link href={`${base}/Candidates`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200">{i + 1}</span>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{c.name} <span className="text-slate-500 dark:text-slate-400 font-normal">({c.score}%)</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{c.role} · {c.status}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`${base}/Candidates`}>
            <Button variant="ghost" size="sm" className="mt-2 dark:text-slate-400">View Full Candidate List</Button>
          </Link>
        </CardContent>
      </Card>

      {/* ——— Interview Schedule ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Interview Schedule
          </CardTitle>
          <CardDescription className="text-xs">This week · Upcoming: 6 interviews</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DEMO.interviewsThisWeek.map((i) => (
            <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-50">{format(new Date(i.when), 'EEE MMM d, h:mm a')}: {i.name} ({i.role})</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Reschedule</Button>
                <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Add Notes</Button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`${base}/Interviews`}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">Calendar View</Button>
            </Link>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Bulk Schedule</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Hiring Velocity ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Clock className="h-4 w-4" /> Hiring Velocity
          </CardTitle>
          <CardDescription className="text-xs">Avg time per stage · Trend (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DEMO.velocityStages.map((s, i) => (
              <div key={i} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.stage}</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{s.days} days</p>
              </div>
            ))}
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DEMO.velocityChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="days" stroke="hsl(var(--primary))" strokeWidth={2} name="Time to hire (days)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ——— Bottom action bar ——— */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-slate-900 dark:text-slate-50">{DEMO.actionItems.length} actions needed</span>
          </div>
          <ul className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            {DEMO.actionItems.map((item, i) => (
              <li key={i} className={item.priority === 'high' ? 'text-amber-600 dark:text-amber-400' : ''}>{item.label}</li>
            ))}
          </ul>
          <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Take action</Button>
        </div>
      </div>
    </div>
  )
}
