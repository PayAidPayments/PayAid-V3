'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  FileText,
  Download,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

interface ReportData {
  pipelineByStage: Array<{ stage: string; count: number; value: number }>
  leadConversion: {
    totalLeads: number
    convertedLeads: number
    conversionRate: number
  }
  activityMetrics: {
    totalTasks: number
    completedTasks: number
    overdueTasks: number
    totalMeetings: number
  }
}

export default function CRMReportsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)

  useEffect(() => {
    fetchReportData()
  }, [tenantId, token])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      if (!token) return

      // Fetch dashboard stats which includes pipeline data
      const response = await fetch(`/api/crm/dashboard/stats?timePeriod=all`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setReportData({
          pipelineByStage: data.pipelineByStage || [],
          leadConversion: {
            totalLeads: data.totalLeads || 0,
            convertedLeads: data.convertedLeads || 0,
            conversionRate: data.conversionRate || 0,
          },
          activityMetrics: {
            totalTasks: data.totalTasks || 0,
            completedTasks: data.completedTasks || 0,
            overdueTasks: data.overdueTasks || 0,
            totalMeetings: data.totalMeetings || 0,
          },
        })
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading message="Loading reports..." fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reports</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View CRM analytics and insights</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Report */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle>Sales Pipeline Report</CardTitle>
              </div>
            </div>
            <CardDescription>View deals by stage and value</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData?.pipelineByStage && reportData.pipelineByStage.length > 0 ? (
              <div className="space-y-3">
                {reportData.pipelineByStage.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {item.stage}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.count} deals
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ₹{(item.value || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
                <Link href={`/crm/${tenantId}/Deals`}>
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View All Deals <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No pipeline data available</p>
            )}
          </CardContent>
        </Card>

        {/* Lead Conversion Report */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <CardTitle>Lead Conversion Report</CardTitle>
              </div>
            </div>
            <CardDescription>Track lead to deal conversion</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData?.leadConversion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reportData.leadConversion.totalLeads}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Converted</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {reportData.leadConversion.convertedLeads}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Conversion Rate</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {reportData.leadConversion.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Link href={`/crm/${tenantId}/Leads`}>
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View All Leads <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No conversion data available</p>
            )}
          </CardContent>
        </Card>

        {/* Activity Report */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle>Activity Report</CardTitle>
              </div>
            </div>
            <CardDescription>View team activity metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {reportData?.activityMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reportData.activityMetrics.totalTasks}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {reportData.activityMetrics.completedTasks}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {reportData.activityMetrics.overdueTasks}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Meetings</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {reportData.activityMetrics.totalMeetings}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Completion Rate</p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${reportData.activityMetrics.totalTasks > 0 
                          ? (reportData.activityMetrics.completedTasks / reportData.activityMetrics.totalTasks) * 100 
                          : 0}%`
                      }}
                    />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                    {reportData.activityMetrics.totalTasks > 0
                      ? ((reportData.activityMetrics.completedTasks / reportData.activityMetrics.totalTasks) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <Link href={`/crm/${tenantId}/Tasks`}>
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    View All Tasks <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No activity data available</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue Report */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle>Revenue Report</CardTitle>
            </div>
            <CardDescription>Track revenue by period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  ₹{(reportData?.pipelineByStage?.reduce((sum, item) => sum + (item.value || 0), 0) || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Deals</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {reportData?.pipelineByStage?.reduce((sum, item) => sum + (item.count || 0), 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Report */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <CardTitle>Performance Report</CardTitle>
            </div>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Deal Value</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  ₹{reportData?.pipelineByStage && reportData.pipelineByStage.length > 0
                    ? (reportData.pipelineByStage.reduce((sum, item) => sum + (item.value || 0), 0) / 
                       reportData.pipelineByStage.reduce((sum, item) => sum + (item.count || 0), 0)).toLocaleString('en-IN')
                    : '0'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                <p className="font-semibold text-green-600 dark:text-green-400">
                  {reportData?.leadConversion?.conversionRate?.toFixed(1) || '0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time-based Report */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <CardTitle>Time-based Analysis</CardTitle>
            </div>
            <CardDescription>View trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detailed time-based analysis coming soon. This will show trends for deals, leads, and activities over different time periods.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

