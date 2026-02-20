'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Heart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/stores/auth'

interface HealthMetric {
  id: string
  name: string
  value: number
  max: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
}

interface HRHealthMonitoringProps {
  tenantId?: string
  stats?: any
}

export function HRHealthMonitoring({ tenantId, stats }: HRHealthMonitoringProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [overallHealth, setOverallHealth] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) return

    const calculateHealth = () => {
      const healthMetrics: HealthMetric[] = []

      if (stats) {
        // Compliance Health
        const complianceHealth = stats.complianceScore || 0
        healthMetrics.push({
          id: '1',
          name: 'Compliance Health',
          value: complianceHealth,
          max: 100,
          status: complianceHealth >= 95 ? 'excellent' : complianceHealth >= 85 ? 'good' : complianceHealth >= 70 ? 'warning' : 'critical',
          trend: complianceHealth >= 95 ? 'up' : 'stable',
        })

        // Engagement Health
        const engagementHealth = stats.avgEngagement || 0
        healthMetrics.push({
          id: '2',
          name: 'Engagement Health',
          value: engagementHealth,
          max: 100,
          status: engagementHealth >= 85 ? 'excellent' : engagementHealth >= 75 ? 'good' : engagementHealth >= 60 ? 'warning' : 'critical',
          trend: engagementHealth >= 80 ? 'up' : 'down',
        })

        // Retention Health (inverse of turnover)
        const retentionHealth = Math.max(100 - (stats.turnover || 0) * 5, 0)
        healthMetrics.push({
          id: '3',
          name: 'Retention Health',
          value: retentionHealth,
          max: 100,
          status: retentionHealth >= 80 ? 'excellent' : retentionHealth >= 70 ? 'good' : retentionHealth >= 50 ? 'warning' : 'critical',
          trend: retentionHealth >= 80 ? 'up' : 'down',
        })

        // Payroll Health (based on timely processing)
        const payrollHealth = stats.complianceScore >= 95 ? 95 : 75
        healthMetrics.push({
          id: '4',
          name: 'Payroll Health',
          value: payrollHealth,
          max: 100,
          status: payrollHealth >= 90 ? 'excellent' : payrollHealth >= 80 ? 'good' : payrollHealth >= 70 ? 'warning' : 'critical',
          trend: 'up',
        })
      }

      setMetrics(healthMetrics)
      
      // Calculate overall health
      if (healthMetrics.length > 0) {
        const avgHealth = healthMetrics.reduce((sum, m) => sum + m.value, 0) / healthMetrics.length
        setOverallHealth(Math.round(avgHealth))
      }
    }

    calculateHealth()
    setIsLoading(false)
  }, [tenantId, token, stats])

  const getStatusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'excellent':
        return 'text-success'
      case 'good':
        return 'text-info'
      case 'warning':
        return 'text-amber-600'
      default:
        return 'text-red-600'
    }
  }

  const getStatusBg = (status: HealthMetric['status']) => {
    switch (status) {
      case 'excellent':
        return 'bg-success'
      case 'good':
        return 'bg-info'
      case 'warning':
        return 'bg-amber-600'
      default:
        return 'bg-red-600'
    }
  }

  const getStatusIcon = (status: HealthMetric['status']) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'good':
        return <TrendingUp className="w-5 h-5 text-info" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-red-600" />
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-500" />
            Health Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md rounded-xl" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Health Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Overall Health Score */}
        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200 flex-shrink-0">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-purple-500" />
            <div>
              <p className="text-xs text-gray-600">Overall Health Score</p>
              <p className="text-3xl font-bold text-purple-600">{overallHealth}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallHealth}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${getStatusBg(
                overallHealth >= 70 ? 'excellent' : overallHealth >= 50 ? 'good' : overallHealth >= 30 ? 'warning' : 'critical'
              )} rounded-full`}
            />
          </div>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-2 flex-1 overflow-y-auto">
          {(Array.isArray(metrics) ? metrics : []).slice(0, 4).map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="text-xs font-semibold text-gray-900">{metric.name}</span>
                </div>
                <span className={`text-xs font-bold ${getStatusColor(metric.status)}`}>
                  {Math.round(metric.value)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                  className={`h-full ${getStatusBg(metric.status)} rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
