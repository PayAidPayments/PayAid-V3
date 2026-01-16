'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
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
import { Calendar, DollarSign, Users, FileText, TrendingUp } from 'lucide-react'

export default function HRPayrollPage() {
  const params = useParams()
  const tenantId = params.tenantId as string

  const { data: cyclesData, isLoading: cyclesLoading } = useQuery({
    queryKey: ['payroll-cycles-summary'],
    queryFn: async () => {
      const response = await fetch('/api/hr/payroll/cycles?limit=12')
      if (!response.ok) throw new Error('Failed to fetch payroll cycles')
      return response.json()
    },
  })

  const { data: runsData, isLoading: runsLoading } = useQuery({
    queryKey: ['payroll-runs-summary'],
    queryFn: async () => {
      const response = await fetch('/api/hr/payroll/runs?limit=100')
      if (!response.ok) throw new Error('Failed to fetch payroll runs')
      return response.json()
    },
  })

  if (cyclesLoading || runsLoading) {
    return <PageLoading message="Loading payroll dashboard..." fullScreen={false} />
  }

  const cycles = cyclesData?.cycles || []
  const runs = runsData?.runs || []

  const totalCycles = cycles.length
  const activeCycles = cycles.filter((c: any) => c.status === 'active').length
  const lockedCycles = cycles.filter((c: any) => c.status === 'locked').length
  const totalRuns = runs.length
  const totalPayroll = runs.reduce((sum: number, r: any) => sum + (parseFloat(r.totalPayrollInr) || 0), 0)

  const monthlyData = cycles.map((cycle: any) => ({
    month: `${cycle.month}/${cycle.year}`,
    payroll: runs
      .filter((r: any) => r.cycleId === cycle.id)
      .reduce((sum: number, r: any) => sum + (parseFloat(r.totalPayrollInr) || 0), 0),
    employees: runs.filter((r: any) => r.cycleId === cycle.id).length,
  }))

  const PAYAID_PURPLE = '#53328A'
  const PAYAID_GOLD = '#F5C700'
  const PAYAID_GREEN = '#10B981'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Payroll Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Overview of payroll cycles, runs, and statistics</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/hr/${tenantId}/Payroll/Cycles/New`}>
            <Button className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Create Payroll Cycle</Button>
          </Link>
          <Link href={`/hr/${tenantId}/Payroll/Salary-Structures`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Salary Structures</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Total Cycles</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">{totalCycles}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Payroll cycles created</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Active Cycles</CardTitle>
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">{activeCycles}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Currently active</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">₹{((totalPayroll || 0) / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">All time total</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-300">Total Runs</CardTitle>
            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">{totalRuns}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Payroll runs executed</p>
          </CardContent>
        </Card>
      </div>

      {monthlyData.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Monthly Payroll Trend</CardTitle>
            <CardDescription className="dark:text-gray-400">Payroll amount and employee count over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="payroll" stroke={PAYAID_PURPLE} name="Payroll (₹)" />
                <Line yAxisId="right" type="monotone" dataKey="employees" stroke={PAYAID_GOLD} name="Employees" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/hr/${tenantId}/Payroll/Cycles`}>
              <Button variant="outline" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                View All Cycles
              </Button>
            </Link>
            <Link href={`/hr/${tenantId}/Payroll/Reports`}>
              <Button variant="outline" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                View Reports
              </Button>
            </Link>
            <Link href={`/hr/${tenantId}/Payroll/Salary-Structures`}>
              <Button variant="outline" className="w-full justify-start dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Manage Salary Structures
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runs.slice(0, 5).map((run: any) => (
                <div key={run.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <div className="text-sm font-medium dark:text-gray-100">Cycle {run.cycle?.month}/{run.cycle?.year}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{run.status}</div>
                  </div>
                  <div className="text-sm font-semibold dark:text-gray-100">₹{((parseFloat(run.totalPayrollInr) || 0) / 1000).toFixed(1)}K</div>
                </div>
              ))}
              {runs.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No payroll runs yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
