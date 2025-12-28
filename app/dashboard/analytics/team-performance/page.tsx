'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface TeamPerformance {
  period: string
  teamTotals: {
    callsMade: number
    emailsSent: number
    meetingsScheduled: number
    dealsClosed: number
    revenue: number
    avgConversionRate: string
  }
  leaderboard: Array<{
    rank: number
    repId: string
    name: string
    email: string
    specialization: string | null
    metrics: {
      callsMade: number
      emailsSent: number
      meetingsScheduled: number
      dealsClosed: number
      revenue: number
      conversionRate: string
      closeRate: string
      assignedLeads: number
    }
  }>
}

export default function TeamPerformancePage() {
  const [period, setPeriod] = useState('month')

  const { data, isLoading } = useQuery<TeamPerformance>({
    queryKey: ['team-performance', period],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/team-performance?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch team performance')
      return response.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const performance = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Performance</h1>
          <p className="mt-2 text-gray-600">Sales team metrics and leaderboard</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-10 rounded-md border border-gray-300 px-3"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Team Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Calls Made</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{performance?.teamTotals.callsMade || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Deals Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{performance?.teamTotals.dealsClosed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ₹{((performance?.teamTotals.revenue || 0) / 100000).toFixed(1)}L
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Avg Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{performance?.teamTotals.avgConversionRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top performers ranked by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {performance?.leaderboard && performance.leaderboard.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Conv. Rate</TableHead>
                  <TableHead>Close Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.leaderboard.map((rep) => (
                  <TableRow key={rep.repId}>
                    <TableCell>
                      {rep.rank === 1 && '🏆 '}
                      {rep.rank === 2 && '🥈 '}
                      {rep.rank === 3 && '🥉 '}
                      {rep.rank}
                    </TableCell>
                    <TableCell className="font-medium">{rep.name}</TableCell>
                    <TableCell>{rep.specialization || '-'}</TableCell>
                    <TableCell>{rep.metrics.callsMade}</TableCell>
                    <TableCell>{rep.metrics.dealsClosed}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{((rep.metrics.revenue || 0) / 100000).toFixed(1)}L
                    </TableCell>
                    <TableCell>{rep.metrics.conversionRate}%</TableCell>
                    <TableCell>{rep.metrics.closeRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No sales reps found. Create sales reps in Settings → Sales Representatives
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Performance</CardTitle>
          <CardDescription>Detailed metrics for each team member</CardDescription>
        </CardHeader>
        <CardContent>
          {data?.leaderboard && data.leaderboard.length > 0 ? (
            <div className="space-y-4">
              {data.leaderboard.map((rep) => (
                <div key={rep.repId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{rep.name}</h3>
                      <p className="text-sm text-gray-600">{rep.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ₹{((rep.metrics.revenue || 0) / 100000).toFixed(1)}L
                      </div>
                      <div className="text-sm text-gray-600">Revenue</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Calls Made</div>
                      <div className="font-semibold">{rep.metrics.callsMade}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Emails Sent</div>
                      <div className="font-semibold">{rep.metrics.emailsSent}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Deals Closed</div>
                      <div className="font-semibold">{rep.metrics.dealsClosed}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Conversion Rate</div>
                      <div className="font-semibold">{rep.metrics.conversionRate}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No performance data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
