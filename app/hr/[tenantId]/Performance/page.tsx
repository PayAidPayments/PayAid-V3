'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import {
  Target,
  Users,
  Award,
  TrendingUp,
  Calendar,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  BarChart3,
  Scale,
  ClipboardList,
} from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

// Demo data for Q1 2026 cycle (replace with API)
const DEMO = {
  cycle: {
    name: 'Q1 2026',
    start: '2026-03-01',
    end: '2026-03-15',
    pending: 12,
    total: 28,
    completed: 16,
    avgScore: 4.1,
    topPerformer: { name: 'Priya S.', score: 4.8 },
    progressPct: 57,
    phases: [
      { name: 'Self Assessment', note: 'Open until Mar 10' },
      { name: 'Manager Review', note: 'Mar 11–14' },
      { name: '360° Feedback', note: 'Mar 12–15' },
      { name: 'Calibration Meeting', note: 'Mar 16' },
    ],
  },
  distribution: [
    { range: '4.5–5.0', count: 8, fill: '#22c55e' },
    { range: '4.0–4.4', count: 12, fill: '#3b82f6' },
    { range: '3.5–3.9', count: 6, fill: '#eab308' },
    { range: '<3.5', count: 2, fill: '#ef4444' },
  ],
  byDepartment: [
    { name: 'Sales', avg: 4.2 },
    { name: 'Engineering', avg: 4.0 },
    { name: 'Finance', avg: 4.4 },
  ],
  individualReviews: [
    { id: '1', name: 'Priya S.', score: 4.8, status: 'Calibrated ✓', tag: 'Promotion Eligible' },
    { id: '2', name: 'Neha G.', score: 4.5, status: 'Calibrated ✓', tag: null },
    { id: '3', name: 'Amit P.', score: 3.9, status: 'Pending Manager', tag: 'Coaching Needed' },
    { id: '4', name: 'Vikram S.', score: 3.7, status: 'Pending Manager', tag: null },
    { id: '5', name: 'Rajesh K.', score: 3.2, status: 'Pending', tag: 'PIP Recommended' },
    { id: '6', name: 'Kavita N.', score: 4.1, status: 'Calibrated ✓', tag: null },
  ],
  feedback360: {
    recent: [
      { quote: 'Priya consistently exceeds targets and mentors juniors', source: 'Manager' },
      { quote: 'Great technical skills, communication needs work', source: 'Peer' },
    ],
    questions: [
      { q: 'Delivers high‑quality work', avg: 4.6 },
      { q: 'Collaborates effectively', avg: 4.2 },
      { q: 'Takes initiative', avg: 4.5 },
    ],
  },
  goalTracking: {
    company: 78,
    department: 82,
    individual: 76,
  },
  trends: {
    q4Score: 4.05,
    q1Score: 4.12,
    changePct: 1.7,
    engagementScore: 78,
    engagementChange: 3,
    chart: [
      { quarter: 'Q2 25', score: 3.95 },
      { quarter: 'Q3 25', score: 4.0 },
      { quarter: 'Q4 25', score: 4.05 },
      { quarter: 'Q1 26', score: 4.12 },
    ],
    themesPositive: ['Reliable', 'Customer‑focused'],
    themesImprovement: ['Delegation', 'Planning'],
  },
  actionItems: [
    { label: '12 self‑assessments pending (send reminders)', priority: 'high' },
    { label: 'Calibrate 4 outlier scores', priority: 'high' },
    { label: 'Schedule 1:1s for 3 low performers', priority: 'medium' },
    { label: 'Plan promotions for top 5', priority: 'medium' },
  ],
  continuousFeedback: [
    { date: '2026-03-06', text: 'Great job closing the ABC deal!', source: 'Manager', type: 'praise' },
    { date: '2026-03-05', text: 'Code review feedback appreciated', source: 'Peer', type: 'praise' },
    { date: '2026-03-04', text: 'Needs Improvement: Planning ahead better', source: 'Client', type: 'improvement' },
  ],
  calibration: {
    meetingDate: '2026-03-16',
    outliers: [
      { id: '1', name: 'Priya S.', score: 4.8, reason: 'Top performer – confirm band' },
      { id: '5', name: 'Rajesh K.', score: 3.2, reason: 'Below threshold – PIP or coaching' },
      { id: '4', name: 'Vikram S.', score: 3.7, reason: 'Borderline – align with manager' },
    ],
  },
  pip: {
    active: [
      { id: 'pip1', name: 'Suresh M.', startDate: '2026-02-01', endDate: '2026-04-30', status: 'In Progress', progress: 40 },
    ],
    recommended: [
      { id: '5', name: 'Rajesh K.', score: 3.2, reason: 'Consistent low scores, missed targets' },
    ],
  },
}

