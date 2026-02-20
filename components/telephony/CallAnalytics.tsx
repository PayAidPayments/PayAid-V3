/**
 * Call Analytics Component
 * Display call analytics and metrics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger } from '@/components/ui/custom-select'
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, Users } from 'lucide-react'

interface CallAnalytics {
  totalCalls: number
  inboundCalls: number
  outboundCalls: number
  averageDuration: number
  missedCalls: number
  answeredCalls: number
  byRep: Array<{
    repId: string
    repName: string
    callCount: number
    averageDuration: number
  }>
}

interface CallAnalyticsProps {
  tenantId: string
}

export function CallAnalytics({ tenantId }: CallAnalyticsProps) {
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [tenantId, period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const endDate = new Date()
      const startDate = new Date()
      
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30)
      } else {
        startDate.setDate(startDate.getDate() - 90)
      }

      const response = await fetch(
        `/api/telephony/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data.data)
    } catch (error) {
      console.error('Error fetching call analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading analytics...</div>
        </CardContent>
      </Card>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Call Analytics</CardTitle>
              <CardDescription>Call metrics and performance</CardDescription>
            </div>
            <CustomSelect value={period} onValueChange={(value: string) => setPeriod(value as '7d' | '30d' | '90d')} placeholder="Select period">
              <CustomSelectTrigger className="w-32">
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="7d">Last 7 days</CustomSelectItem>
                <CustomSelectItem value="30d">Last 30 days</CustomSelectItem>
                <CustomSelectItem value="90d">Last 90 days</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Calls</p>
                    <p className="text-2xl font-bold">{analytics.totalCalls}</p>
                  </div>
                  <Phone className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inbound</p>
                    <p className="text-2xl font-bold">{analytics.inboundCalls}</p>
                  </div>
                  <PhoneIncoming className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Outbound</p>
                    <p className="text-2xl font-bold">{analytics.outboundCalls}</p>
                  </div>
                  <PhoneOutgoing className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Duration</p>
                    <p className="text-2xl font-bold">{formatDuration(analytics.averageDuration)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {analytics.byRep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Sales Rep</CardTitle>
            <CardDescription>Call performance by representative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.byRep.map((rep) => (
                <div key={rep.repId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{rep.repName}</p>
                      <p className="text-sm text-gray-600">{rep.callCount} calls</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Avg Duration</p>
                    <p className="font-medium">{formatDuration(rep.averageDuration)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
