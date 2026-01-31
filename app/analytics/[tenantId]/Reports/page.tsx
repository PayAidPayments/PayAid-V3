'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileText, Plus, Search, Download, Calendar, Mail, 
  Trash2, Edit, ArrowLeft, Filter
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CustomReport {
  id: string
  name: string
  description?: string
  reportType: 'sales' | 'marketing' | 'finance' | 'hr' | 'custom'
  createdAt: string
  updatedAt: string
  scheduleEnabled?: boolean
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly'
}

export default function CustomReportsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [reports, setReports] = useState<CustomReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<string>('sales')

  // Form state
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportType, setReportType] = useState<'sales' | 'marketing' | 'finance' | 'hr' | 'custom'>('sales')

  useEffect(() => {
    fetchReports()
  }, [tenantId])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      const response = await fetch('/api/reports/custom', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      } else {
        throw new Error('Failed to fetch reports')
      }
    } catch (error: any) {
      console.error('Failed to fetch reports:', error)
      setError(error.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = async () => {
    try {
      const token = useAuthStore.getState().token
      
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          reportType: reportType,
          filters: {},
          columns: [],
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setReportName('')
        setReportDescription('')
        setReportType('sales')
        fetchReports()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create report')
      }
    } catch (error: any) {
      console.error('Failed to create report:', error)
      setError(error.message || 'Failed to create report')
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const token = useAuthStore.getState().token
      
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchReports()
      } else {
        throw new Error('Failed to delete report')
      }
    } catch (error: any) {
      console.error('Failed to delete report:', error)
      setError(error.message || 'Failed to delete report')
    }
  }

  if (loading) {
    return <PageLoading message="Loading reports..." fullScreen={true} />
  }

  const moduleConfig = getModuleConfig('analytics') || getModuleConfig('crm')!

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reportType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const heroMetrics = [
    {
      label: 'Total Reports',
      value: reports.length.toString(),
      icon: <FileText className="w-5 h-5" />,
      color: 'purple' as const,
    },
    {
      label: 'Scheduled',
      value: reports.filter(r => r.scheduleEnabled).length.toString(),
      icon: <Calendar className="w-5 h-5" />,
      color: 'info' as const,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Custom Reports"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-8">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Link href={`/analytics/${tenantId}/Home`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </Link>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
                <DialogDescription>
                  Create a new custom report to analyze your business data
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="e.g., Monthly Sales Report"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Report Type</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReport} disabled={!reportName}>
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <GlassCard>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </GlassCard>

        {/* Reports List */}
        {filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <GlassCard key={report.id} delay={0.1}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      {report.description && (
                        <CardDescription className="mt-1">{report.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{report.reportType}</span>
                    </div>
                    {report.scheduleEnabled && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Scheduled:</span>
                        <span className="font-medium capitalize">{report.scheduleFrequency}</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery ? 'Try adjusting your search query' : 'Create your first custom report to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                )}
              </div>
            </CardContent>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
