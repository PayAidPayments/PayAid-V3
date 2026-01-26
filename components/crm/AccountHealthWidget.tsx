/**
 * Account Health Widget Component
 * Displays account health score and recommendations
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react'

interface AccountHealthData {
  score: number
  riskLevel: 'green' | 'yellow' | 'red'
  factors: {
    engagement: number
    revenue: number
    support: number
    contract: number
  }
  recommendations: string[]
  lastUpdated: Date
}

interface AccountHealthWidgetProps {
  accountId: string
  tenantId: string
  compact?: boolean
}

export function AccountHealthWidget({ accountId, tenantId, compact = false }: AccountHealthWidgetProps) {
  const [health, setHealth] = useState<AccountHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
  }, [accountId, tenantId])

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/accounts/${accountId}/health`)
      const data = await response.json()
      if (data.success) {
        setHealth(data.data)
      } else {
        setError('Failed to load health data')
      }
    } catch (err) {
      setError('Error loading health data')
      console.error('Error fetching account health:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'green':
        return <CheckCircle2 className="h-4 w-4" />
      case 'yellow':
        return <AlertCircle className="h-4 w-4" />
      case 'red':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">Loading health data...</div>
        </CardContent>
      </Card>
    )
  }

  if (error || !health) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-600">{error || 'No health data available'}</div>
          <Button onClick={fetchHealth} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Account Health</CardTitle>
            <Badge className={getRiskColor(health.riskLevel)}>
              {getRiskIcon(health.riskLevel)}
              <span className="ml-1">{health.score}/100</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium">{health.factors.engagement}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-medium">{health.factors.revenue}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Account Health</CardTitle>
            <CardDescription>Overall health score and risk assessment</CardDescription>
          </div>
          <Badge className={getRiskColor(health.riskLevel)}>
            {getRiskIcon(health.riskLevel)}
            <span className="ml-1 capitalize">{health.riskLevel}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-2xl font-bold">{health.score}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className={`h-2.5 rounded-full ${
                health.riskLevel === 'green'
                  ? 'bg-green-600'
                  : health.riskLevel === 'yellow'
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
              }`}
              style={{ width: `${health.score}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium">{health.factors.engagement}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${health.factors.engagement}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Revenue</span>
              <span className="font-medium">{health.factors.revenue}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-green-600 h-1.5 rounded-full"
                style={{ width: `${health.factors.revenue}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Support</span>
              <span className="font-medium">{health.factors.support}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-purple-600 h-1.5 rounded-full"
                style={{ width: `${health.factors.support}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Contract</span>
              <span className="font-medium">{health.factors.contract}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div
                className="bg-orange-600 h-1.5 rounded-full"
                style={{ width: `${health.factors.contract}%` }}
              />
            </div>
          </div>
        </div>

        {health.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {health.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={fetchHealth} variant="outline" size="sm" className="w-full">
          Refresh Health Score
        </Button>
      </CardContent>
    </Card>
  )
}
