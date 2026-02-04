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

interface HealthMonitoringProps {
  tenantId?: string
  stats?: any
}

export function HealthMonitoring({ tenantId, stats }: HealthMonitoringProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [overallHealth, setOverallHealth] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) return

    const calculateHealth = () => {
      const healthMetrics: HealthMetric[] = []

      if (stats) {
        // Pipeline Health (based on deals in pipeline)
        let pipelineHealth = 0
        if (stats.pipelineByStage && stats.pipelineByStage.length > 0) {
          const totalDeals = stats.pipelineByStage.reduce(
            (sum: number, stage: any) => sum + stage.count,
            0
          )
          pipelineHealth = Math.min((totalDeals / 20) * 100, 100) // Normalize to 100
        }
        healthMetrics.push({
          id: '1',
          name: 'Pipeline Health',
          value: pipelineHealth,
          max: 100,
          status: pipelineHealth >= 70 ? 'excellent' : pipelineHealth >= 50 ? 'good' : pipelineHealth >= 30 ? 'warning' : 'critical',
          trend: 'up',
        })

        // Revenue Health (based on revenue)
        let revenueHealth = 0
        if (stats.revenueThisMonth > 0) {
          revenueHealth = Math.min((stats.revenueThisMonth / 1000000) * 100, 100) // Normalize to 100
        }
        healthMetrics.push({
          id: '2',
          name: 'Revenue Health',
          value: revenueHealth,
          max: 100,
          status: revenueHealth >= 70 ? 'excellent' : revenueHealth >= 50 ? 'good' : revenueHealth >= 30 ? 'warning' : 'critical',
          trend: 'up',
        })

        // Task Health (inverse of overdue tasks)
        let taskHealth = 100
        if (stats.overdueTasks > 0) {
          taskHealth = Math.max(100 - (stats.overdueTasks * 10), 0)
        }
        healthMetrics.push({
          id: '3',
          name: 'Task Health',
          value: taskHealth,
          max: 100,
          status: taskHealth >= 70 ? 'excellent' : taskHealth >= 50 ? 'good' : taskHealth >= 30 ? 'warning' : 'critical',
          trend: taskHealth >= 70 ? 'up' : 'down',
        })

        // Activity Health (based on deals created)
        let activityHealth = 0
        if (stats.dealsCreatedThisMonth > 0) {
          activityHealth = Math.min((stats.dealsCreatedThisMonth / 10) * 100, 100)
        }
        healthMetrics.push({
          id: '4',
          name: 'Activity Health',
          value: activityHealth,
          max: 100,
          status: activityHealth >= 70 ? 'excellent' : activityHealth >= 50 ? 'good' : activityHealth >= 30 ? 'warning' : 'critical',
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
      <Card className="border-0 shadow-md">
        <CardHeader>
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
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Health Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Health Score */}
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Overall Health Score</p>
              <p className="text-4xl font-bold text-purple-600">{overallHealth}%</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
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
        <div className="space-y-3">
          {(Array.isArray(metrics) ? metrics : []).map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(metric.status)}
                  <span className="text-sm font-semibold text-gray-900">{metric.name}</span>
                </div>
                <span className={`text-sm font-bold ${getStatusColor(metric.status)}`}>
                  {Math.round(metric.value)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
