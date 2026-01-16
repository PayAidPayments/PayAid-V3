'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  Briefcase, 
  TrendingUp, 
  RefreshCw, 
  ArrowUpRight,
  UserPlus
} from 'lucide-react'
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
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [stats, setStats] = useState<HRDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [tenantId])

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

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">HR</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/hr/${tenantId}/Home/`} className="text-pink-600 font-medium border-b-2 border-pink-600 pb-2">Home</Link>
              <Link href={`/hr/${tenantId}/Employees`} className="text-gray-600 hover:text-gray-900 transition-colors">Employees</Link>
              <Link href={`/hr/${tenantId}/Payroll`} className="text-gray-600 hover:text-gray-900 transition-colors">Payroll</Link>
              <Link href={`/hr/${tenantId}/Leave`} className="text-gray-600 hover:text-gray-900 transition-colors">Leave</Link>
              <Link href={`/hr/${tenantId}/Attendance`} className="text-gray-600 hover:text-gray-900 transition-colors">Attendance</Link>
              <Link href={`/hr/${tenantId}/Hiring`} className="text-gray-600 hover:text-gray-900 transition-colors">Hiring</Link>
              <Link href={`/hr/${tenantId}/Onboarding`} className="text-gray-600 hover:text-gray-900 transition-colors">Onboarding</Link>
              <Link href={`/hr/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchDashboardStats}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <ModuleSwitcher currentModule="hr" />
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-6 shadow-lg mt-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
            <p className="text-pink-100">Manage your workforce and track HR metrics</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Employees</CardTitle>
              <Users className="w-4 h-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{stats?.activeEmployees || 0} active</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">On Leave</CardTitle>
              <Calendar className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.onLeave || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Currently on leave</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payroll</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingPayroll || 0}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Open Positions</CardTitle>
              <Briefcase className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.openPositions || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Hiring</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.attendanceRate?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Leave Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.leaveUtilization?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Employee Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">+{stats?.employeeGrowth?.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>
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
                    label={({ department, percent }) => `${department} ${(percent * 100).toFixed(0)}%`}
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

