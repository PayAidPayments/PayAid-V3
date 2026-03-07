'use client'

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
  FileText,
  Calendar,
  Briefcase,
  DollarSign,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINR } from '@/lib/utils/formatINR'

interface Contractor {
  id: string
  contractorCode?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  startDate: string
  endDate?: string | null
  monthlyRate?: number | null
  tdsApplicable: boolean
  tdsRate?: number | null
  panNumber?: string | null
  department?: { id: string; name: string } | null
  project?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
}

// Stub data for 360° view (replace with API when available)
const STUB = {
  assignedBy: 'Priya',
  contractType: 'Fixed Term' as const,
  totalValue: 320000,
  paidAmount: 160000,
  ratePerMonth: 80000,
  hoursLogged: 128,
  hoursTotal: 160,
  hourlyRate: 2500,
  emergencyContact: { name: '—', relation: '—', phone: '—' },
  documents: { contractSigned: true, ndaSigned: true },
  projects: [
    { name: 'Website Redesign', progress: 80, status: 'In Progress' },
    { name: 'Mobile App', progress: 45, status: 'In Progress' },
  ],
  lastPayment: { date: '2026-03-01', amount: 80000, status: 'PAID' as const },
  nextPayment: { date: '2026-04-01', amount: 80000, status: 'PENDING' as const },
  invoicesRaised: 3,
  invoicesTotal: 6,
  avgPaymentDays: 7,
  engagementRisk: { score: 28, level: 'LOW' as const, points: ['Consistent delivery on time', 'No missed milestones', 'Positive feedback from project managers'], suggestion: 'Offer long‑term contract after Jul 31' },
  activityTimeline: [
    { date: '2026-03-06', text: 'Logged 6h on Website Redesign' },
    { date: '2026-03-05', text: 'Submitted milestone invoice #3' },
    { date: '2026-03-03', text: 'Completed Mobile App design phase' },
    { date: '2026-02-28', text: 'Project manager feedback: 4.8/5' },
  ],
  actionItems: [
    { label: 'Approve next milestone payment (₹40,000)', priority: 'high' },
    { label: 'Schedule contract review (Jul 15)', priority: 'medium' },
  ],
}

