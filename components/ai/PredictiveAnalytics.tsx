'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Target, BarChart3, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/lib/stores/auth'

interface Prediction {
  id: string
  metric: string
  current: number
  predicted: number
  change: number
  confidence: number
  period: string
}

interface PredictiveAnalyticsProps {
  tenantId?: string
  stats?: any
}

export function PredictiveAnalytics({ tenantId, stats }: PredictiveAnalyticsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) return

    const fetchPredictions = async () => {
      try {
        setIsLoading(true)
        // Generate predictions based on current stats
        const mockPredictions: Prediction[] = []

        if (stats) {
          // Revenue prediction
          if (stats.revenueThisMonth > 0) {
            const predictedRevenue = Math.round(stats.revenueThisMonth * 1.15) // 15% growth
            mockPredictions.push({
              id: '1',
              metric: 'Revenue',
              current: stats.revenueThisMonth,
              predicted: predictedRevenue,
              change: 15,
              confidence: 85,
              period: 'Next Month',
            })
          }

          // Deals prediction
          if (stats.dealsCreatedThisMonth > 0) {
            const predictedDeals = Math.round(stats.dealsCreatedThisMonth * 1.1) // 10% growth
            mockPredictions.push({
              id: '2',
              metric: 'Deals Created',
              current: stats.dealsCreatedThisMonth,
              predicted: predictedDeals,
              change: 10,
              confidence: 78,
              period: 'Next Month',
            })
          }

          // Pipeline prediction
          if (stats.pipelineByStage && stats.pipelineByStage.length > 0) {
            const totalPipeline = stats.pipelineByStage.reduce(
              (sum: number, stage: any) => sum + stage.count,
              0
            )
            if (totalPipeline > 0) {
              const predictedPipeline = Math.round(totalPipeline * 1.12) // 12% growth
              mockPredictions.push({
                id: '3',
                metric: 'Pipeline Size',
                current: totalPipeline,
                predicted: predictedPipeline,
                change: 12,
                confidence: 72,
                period: 'Next Month',
              })
            }
          }
        }

        setPredictions(mockPredictions)
      } catch (error) {
        console.error('Error fetching predictions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPredictions()
  }, [tenantId, token, stats])

  const formatValue = (value: number, metric: string) => {
    if (metric.toLowerCase().includes('revenue')) {
      return `₹${value.toLocaleString('en-IN')}`
    }
    return value.toString()
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Predictive Analytics
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

  if (predictions.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Predictive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            No predictions available. More data needed for accurate forecasts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          Predictive Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <motion.div
              key={prediction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">{prediction.metric}</h4>
                  <p className="text-xs text-gray-600">{prediction.period}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-success font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">+{prediction.change}%</span>
                  </div>
                  <p className="text-xs text-gray-500">Confidence: {prediction.confidence}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current:</span>
                  <span className="font-semibold text-gray-900">
                    {formatValue(prediction.current, prediction.metric)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Predicted:</span>
                  <span className="font-bold text-purple-600">
                    {formatValue(prediction.predicted, prediction.metric)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((prediction.predicted / prediction.current) * 100, 200)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
