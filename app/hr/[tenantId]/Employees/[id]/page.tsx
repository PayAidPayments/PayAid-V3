'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Target,
  Users,
  AlertCircle,
  ChevronRight,
  DollarSign,
  CalendarCheck,
  Activity,
  Video,
} from 'lucide-react'
import { FlightRiskCard } from '@/components/hr/FlightRiskCard'
import { RetentionInterventionsCard } from '@/components/hr/RetentionInterventionsCard'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINR } from '@/lib/utils/formatINR'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, ExternalLink, AlertTriangle } from 'lucide-react'

interface Employee {
  id: string
  employeeCode: string
  firstName: string
  lastName: string
  officialEmail: string
  personalEmail?: string
  mobileCountryCode: string
  mobileNumber: string
  joiningDate: string
  probationEndDate?: string
  confirmationDate?: string
  exitDate?: string
  exitReason?: string
  status: string
  department?: { id: string; name: string }
  designation?: { id: string; name: string }
  location?: { id: string; name: string; city?: string; state?: string }
  manager?: { id: string; firstName: string; lastName: string; employeeCode: string }
  reports?: Array<{ id: string; firstName: string; lastName: string; employeeCode: string }>
  ctcAnnualInr?: number
  fixedComponentInr?: number
  variableComponentInr?: number
  pfApplicable: boolean
  esiApplicable: boolean
  ptApplicable: boolean
  tdsApplicable: boolean
}

// Stub data for 360° view (replace with API when available)
const STUB = {
  emergencyContact: { name: '—', relation: '—', phone: '—' },
  documents: { offerLetterSigned: true, form16Issued: false },
  contractType: 'Permanent' as const,
  lastReviewScore: 4.2,
  lastReviewDate: '2025-02-28',
  nextReviewDate: '2026-04-15',
  performanceScore: 85,
  performanceTrend: 2,
  goals: [
    { title: 'Close 8 deals in Q1', progress: 75 },
    { title: 'Upsell 2 existing customers', progress: 0 },
  ],
  recentActivityMetrics: { callsLastWeek: 12, dealsCreated: 3, demosCompleted: 2 },
  leaveBalance: 12,
  leaveTotal: 16,
  leaveUsed: 4,
  upcomingLeave: { days: 2, start: '2026-03-15', end: '2026-03-16' },
  attendance30Days: { present: 28, total: 30, lateArrivals: 2 },
  payrollBreakup: { basic: 400000, hra: 120000, allowances: 280000 },
  nextPayroll: '2026-03-31',
  lastPaid: '2026-03-01',
  teamSize: 8,
  activityTimeline: [
    { date: '2026-03-06', text: 'Completed goal "8 Q1 deals" (75%)', type: 'goal' },
    { date: '2026-03-05', text: 'Logged 12 calls, created 2 deals', type: 'activity' },
    { date: '2026-03-04', text: 'Submitted expense claim ₹2,500 (Approved)', type: 'expense' },
    { date: '2026-03-02', text: 'Leave request approved (2 days)', type: 'leave' },
    { date: '2026-02-28', text: 'Performance review submitted (4.2/5)', type: 'review' },
  ],
  actionItems: [
    { label: 'Schedule Q1 review (due Mar 15)', priority: 'high' },
    { label: 'Approve ₹2,500 reimbursement', priority: 'medium' },
    { label: 'Update sales quota for Q2', priority: 'low' },
  ],
}

const DOC_TYPES = ['Offer letter', 'Aadhaar', 'PAN', 'Bank proof', 'Policy handbook', 'Other']