export default function HRContractorDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string
  const { token } = useAuthStore()

  const { data: contractor, isLoading } = useQuery<Contractor>({
    queryKey: ['contractor', id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/contractors/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch contractor')
      return res.json()
    },
    enabled: !!token,
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 border-green-200 dark:border-green-800',
      INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      TERMINATED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200 border-red-200 dark:border-red-800',
    }
    return colors[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  }

  if (isLoading) {
    return <PageLoading message="Loading contractor details..." fullScreen={false} />
  }

  if (!contractor) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400 mb-4">Contractor not found</p>
        <Link href={`/hr/${tenantId}/Contractors`}>
          <Button variant="outline" className="dark:border-slate-600 dark:text-slate-300">Back to Contractors</Button>
        </Link>
      </div>
    )
  }

  const displayName = `${contractor.firstName} ${contractor.lastName}`
  const initials = `${contractor.firstName?.[0] || ''}${contractor.lastName?.[0] || ''}`.toUpperCase() || '?'
  const code = contractor.contractorCode || `CNT-${id.slice(-6)}`
  const monthlyRate = contractor.monthlyRate ?? STUB.ratePerMonth
  const balance = STUB.totalValue - STUB.paidAmount

  return (
    <div className="space-y-5 pb-24">
      {/* ——— Sticky header ——— */}
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 dark:supports-[backdrop-filter]:bg-slate-950/80">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-lg font-semibold" aria-hidden>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">{displayName}</h1>
                <Badge variant="secondary" className={getStatusColor(contractor.status)}>{contractor.status}</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {code}
                {contractor.department?.name && ` · ${contractor.department.name}`}
                {STUB.assignedBy && ` · Assigned by ${STUB.assignedBy}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/hr/${tenantId}/Contractors/${id}/Edit`}>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">Edit Contract</Button>
            </Link>
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Invoices</Button>
            {contractor.status === 'ACTIVE' && (
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Terminate</Button>
            )}
            <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Extend Contract</Button>
            <Link href={`/hr/${tenantId}/Contractors`}>
              <Button variant="ghost" size="sm" className="dark:text-slate-400 dark:hover:bg-slate-800">Back</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ——— Two-column: Personal Info | Contract Details ——— */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">First Name</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{contractor.firstName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Last Name</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{contractor.lastName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />{contractor.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                <p className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />{contractor.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">PAN</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{contractor.panNumber || '—'}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Emergency Contact</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{STUB.emergencyContact.name} ({STUB.emergencyContact.relation}) · {STUB.emergencyContact.phone}</p>
            </div>
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Documents</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={STUB.documents.contractSigned ? 'default' : 'secondary'} className="text-xs">Contract {STUB.documents.contractSigned ? 'signed' : 'pending'}</Badge>
                <Badge variant={STUB.documents.ndaSigned ? 'default' : 'secondary'} className="text-xs">NDA {STUB.documents.ndaSigned ? 'signed' : 'pending'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Contract Type</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{STUB.contractType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Start</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{format(new Date(contractor.startDate), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">End</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {contractor.endDate ? format(new Date(contractor.endDate), 'MMM d, yyyy') : 'Ongoing'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Rate</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{formatINR(monthlyRate)}/month</p>
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total Value</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">{formatINR(STUB.totalValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Paid</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatINR(STUB.paidAmount)} ({Math.round((STUB.paidAmount / STUB.totalValue) * 100)}%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Balance</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">{formatINR(balance)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Hours logged</span>
                <span className="font-medium">{STUB.hoursLogged}/{STUB.hoursTotal}h</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View Contract PDF</Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>Extend Contract</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ——— Project Involvement ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Project Involvement
          </CardTitle>
          <CardDescription className="text-xs">Active projects: {STUB.projects.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {STUB.projects.map((proj, i) => (
              <li key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-50">{proj.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{proj.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={proj.progress} className="w-24 h-2" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-10">{proj.progress}%</span>
                  <Button variant="ghost" size="sm" className="text-xs" disabled>View Project</Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <span>Total hours logged: {STUB.hoursLogged}h</span>
            <span>Rate: {formatINR(STUB.hourlyRate)}/h</span>
          </div>
          <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View All Time Entries</Button>
        </CardContent>
      </Card>

      {/* ——— Payment History ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Last Payment</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">{format(new Date(STUB.lastPayment.date), 'MMM d')} ({formatINR(STUB.lastPayment.amount)})</p>
              <Badge variant="default" className="mt-2 text-xs">Paid ✓</Badge>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Next Payment</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">{format(new Date(STUB.nextPayment.date), 'MMM d')} ({formatINR(STUB.nextPayment.amount)})</p>
              <Badge variant="secondary" className="mt-2 text-xs">Pending</Badge>
            </div>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Invoices raised: {STUB.invoicesRaised}/{STUB.invoicesTotal} · Average payment time: {STUB.avgPaymentDays} days
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300" disabled>View All Invoices</Button>
            <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Raise Invoice</Button>
          </div>
        </CardContent>
      </Card>

      {/* ——— Engagement Risk ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Engagement Risk</CardTitle>
          <CardDescription className="text-xs">Risk score: {STUB.engagementRisk.level} ({STUB.engagementRisk.score}%)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            {STUB.engagementRisk.points.map((point, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-500">✓</span> {point}
              </li>
            ))}
          </ul>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Suggestion: {STUB.engagementRisk.suggestion}</p>
        </CardContent>
      </Card>

      {/* ——— Recent Activity ——— */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-0">
            {STUB.activityTimeline.map((item, i) => (
              <li key={i} className="flex gap-3 py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                <div className="flex flex-col items-center">
                  <div className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 mt-1.5" />
                  {i < STUB.activityTimeline.length - 1 && <div className="w-px flex-1 min-h-[12px] bg-slate-200 dark:bg-slate-700 my-0.5" />}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* ——— Bottom sticky action bar ——— */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-slate-900 dark:text-slate-50">{STUB.actionItems.length} actions needed</span>
          </div>
          <ul className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            {STUB.actionItems.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className={item.priority === 'high' ? 'text-amber-600 dark:text-amber-400' : ''}>{item.label}</span>
                {i < STUB.actionItems.length - 1 && <span className="text-slate-400">·</span>}
              </li>
            ))}
          </ul>
          <Button size="sm" className="dark:bg-slate-700 dark:hover:bg-slate-600" disabled>Take action</Button>
        </div>
      </div>
    </div>
  )
}
