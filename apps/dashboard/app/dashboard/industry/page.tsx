'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { getIndustryConfig } from '@/lib/industries/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, DollarSign, Package, Calendar, BarChart3 } from 'lucide-react'

export default function IndustryDashboardPage() {
  const { tenant, isAuthenticated } = useAuthStore()
  const [industryConfig, setIndustryConfig] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (isAuthenticated && tenant?.id) {
      // Fetch tenant industry
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data?.tenant?.industry) {
            const config = getIndustryConfig(data.tenant.industry)
            setIndustryConfig(config)
            
            // Fetch industry-specific stats
            fetch(`/api/dashboard/stats?industry=${data.tenant.industry}`)
              .then(res => res.json())
              .then(statsData => setStats(statsData))
              .catch(err => console.error('Failed to fetch stats:', err))
          }
        })
        .catch(err => console.error('Failed to fetch tenant:', err))
    }
  }, [isAuthenticated, tenant?.id])

  if (!industryConfig) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Loading industry dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">{industryConfig.icon}</span>
            {industryConfig.name} Dashboard
          </h1>
          <p className="text-gray-600 mt-2">{industryConfig.description}</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {industryConfig.name} Business
        </Badge>
      </div>

      {/* Industry-Specific Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats?.revenue?.toLocaleString('en-IN') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.revenueChange ? `+${stats.revenueChange}% from last month` : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.customers?.toLocaleString('en-IN') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.customersChange ? `+${stats.customersChange} new this month` : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders/Transactions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.orders?.toLocaleString('en-IN') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.ordersChange ? `${stats.ordersChange} this month` : 'No data yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.growthRate ? `+${stats.growthRate}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Month-over-month growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Industry-Specific Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Industry Features</CardTitle>
            <CardDescription>Enabled features for {industryConfig.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {industryConfig.industryFeatures.slice(0, 5).map((feature: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for {industryConfig.name} businesses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {industryConfig.aiPrompts.slice(0, 3).map((prompt: string, idx: number) => (
                <div key={idx} className="p-2 bg-gray-50 rounded-md text-sm">
                  {prompt}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

