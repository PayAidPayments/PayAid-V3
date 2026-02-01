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
  const hasCheckedAuth = useRef(false)

  // Handle authentication and cookie sync
  useEffect(() => {
    setMounted(true)
    
    // Wait a bit for Zustand to rehydrate
    const checkAuth = () => {
      if (hasCheckedAuth.current) return
      hasCheckedAuth.current = true

      // Check localStorage directly as fallback
      let tokenFromStorage: string | null = null
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('auth-storage')
          if (stored) {
            const parsed = JSON.parse(stored)
            tokenFromStorage = parsed.state?.token || null
            
            if (tokenFromStorage) {
              // Set cookie for middleware access
              const expires = new Date()
              expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
              const isSecure = window.location.protocol === 'https:'
              document.cookie = `token=${tokenFromStorage}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
            }
          }
        } catch (error) {
          console.error('[HR Dashboard] Error syncing token to cookie:', error)
        }
      }

      // Use Zustand state if available, otherwise fall back to localStorage
      const currentState = useAuthStore.getState()
      const finalToken = currentState.token || tokenFromStorage

      // If no token after rehydration, redirect to login
      if (!finalToken) {
        console.log('[HR Dashboard] No token found, redirecting to login')
        router.replace(`/login?redirect=${encodeURIComponent(`/hr/${tenantId}/Home/`)}`)
        return
      }
    }

    // Small delay to allow Zustand to rehydrate
    const timeoutId = setTimeout(checkAuth, 200)
    return () => clearTimeout(timeoutId)
  }, [router, tenantId])

  useEffect(() => {
    if (mounted && hasCheckedAuth.current) {
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

      // For now, use mock data until API is ready
      // TODO: Replace with actual API call: /api/hr/dashboard/stats
      const mockStats: HRDashboardStats = {
        totalEmployees: 156,
        activeEmployees: 142,
        onLeave: 8,
        pendingPayroll: 142,
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setStats(mockStats)
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error)
      setError(error.message || 'An unexpected error occurred while fetching data.')
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
          <Card>
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
          </Card>

          <Card>
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
          </Card>
        </div>
      </div>
    </div>
  )
}

