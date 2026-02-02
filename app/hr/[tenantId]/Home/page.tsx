'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  IndianRupee, 
  Calendar, 
  Clock, 
  Briefcase, 
  TrendingUp, 
  RefreshCw, 
  ArrowUpRight,
  UserPlus
} from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { DashboardLoading } from '@/components/ui/loading'
import { AIAnalytics } from '@/components/hr/AIAnalytics'
// ModuleTopBar is now in layout.tsx
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
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

interface HRDashboardStats {
  totalEmployees: number
  activeEmployees: number
  onLeave: number
  pendingPayroll: number
  openPositions: number
  employeeGrowth: number
  attendanceRate: number
  leaveUtilization: number
  recentHires: Array<{
    id: string
    name: string
    department: string
    position: string
    joinDate: string
  }>
  employeesByDepartment: Array<{
    department: string
    count: number
  }>
  monthlyEmployeeGrowth: Array<{
    month: string
    count: number
  }>
}

// PayAid brand colors for charts
const PAYAID_PINK = '#EC4899'
const PAYAID_DARK_PINK = '#DB2777'
const CHART_COLORS = [PAYAID_PINK, '#F472B6', '#FBBF24', '#10B981', '#3B82F6']

export default function HRDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, tenant, token } = useAuthStore()
  const [stats, setStats] = useState<HRDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const hasFetchedData = useRef(false)

  // Handle authentication and mount
  useEffect(() => {
    setMounted(true)
    
    // Quick auth check - if no token after a short delay, redirect
    const timeoutId = setTimeout(() => {
      const currentState = useAuthStore.getState()
      const finalToken = currentState.token
      
      if (!finalToken && typeof window !== 'undefined') {
        // Try localStorage as fallback
        try {
          const stored = localStorage.getItem('auth-storage')
          if (stored) {
            const parsed = JSON.parse(stored)
            const tokenFromStorage = parsed.state?.token || null
            if (!tokenFromStorage) {
              router.replace(`/login?redirect=${encodeURIComponent(`/hr/${tenantId}/Home/`)}`)
              return
            }
          } else {
            router.replace(`/login?redirect=${encodeURIComponent(`/hr/${tenantId}/Home/`)}`)
            return
          }
        } catch (error) {
          router.replace(`/login?redirect=${encodeURIComponent(`/hr/${tenantId}/Home/`)}`)
          return
        }
      }
    }, 100) // Reduced delay
    
    return () => clearTimeout(timeoutId)
  }, [router, tenantId])

  // Fetch data once when mounted and tenantId is available
  useEffect(() => {
    if (mounted && tenantId && !hasFetchedData.current) {
      hasFetchedData.current = true
      fetchDashboardStats()
    }
  }, [tenantId, mounted])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = useAuthStore.getState().token
      
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }

      // Fetch from API
      const response = await fetch(`/api/hr/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch HR dashboard stats: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error)
      setError(error.message || 'An unexpected error occurred while fetching data.')
      
      // Fallback to mock data if API fails
      const mockStats: HRDashboardStats = {
        totalEmployees: 156,
        activeEmployees: 142,
        onLeave: 8,
        pendingPayroll: 1420000,
        openPositions: 12,
        employeeGrowth: 8.3,
        attendanceRate: 94.5,
        leaveUtilization: 5.1,
        recentHires: [],
        employeesByDepartment: [
          { department: 'Sales', count: 45 },
          { department: 'Engineering', count: 38 },
          { department: 'Marketing', count: 22 },
          { department: 'HR', count: 15 },
          { department: 'Finance', count: 36 },
        ],
        monthlyEmployeeGrowth: [
          { month: 'Jan', count: 140 },
          { month: 'Feb', count: 145 },
          { month: 'Mar', count: 156 },
        ],
      }
      setStats(mockStats)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <DashboardLoading message="Loading HR dashboard..." />
  }

  // Get module configuration
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Hero metrics
  const heroMetrics = [
    {
      label: 'Total Employees',
      value: stats?.totalEmployees || 0,
      change: stats?.employeeGrowth,
      trend: (stats?.employeeGrowth || 0) > 0 ? 'up' as const : 'down' as const,
      icon: <Users className="w-5 h-5" />,
      color: 'purple' as const,
      href: `/hr/${tenantId}/Employees`,
    },
    {
      label: 'Active Employees',
      value: stats?.activeEmployees || 0,
      icon: <Briefcase className="w-5 h-5" />,
      color: 'success' as const,
      href: `/hr/${tenantId}/Employees?status=ACTIVE`,
    },
    {
      label: 'On Leave',
      value: stats?.onLeave || 0,
      icon: <Calendar className="w-5 h-5" />,
      color: 'warning' as const,
      href: `/hr/${tenantId}/Leave`,
    },
    {
      label: 'Pending Payroll',
      value: stats?.pendingPayroll ? formatINRForDisplay(stats.pendingPayroll) : '₹0',
      icon: <IndianRupee className="w-5 h-5" />,
      color: 'gold' as const,
      href: `/hr/${tenantId}/Payroll`,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="HR"
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

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard delay={0.1}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats?.attendanceRate?.toFixed(1) || 0}%</div>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.2}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Leave Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-info">{stats?.leaveUtilization?.toFixed(1) || 0}%</div>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.3}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Employee Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">+{stats?.employeeGrowth?.toFixed(1) || 0}%</div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard delay={0.4}>
            <CardHeader>
              <CardTitle>Monthly Employee Growth</CardTitle>
              <CardDescription>Employee count over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.monthlyEmployeeGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLORS[0]} name="Employees" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </GlassCard>

          <GlassCard delay={0.5}>
            <CardHeader>
              <CardTitle>Employees by Department</CardTitle>
              <CardDescription>Distribution of employees</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats?.employeesByDepartment || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.department || entry.name || ''} ${entry.percent ? (entry.percent * 100).toFixed(0) : 0}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(stats?.employeesByDepartment || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </GlassCard>
        </div>

        {/* AI Analytics */}
        <AIAnalytics tenantId={tenantId} />
      </div>
    </div>
  )
}

