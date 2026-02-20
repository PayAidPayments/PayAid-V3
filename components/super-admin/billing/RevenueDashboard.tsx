'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const CHART_COLORS = ['#53328A', '#F5C700', '#8B5CF6', '#EC4899', '#10B981', '#3B82F6']

interface RevenueData {
  mrr: number
  arr: number
  mrrGrowth: string
  churnRate: string
  paidTenants: number
  revenueByPlan: Record<string, number>
  topTenants: Array<{
    tenantId: string
    tenantName: string
    mrr: number
    tier: string
  }>
}

interface RevenueDashboardProps {
  data: RevenueData | null
  loading?: boolean
}

export function RevenueDashboard({ data, loading }: RevenueDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No revenue data available
      </div>
    )
  }

  const mrrGrowthNum = parseFloat(data.mrrGrowth)
  const isGrowthPositive = mrrGrowthNum > 0

  return (
    <div className="space-y-6">
      {/* MRR Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.mrr / 1000).toFixed(0)}K</div>
            <div className="flex items-center gap-1 mt-1">
              {isGrowthPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${isGrowthPositive ? 'text-green-500' : 'text-red-500'}`}>
                {data.mrrGrowth}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(data.arr / 1_00_000).toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground mt-1">Churn: {data.churnRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.paidTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.churnRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Plan */}
      {Object.keys(data.revenueByPlan).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(data.revenueByPlan)
                        .sort(([, a], [, b]) => b - a)
                        .map(([plan, revenue], idx) => ({
                          name: plan,
                          value: revenue,
                          color: CHART_COLORS[idx % CHART_COLORS.length],
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.name ?? ''}: ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(data.revenueByPlan).map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => `₹${((value ?? 0) / 1000).toFixed(0)}K`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* List View */}
              <div className="space-y-2">
                {Object.entries(data.revenueByPlan)
                  .sort(([, a], [, b]) => b - a)
                  .map(([plan, revenue]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{plan}</Badge>
                      </div>
                      <span className="font-medium">₹{(revenue / 1000).toFixed(0)}K</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Tenants */}
      {data.topTenants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Tenants by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topTenants.map((t) => (
                  <TableRow key={t.tenantId}>
                    <TableCell className="font-medium">{t.tenantName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.tier}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(t.mrr / 1000).toFixed(0)}K
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
