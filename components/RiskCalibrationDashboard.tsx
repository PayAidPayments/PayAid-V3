'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { DashboardLoading } from '@/components/ui/loading'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, Target, RefreshCw } from 'lucide-react'

const PAYAID_PURPLE = '#53328A'

interface CalibrationMetrics {
  totalDecisions: number
  autoExecuted: number
  approved: number
  rejected: number
  rolledBack: number
  successRate: number
  averageRiskScore: number
  falsePositiveRate: number
  falseNegativeRate: number
}

export function RiskCalibrationDashboard() {
  const { token } = useAuthStore()
  const [metrics, setMetrics] = useState<CalibrationMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [decisionType, setDecisionType] = useState<string>('all')

  useEffect(() => {
    fetchMetrics()
  }, [decisionType])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (decisionType !== 'all') {
        params.append('decisionType', decisionType)
      }

      const response = await fetch(`/api/ai/risk-policies/calibration?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch metrics')
      }

      const data = await response.json()
      if (data.success) {
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch calibration metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !metrics) {
    return <DashboardLoading message="Loading risk calibration metrics..." />
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No calibration data available</p>
      </div>
    )
  }

  const chartData = [
    { name: 'Auto-Executed', value: metrics.autoExecuted, color: '#10b981' },
    { name: 'Approved', value: metrics.approved, color: '#3b82f6' },
    { name: 'Rejected', value: metrics.rejected, color: '#ef4444' },
    { name: 'Rolled Back', value: metrics.rolledBack, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Risk Calibration Dashboard</h2>
        <div className="flex items-center gap-2">
          <CustomSelect value={decisionType} onValueChange={(value: string) => setDecisionType(value)} placeholder="Decision Type">
            <CustomSelectTrigger className="w-[200px]">
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">All Types</CustomSelectItem>
              <CustomSelectItem value="send_invoice">Send Invoice</CustomSelectItem>
              <CustomSelectItem value="apply_discount">Apply Discount</CustomSelectItem>
              <CustomSelectItem value="assign_lead">Assign Lead</CustomSelectItem>
              <CustomSelectItem value="bulk_invoice_payment">Bulk Payment</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
          <Button onClick={fetchMetrics} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decisions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {metrics.totalDecisions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            {metrics.successRate >= 0.8 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {(metrics.successRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.successRate >= 0.8 ? 'Excellent' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {metrics.averageRiskScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {(metrics.falsePositiveRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Low risk rolled back</p>
          </CardContent>
        </Card>
      </div>

      {/* Decision Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Decision Distribution</CardTitle>
          <CardDescription>Breakdown of decision outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={PAYAID_PURPLE} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Calibration Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Calibration Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {metrics.falsePositiveRate > 0.1 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <strong>⚠️ High False Positive Rate:</strong> Consider lowering risk thresholds for auto-execution.
              Many low-risk decisions are being rolled back.
            </div>
          )}
          {metrics.falseNegativeRate > 0.15 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
              <strong>⚠️ High False Negative Rate:</strong> Consider raising risk thresholds. High-risk decisions
              are succeeding without proper approval.
            </div>
          )}
          {metrics.successRate >= 0.8 && metrics.falsePositiveRate < 0.1 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <strong>✅ Well Calibrated:</strong> Risk matrix is performing well with high success rate and low
              false positive rate.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
