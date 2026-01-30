'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown, Users, IndianRupee } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AnalyticsDashboardStats {
  totalViews: number
  viewsThisMonth: number
  viewsLastMonth: number
  viewsGrowth: number
  totalUsers: number
  activeUsers: number
  revenue: number
  revenueGrowth: number
  monthlyData: Array<{
    month: string
    views: number
    users: number
    revenue: number
  }>
}

// PayAid Brand Colors for charts
const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const SUCCESS = '#059669'
const INFO = '#0284C7'

export default function AnalyticsDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [stats, setStats] = useState<AnalyticsDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [tenantId])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data for now
      const mockStats: AnalyticsDashboardStats = {
        totalViews: 125000,
        viewsThisMonth: 15000,
        viewsLastMonth: 12000,
        viewsGrowth: 25.0,
        totalUsers: 8500,
        activeUsers: 3200,
        revenue: 4500000,
        revenueGrowth: 18.5,
        monthlyData: [
          { month: 'Jan', views: 10000, users: 2500, revenue: 3500000 },
          { month: 'Feb', views: 12000, users: 2800, revenue: 3800000 },
          { month: 'Mar', views: 15000, users: 3200, revenue: 4500000 },
        ],
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      setStats(mockStats)
    } catch (error: any) {
      console.error('Failed to fetch analytics stats:', error)
      setError(error.message || 'An unexpected error occurred.')
      setStats({
        totalViews: 0,
        viewsThisMonth: 0,
        viewsLastMonth: 0,
        viewsGrowth: 0,
        totalUsers: 0,
        activeUsers: 0,
        revenue: 0,
        revenueGrowth: 0,
        monthlyData: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoading message="Loading Analytics dashboard..." fullScreen={true} />
  }

  const moduleConfig = getModuleConfig('analytics') || getModuleConfig('crm')!

  const heroMetrics = [
    {
      label: 'Total Views',
      value: stats?.totalViews.toLocaleString('en-IN') || '0',
      change: stats?.viewsGrowth,
      trend: (stats?.viewsGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'purple' as const,
    },
    {
      label: 'Active Users',
      value: stats?.activeUsers.toLocaleString('en-IN') || '0',
      icon: <Users className="w-5 h-5" />,
      color: 'info' as const,
    },
    {
      label: 'Revenue',
      value: stats?.revenue ? formatINRForDisplay(stats.revenue) : '₹0',
      change: stats?.revenueGrowth,
      trend: (stats?.revenueGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'gold' as const,
    },
    {
      label: 'Growth Rate',
      value: `${stats?.viewsGrowth.toFixed(1) || 0}%`,
      change: stats?.viewsGrowth,
      trend: (stats?.viewsGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: (stats?.viewsGrowth || 0) > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />,
      color: (stats?.viewsGrowth || 0) > 0 ? 'success' as const : 'error' as const,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Analytics"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-medium">Error:</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <GlassCard delay={0.1}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Monthly Trends</CardTitle>
              <CardDescription>Views, users, and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.monthlyData && stats.monthlyData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke={PURPLE_PRIMARY} name="Views" />
                      <Line type="monotone" dataKey="users" stroke={INFO} name="Users" />
                      <Line type="monotone" dataKey="revenue" stroke={GOLD_ACCENT} name="Revenue" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No data available</p>
                </div>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.2}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Total Users</span>
                  <span className="font-bold text-gray-900">{stats?.totalUsers.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Active Users</span>
                  <span className="font-bold text-gray-900">{stats?.activeUsers.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Total Revenue</span>
                  <span className="font-bold text-gray-900">{stats?.revenue ? formatINRForDisplay(stats.revenue) : '₹0'}</span>
                </div>
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