export default function HRPerformancePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const base = `/hr/${tenantId}/Performance`

  return (
    <div className="space-y-5 pb-24">
      {/* ——— Header: Current cycle, pending/completed, avg score + actions ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-50">Current Cycle: {DEMO.cycle.name} ({format(new Date(DEMO.cycle.start), 'MMM d')}–{format(new Date(DEMO.cycle.end), 'MMM d')})</span>
            <span className="text-slate-600 dark:text-slate-400">
              Pending: <strong>{DEMO.cycle.pending}/{DEMO.cycle.total}</strong> · Completed: <strong>{DEMO.cycle.completed}/{DEMO.cycle.total}</strong>
              {' · '}Avg: <strong>{DEMO.cycle.avgScore}/5</strong> · Top: {DEMO.cycle.topPerformer.name} ({DEMO.cycle.topPerformer.score})
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`${base}/Reviews/new`}>
              <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600">Start New Cycle</Button>
            </Link>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Bulk Reminders</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Export Report</Button>
          </div>
        </div>
      </div>

      {/* ——— Two-column: Review Cycle | Team Performance ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Review Cycle
            </CardTitle>
            <CardDescription className="text-xs">{DEMO.cycle.name} (Active)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {DEMO.cycle.phases.map((p, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{p.note}</span>
                </li>
              ))}
            </ul>
            <div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Progress</span>
                <span>{DEMO.cycle.progressPct}% complete</span>
              </div>
              <Progress value={DEMO.cycle.progressPct} className="h-2" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Cycle Settings</Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Past Cycles</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Team Performance
            </CardTitle>
            <CardDescription className="text-xs">Score distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEMO.distribution} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="range" width={55} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">By department</p>
              <div className="flex flex-wrap gap-3">
                {DEMO.byDepartment.map((d) => (
                  <span key={d.name} className="text-sm text-slate-700 dark:text-slate-300">{d.name}: <strong>{d.avg}</strong> avg</span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Drill‑down</Button>
              <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Compare vs Last Quarter</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ——— Individual Reviews ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Individual Reviews</CardTitle>
          <CardDescription className="text-xs">Quick status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEMO.individualReviews.map((r) => (
              <Link key={r.id} href={`${base}/Reviews/${r.id}`}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-50">{r.name} <span className="text-slate-500 dark:text-slate-400 font-normal">[{r.score}]</span></p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="secondary" className="text-xs">{r.status}</Badge>
                      {r.tag && <Badge variant="outline" className="text-xs">{r.tag}</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 dark:text-slate-400" disabled>Full Review List</Button>
        </CardContent>
      </Card>

      {/* ——— Calibration ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Scale className="h-4 w-4" /> Calibration
          </CardTitle>
          <CardDescription className="text-xs">Outliers to review · Meeting: {format(new Date(DEMO.calibration.meetingDate), 'MMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-2">
            {DEMO.calibration.outliers.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">{o.name} <span className="text-slate-500 dark:text-slate-400 font-normal">[{o.score}]</span></p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{o.reason}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Approve band</Button>
                  <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Flag PIP</Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Open Calibration Meeting</Button>
            <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Compare Bands</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— PIP (Performance Improvement Plan) ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Performance Improvement Plan (PIP)
          </CardTitle>
          <CardDescription className="text-xs">Active PIPs and recommended</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Active PIPs</p>
            {DEMO.pip.active.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No active PIPs</p>
            ) : (
              <ul className="space-y-2">
                {DEMO.pip.active.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{p.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(p.startDate), 'MMM d')} – {format(new Date(p.endDate), 'MMM d')} · {p.status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progress} className="w-20 h-2" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{p.progress}%</span>
                      <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>View PIP</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Recommended for PIP</p>
            {DEMO.pip.recommended.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">None</p>
            ) : (
              <ul className="space-y-2">
                {DEMO.pip.recommended.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">{r.name} <span className="text-slate-500 dark:text-slate-400 font-normal">[{r.score}]</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.reason}</p>
                    </div>
                    <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Create PIP</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View All PIPs</Button>
        </CardContent>
      </Card>

      {/* ——— 360° Feedback ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="h-4 w-4" /> 360° Feedback
          </CardTitle>
          <CardDescription className="text-xs">Recent feedback · Sample questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Recent feedback</p>
            <ul className="space-y-2">
              {DEMO.feedback360.recent.map((f, i) => (
                <li key={i} className="pl-3 border-l-2 border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300">
                  &ldquo;{f.quote}&rdquo; <span className="text-slate-500 dark:text-slate-400">– {f.source}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Sample questions (avg rating)</p>
            <ul className="space-y-1.5 text-sm">
              {DEMO.feedback360.questions.map((q, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">{i + 1}. {q.q}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{q.avg} avg</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Manage Questions</Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Anonymity Settings</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Continuous Feedback (bonus section) ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Recent Praise / Feedback
          </CardTitle>
          <CardDescription className="text-xs">Continuous feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO.continuousFeedback.map((f, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
              <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">{format(new Date(f.date), 'MMM d')}</span>
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">&ldquo;{f.text}&rdquo; <span className="text-slate-500 dark:text-slate-400">– {f.source}</span></p>
                {f.type === 'improvement' && <Badge variant="secondary" className="text-xs mt-1">Needs improvement</Badge>}
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Send Feedback</Button>
            <Button variant="ghost" size="sm" className="dark:text-slate-400" disabled>Feedback Trends</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Goal Tracking ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Target className="h-4 w-4" /> Goal Tracking
          </CardTitle>
          <CardDescription className="text-xs">Q1 goals progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Company goals</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{DEMO.goalTracking.company}%</p>
              <Progress value={DEMO.goalTracking.company} className="h-2 mt-2" />
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Department goals</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{DEMO.goalTracking.department}%</p>
              <Progress value={DEMO.goalTracking.department} className="h-2 mt-2" />
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Individual goals</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mt-1">{DEMO.goalTracking.individual}%</p>
              <Progress value={DEMO.goalTracking.individual} className="h-2 mt-2" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`${base}/OKRs/new`}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">OKR Dashboard</Button>
            </Link>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Create New Goals</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Review Trends ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Review Trends
          </CardTitle>
          <CardDescription className="text-xs">Quarterly · Q4 2025 → Q1 2026: {DEMO.trends.q4Score} → {DEMO.trends.q1Score} (+{DEMO.trends.changePct}%) · Engagement: {DEMO.trends.engagementScore}% (+{DEMO.trends.engagementChange}%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DEMO.trends.chart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                <YAxis domain={[3.8, 4.2]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} name="Avg score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Common themes (positive)</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mt-1">{DEMO.trends.themesPositive.join(', ')}</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Areas for improvement</p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mt-1">{DEMO.trends.themesImprovement.join(', ')}</p>
            </div>
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
          <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Take Action</Button>
        </div>
      </div>
    </div>
  )
}