function EmployeeDocumentsBlock({ employeeId, tenantId }: { employeeId: string; tenantId: string }) {
  const { token } = useAuthStore()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [newType, setNewType] = useState(DOC_TYPES[0])
  const [newUrl, setNewUrl] = useState('')
  const [newExpiry, setNewExpiry] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/employees/${employeeId}/documents`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { documents: [] }
      return res.json()
    },
    enabled: !!token && !!employeeId,
  })

  const addDoc = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/hr/employees/${employeeId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          documentType: newType,
          fileUrl: newUrl.trim(),
          expiryDate: newExpiry.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to add')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-documents', employeeId] })
      setAddOpen(false)
      setNewUrl('')
      setNewExpiry('')
    },
  })

  const documents = data?.documents ?? []
  const now = new Date()
  const withExpiryAlert = documents.filter(
    (d: { expiryDate: string | null }) => d.expiryDate && new Date(d.expiryDate).getTime() - now.getTime() < 90 * 24 * 60 * 60 * 1000
  )

  return (
    <div className="space-y-2">
      {withExpiryAlert.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          {withExpiryAlert.length} document(s) expire in 90 days
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {documents.map((d: { id: string; documentType: string; fileUrl: string; status: string; expiryDate: string | null }) => (
          <Badge key={d.id} variant={d.status === 'VERIFIED' ? 'default' : 'secondary'} className="text-xs gap-1">
            <FileText className="h-3 w-3" />
            {d.documentType}
            {d.status !== 'VERIFIED' && ` (${d.status})`}
            <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-1 opacity-80 hover:opacity-100">
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          </Badge>
        ))}
      </div>
      {!addOpen ? (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setAddOpen(true)}>
          <Plus className="h-3 w-3" />
          Add document
        </Button>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 space-y-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="url"
            placeholder="Document URL (upload elsewhere and paste link)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs"
          />
          <input
            type="date"
            placeholder="Expiry (optional)"
            value={newExpiry}
            onChange={(e) => setNewExpiry(e.target.value)}
            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={() => addDoc.mutate()} disabled={!newUrl.trim() || addDoc.isPending}>
              {addDoc.isPending ? 'Adding…' : 'Add'}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAddOpen(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HREmployeeDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const { token } = useAuthStore()

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['employee', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/employees/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Failed to fetch employee')
      return response.json()
    },
    enabled: !!token,
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-800',
      PROBATION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 border-amber-200 dark:border-amber-800',
      NOTICE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200 border-orange-200 dark:border-orange-800',
      EXITED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    }
    return colors[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      PROBATION: 'Probation',
      NOTICE: 'On Notice',
      EXITED: 'Terminated',
    }
    return labels[status] || status
  }

  if (isLoading) {
    return <PageLoading message="Loading employee details..." fullScreen={false} />
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Employee not found</p>
        <Link href={`/hr/${tenantId}/Employees`}>
          <Button variant="outline" className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Back to Employees</Button>
        </Link>
      </div>
    )
  }

  const displayName = `${employee.firstName} ${employee.lastName}`
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase() || '?'
  const managerName = employee.manager
    ? `${employee.manager.firstName} ${employee.manager.lastName}`
    : null

  return (
    <div className="space-y-5 pb-24">
      {/* ——— Sticky header: Avatar, name, status, role, manager, quick actions ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 dark:supports-[backdrop-filter]:bg-slate-950/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-lg font-semibold"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
                  {displayName}
                </h1>
                <Badge variant="secondary" className={getStatusColor(employee.status)}>
                  {getStatusLabel(employee.status)}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {employee.employeeCode}
                {employee.designation?.name && ` · ${employee.designation.name}`}
                {managerName && ` · Reports to ${managerName}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/hr/${tenantId}/Employees/${id}/Edit`}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                Edit
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800" disabled>
              View Payslip
            </Button>
            {employee.status === 'ACTIVE' && (
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800" disabled>
                Deactivate
              </Button>
            )}
            <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>
              <Video className="h-4 w-4 mr-1.5" />
              Schedule 1:1
            </Button>
            <Link href={`/hr/${tenantId}/Employees`}>
              <Button variant="ghost" size="sm" className="dark:text-slate-400 dark:hover:bg-slate-800">
                Back
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ——— Two-column: Personal Info | Employment ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">First Name</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{employee.firstName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Last Name</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{employee.lastName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">Official Email</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {employee.officialEmail}
                </p>
              </div>
              {employee.personalEmail && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Personal Email</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{employee.personalEmail}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mobile</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {employee.mobileCountryCode} {employee.mobileNumber}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Emergency Contact</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {STUB.emergencyContact.name} ({STUB.emergencyContact.relation}) · {STUB.emergencyContact.phone}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add in profile to update</p>
            </div>
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Documents</p>
              <EmployeeDocumentsBlock employeeId={id} tenantId={tenantId} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Department</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{employee.department?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Designation</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{employee.designation?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {employee.location?.name || '—'}
                  {employee.location?.city && employee.location?.state && (
                    <span className="text-slate-500 dark:text-slate-400 text-xs ml-1">({employee.location.city}, {employee.location.state})</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Contract Type</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{STUB.contractType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Joining Date</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {employee.joiningDate ? format(new Date(employee.joiningDate), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              {employee.probationEndDate && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Probation End</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {format(new Date(employee.probationEndDate), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
              {employee.manager && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Manager</p>
                  <Link
                    href={`/hr/${tenantId}/Employees/${employee.manager.id}`}
                    className="font-medium text-slate-900 dark:text-slate-100 hover:underline"
                  >
                    {employee.manager.firstName} {employee.manager.lastName} ({employee.manager.employeeCode})
                  </Link>
                </div>
              )}
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Performance</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">Last review: {STUB.lastReviewScore}/5</span>
                <Button variant="ghost" size="sm" className="text-xs h-7 dark:text-slate-400" disabled>
                  View full review
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Next review: {format(new Date(STUB.nextReviewDate), 'MMM d, yyyy')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ——— Performance & Goals ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Performance & Goals
            </CardTitle>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Trend: <span className="text-green-600 dark:text-green-400 font-medium">↑{STUB.performanceTrend}% this month</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{STUB.performanceScore}%</div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Performance score</span>
            </div>
            <Progress value={STUB.performanceScore} className="max-w-[200px] h-2" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Current goals</p>
            <ul className="space-y-3">
              {STUB.goals.map((goal, i) => (
                <li key={i} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{goal.title}</span>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={goal.progress} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-10">{goal.progress}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Recent activity</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
              <span>{STUB.recentActivityMetrics.callsLastWeek} calls logged last week</span>
              <span>{STUB.recentActivityMetrics.dealsCreated} deals created</span>
              <span>{STUB.recentActivityMetrics.demosCompleted} demos completed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ——— Leave & Attendance ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Leave & Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Leave balance</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 mt-1">
                {STUB.leaveBalance} days remaining
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Used {STUB.leaveUsed}/{STUB.leaveTotal} days
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Upcoming leave</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                {STUB.upcomingLeave.days} days
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {format(new Date(STUB.upcomingLeave.start), 'MMM d')} – {format(new Date(STUB.upcomingLeave.end), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Last 30 days</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50 mt-1">
                {Math.round((STUB.attendance30Days.present / STUB.attendance30Days.total) * 100)}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {STUB.attendance30Days.present}/{STUB.attendance30Days.total} days · {STUB.attendance30Days.lateArrivals} late
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>
            View full calendar
          </Button>
        </CardContent>
      </Card>

      {/* ——— Flight Risk (existing component) ——— */}
      {employee.status === 'ACTIVE' && (
        <FlightRiskCard employeeId={id} tenantId={tenantId} token={token} />
      )}

      {/* ——— Payroll & Compensation ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Payroll & Compensation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-baseline gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current CTC (annual)</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {employee.ctcAnnualInr ? formatINR(employee.ctcAnnualInr) : '—'}
              </p>
            </div>
            {employee.ctcAnnualInr && (
              <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
                <span>Basic {formatINR(STUB.payrollBreakup.basic)}</span>
                <span>HRA {formatINR(STUB.payrollBreakup.hra)}</span>
                <span>Allowances {formatINR(STUB.payrollBreakup.allowances)}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Next payroll: {format(new Date(STUB.nextPayroll), 'MMM d, yyyy')}
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              Last paid: {format(new Date(STUB.lastPaid), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>
              View payslip
            </Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>
              Adjust salary
            </Button>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>
              Reimbursements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Team Hierarchy ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Hierarchy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reports to</p>
              {managerName ? (
                <Link
                  href={`/hr/${tenantId}/Employees/${employee.manager!.id}`}
                  className="font-medium text-slate-900 dark:text-slate-100 hover:underline"
                >
                  {managerName} (Manager)
                </Link>
              ) : (
                <p className="font-medium text-slate-500 dark:text-slate-400">—</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Direct reports</p>
              <p className="font-medium text-slate-900 dark:text-slate-50">
                {employee.reports?.length ?? 0} employee(s)
              </p>
            </div>
          </div>
          {employee.department?.name && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Team: {employee.department.name} ({STUB.teamSize} total)
            </p>
          )}
          <Link href={`/hr/${tenantId}/OrgChart`}>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">
              View org chart
            </Button>
          </Link>
          {employee.reports && employee.reports.length > 0 && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Direct reports</p>
              <ul className="space-y-2">
                {employee.reports.map((report) => (
                  <li key={report.id}>
                    <Link
                      href={`/hr/${tenantId}/Employees/${report.id}`}
                      className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {report.firstName} {report.lastName}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ——— Statutory (compact) ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Statutory applicability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge variant={employee.pfApplicable ? 'default' : 'secondary'}>PF {employee.pfApplicable ? 'Yes' : 'No'}</Badge>
            <Badge variant={employee.esiApplicable ? 'default' : 'secondary'}>ESI {employee.esiApplicable ? 'Yes' : 'No'}</Badge>
            <Badge variant={employee.ptApplicable ? 'default' : 'secondary'}>PT {employee.ptApplicable ? 'Yes' : 'No'}</Badge>
            <Badge variant={employee.tdsApplicable ? 'default' : 'secondary'}>TDS {employee.tdsApplicable ? 'Yes' : 'No'}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* ——— Recent Activity Timeline ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent activity
          </CardTitle>
          <CardDescription className="text-xs">Chronological feed across goals, leave, expenses, reviews</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-0">
            {STUB.activityTimeline.map((item, i) => (
              <li key={i} className="flex gap-3 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5" />
                  {i < STUB.activityTimeline.length - 1 && (
                    <div className="w-px flex-1 min-h-[12px] bg-slate-200 dark:bg-slate-700 my-0.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {format(new Date(item.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ——— Retention interventions (existing) ——— */}
      {employee.status === 'ACTIVE' && (
        <RetentionInterventionsCard employeeId={id} tenantId={tenantId} />
      )}

      {/* ——— Bottom sticky action bar ——— */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-slate-900 dark:text-slate-50">
              {STUB.actionItems.length} actions needed
            </span>
          </div>
          <ul className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            {STUB.actionItems.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className={item.priority === 'high' ? 'text-amber-600 dark:text-amber-400' : ''}>
                  {item.label}
                </span>
                {i < STUB.actionItems.length - 1 && <span className="text-slate-400">·</span>}
              </li>
            ))}
          </ul>
          <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>
            Take action
          </Button>
        </div>
      </div>
    </div>
  )
}
