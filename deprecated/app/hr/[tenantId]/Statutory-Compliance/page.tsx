'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, CheckCircle, Clock, AlertCircle, Upload, Download, IndianRupee, FileText, ExternalLink } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default function HRStatutoryCompliancePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  const { data: complianceOverview } = useQuery({
    queryKey: ['hr-compliance-overview', tenantId],
    queryFn: async () => {
      const token = useAuthStore.getState().token
      const res = await fetch('/api/hr/compliance/overview', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!tenantId,
  })

  const { data: remindersData } = useQuery({
    queryKey: ['hr-compliance-reminders', tenantId],
    queryFn: async () => {
      const token = useAuthStore.getState().token
      const res = await fetch('/api/hr/compliance/reminders', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('Failed to fetch reminders')
      return res.json()
    },
    enabled: !!tenantId,
  })
  const alerts = (remindersData?.reminders ?? []).filter(
    (r: { status: string }) => r.status === 'OVERDUE' || r.status === 'DUE_SOON'
  )

  const { data: checklistData } = useQuery({
    queryKey: ['hr-compliance-checklist', tenantId],
    queryFn: async () => {
      const token = useAuthStore.getState().token
      const res = await fetch('/api/hr/compliance/checklist', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (!res.ok) throw new Error('Failed to fetch checklist')
      return res.json()
    },
    enabled: !!tenantId,
  })

  const reminders = (remindersData?.reminders ?? []) as Array<{
    type: string
    name: string
    dueDate: string
    daysLeft: number
    status: string
    description?: string
  }>
  const checklist = (checklistData?.checklist ?? []) as Array<{ id: string; name: string; due: string }>
  const overviewItems = (complianceOverview?.items ?? []) as Array<{
    type: string
    name: string
    status: string
    employeeCount?: number
    totalAmount?: number
    downloadUrl?: string | null
  }>
  const reminderByType = Object.fromEntries(reminders.map((r) => [r.type, r]))
  const overviewByType = Object.fromEntries(overviewItems.map((o) => [o.type, o]))

  const tableRows = checklist.map((row) => {
    const reminder = reminderByType[row.id]
    const overview = overviewByType[row.id]
    const dueDate = reminder?.dueDate ?? null
    const daysLeft = reminder?.daysLeft ?? null
    const dueStatus = reminder?.status ?? null
    const description =
      reminder?.description ??
      (row.id === 'GRATUITY' ? 'Gratuity payable on employee exit' : row.name)
    const amountLabel = overview
      ? overview.employeeCount != null
        ? `${overview.employeeCount} employees`
        : overview.totalAmount != null && overview.totalAmount > 0
          ? formatINRForDisplay(overview.totalAmount)
          : '—'
      : '—'
    const dataStatus = overview?.status ?? null
    const downloadUrl = overview?.downloadUrl ?? null
    return {
      id: row.id,
      type: row.name,
      description,
      dueDate,
      dueText: row.due,
      daysLeft,
      dueStatus,
      amountLabel,
      dataStatus,
      downloadUrl,
    }
  })

  const overdueCount = reminders.filter((r) => r.status === 'OVERDUE').length
  const dueSoonCount = reminders.filter((r) => r.status === 'DUE_SOON').length
  const complianceScore = tableRows.length
    ? Math.max(0, 100 - (overdueCount * 25 + dueSoonCount * 10))
    : 100
  const filedCount = overviewItems.filter((o) => o.status === 'READY').length
  const pendingCount = overdueCount + dueSoonCount

  const handleTallyExport = (format: 'csv' | 'json') => {
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()
    const url = `/api/hr/tally/export/payroll?month=${month}&year=${year}&format=${format}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Statutory Compliance"
        moduleIcon={<Shield className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="PF/ECR, ESI, TDS/24Q, PT Auto-File & Pay"
      />

      <div className="p-6 space-y-6">
        {/* Compliance Alerts (Phase 2: from reminders API) */}
        {alerts.length > 0 && (
          <Card className="border-l-4 border-l-red-500 dark:border-gray-700 bg-red-50/50 dark:bg-red-900/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                Due soon / Overdue
              </CardTitle>
              <CardDescription>Statutory items requiring action — from compliance reminders</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {alerts.map((r: { type: string; name: string; dueDate: string; daysLeft: number; status: string; description?: string }) => (
                  <li
                    key={r.type}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      r.status === 'OVERDUE'
                        ? 'border-red-200 dark:border-red-800 bg-red-100/50 dark:bg-red-900/20'
                        : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{r.name}</span>
                      {r.description && (
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">— {r.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Due {format(new Date(r.dueDate), 'MMM dd, yyyy')}
                      </span>
                      <Badge variant={r.status === 'OVERDUE' ? 'destructive' : 'secondary'}>
                        {r.status === 'OVERDUE' ? `${Math.abs(r.daysLeft)} days overdue` : `${r.daysLeft} days left`}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Compliance Score */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Compliance Score</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">{complianceScore}%</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {pendingCount === 0 ? 'No dues overdue or due soon' : `${pendingCount} due soon or overdue`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Data ready</p>
                <p className="text-2xl font-bold">{filedCount}/{tableRows.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Due soon / overdue: {pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live compliance overview (Phase 2.4) */}
        {complianceOverview?.items?.length > 0 && (
          <Card className="border-l-4 border-l-amber-500 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Live compliance status</CardTitle>
              <CardDescription>Current month payroll data — PF/ECR, ESI, TDS/24Q, PT</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {complianceOverview.items.map((item: { type: string; name: string; status: string; employeeCount?: number; totalAmount?: number; downloadUrl?: string | null }) => (
                  <div key={item.type} className="flex items-center justify-between rounded-lg border dark:border-gray-600 p-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.employeeCount != null && `${item.employeeCount} employees`}
                        {item.totalAmount != null && item.totalAmount > 0 && ` · ${formatINRForDisplay(item.totalAmount)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.status === 'READY' ? 'default' : item.status === 'NA' ? 'secondary' : 'outline'}>
                        {item.status}
                      </Badge>
                      {item.downloadUrl && (
                        <a href={item.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                          <Download className="h-3 w-3" /> ECR
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats (from overview when available) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {overviewItems.length > 0 ? (
            overviewItems.map((item) => (
              <Card key={item.type}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.name}</p>
                      <p className="text-2xl font-bold">
                        {item.employeeCount != null ? item.employeeCount : item.totalAmount != null ? formatINRForDisplay(item.totalAmount) : '—'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{item.status}</p>
                    </div>
                    {item.type === 'PF_ECR' && <FileText className="h-8 w-8 text-blue-500" />}
                    {item.type === 'ESI' && <Shield className="h-8 w-8 text-purple-500" />}
                    {item.type === 'TDS_24Q' && <IndianRupee className="h-8 w-8 text-green-500" />}
                    {item.type === 'PT' && <CheckCircle className="h-8 w-8 text-amber-500" />}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">PF/ECR</p>
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-muted-foreground mt-1">No payroll data</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ESI</p>
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-muted-foreground mt-1">No payroll data</p>
                    </div>
                    <Shield className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">TDS/24Q</p>
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-muted-foreground mt-1">No payroll data</p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">PT</p>
                      <p className="text-2xl font-bold">—</p>
                      <p className="text-xs text-muted-foreground mt-1">No payroll data</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Auto-File Banner */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Automated Compliance Filing</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  All statutory filings are automated. PF/ECR uploads, ESI returns, TDS/24Q filings, and Professional Tax across 28 states/8 UTs are processed automatically on due dates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={() => handleTallyExport('csv')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Export to Tally (CSV)
          </Button>
          <Button variant="outline" onClick={() => handleTallyExport('json')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Export to Tally (JSON)
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Manual Upload
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button variant="outline">
            Configure Auto-File
          </Button>
        </div>

        {/* Compliance Table (checklist + reminders + overview) */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>Checklist with due dates from reminders and live data status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Left</TableHead>
                  <TableHead>Amount / Count</TableHead>
                  <TableHead>Due Status</TableHead>
                  <TableHead>Data Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.type}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>
                      {row.dueDate ? format(new Date(row.dueDate), 'MMM dd, yyyy') : row.dueText}
                    </TableCell>
                    <TableCell>
                      {row.daysLeft != null ? (
                        <span className={row.dueStatus === 'OVERDUE' ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {row.dueStatus === 'OVERDUE' ? `${Math.abs(row.daysLeft)} overdue` : `${row.daysLeft} days`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>{row.amountLabel}</TableCell>
                    <TableCell>
                      {row.dueStatus ? (
                        <Badge
                          variant={
                            row.dueStatus === 'OVERDUE' ? 'destructive' :
                            row.dueStatus === 'DUE_SOON' ? 'secondary' :
                            'outline'
                          }
                        >
                          {row.dueStatus === 'OVERDUE' ? 'Overdue' : row.dueStatus === 'DUE_SOON' ? 'Due soon' : 'Upcoming'}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {row.dataStatus ? (
                        <Badge variant={row.dataStatus === 'READY' ? 'default' : row.dataStatus === 'NA' ? 'secondary' : 'outline'}>
                          {row.dataStatus}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.downloadUrl ? (
                        <a href={row.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="text-amber-600 dark:text-amber-400">
                            <Download className="h-3 w-3 mr-1" /> ECR
                          </Button>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
