'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Calendar, FileText, Clock, Users, TrendingUp, CheckCircle, AlertCircle, Plus, MessageCircle, Settings } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

export default function HRLeavePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const leaveStats = {
    pendingApprovals: 8,
    utilizationRate: 5.1,
    avgLeaveDays: 3.2,
    balanceTrend: '+2%',
    totalBalance: 450,
    usedThisMonth: 23,
  }

  const holidays = [
    { id: '1', name: 'Republic Day', date: '2026-01-26', type: 'NATIONAL', locations: ['All'] },
    { id: '2', name: 'Holi', date: '2026-03-14', type: 'NATIONAL', locations: ['All'] },
    { id: '3', name: 'Good Friday', date: '2026-04-03', type: 'NATIONAL', locations: ['All'] },
    { id: '4', name: 'Karnataka Rajyotsava', date: '2026-11-01', type: 'STATE', locations: ['Bangalore'] },
  ]

  const leavePolicies = [
    { id: '1', name: 'Casual Leave', type: 'CL', balance: 12, accrual: 'FIXED', carryForward: 0, employees: 47 },
    { id: '2', name: 'Sick Leave', type: 'SL', balance: 12, accrual: 'FIXED', carryForward: 0, employees: 47 },
    { id: '3', name: 'Privilege Leave', type: 'PL', balance: 15, accrual: 'ACCRUAL', carryForward: 5, employees: 47 },
  ]

  const approvalWorkflow = [
    { level: 1, approver: 'Direct Manager', required: true, status: 'PENDING' },
    { level: 2, approver: 'Department Head', required: true, status: 'PENDING' },
    { level: 3, approver: 'HR Manager', required: false, status: 'SKIPPED' },
  ]

  const leaveTrend = [
    { month: 'Oct', utilization: 4.2, balance: 420 },
    { month: 'Nov', utilization: 4.8, balance: 435 },
    { month: 'Dec', utilization: 5.0, balance: 440 },
    { month: 'Jan', utilization: 5.1, balance: 450 },
  ]

  const CHART_COLORS = ['#53328A', '#F5C700', '#059669', '#0284C7']

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Leaves & Holidays"
        moduleIcon={<Calendar className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Multi-Approval Workflow & Holidays Management"
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold">{leaveStats.pendingApprovals}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilization Rate</p>
                  <p className="text-2xl font-bold">{leaveStats.utilizationRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-2xl font-bold">{leaveStats.totalBalance}</p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Used This Month</p>
                  <p className="text-2xl font-bold">{leaveStats.usedThisMonth}</p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Approval & WhatsApp Banner */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Multi-Layer Approval & WhatsApp Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approve leaves via WhatsApp with multi-level approval workflow</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Configure Workflow
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Leave/Apply`}>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </Link>
          <Link href={`/hr/${tenantId}/Leave/Requests`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Requests
            </Button>
          </Link>
          <Link href={`/hr/${tenantId}/Leave/Balances`}>
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              View Balances
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="policies">Leave Policies</TabsTrigger>
            <TabsTrigger value="holidays">Holidays Calendar</TabsTrigger>
            <TabsTrigger value="approval">Approval Workflow</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Leave Utilization Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Utilization Trends</CardTitle>
                <CardDescription>Monthly utilization rate and balance trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leaveTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="utilization" stroke="#53328A" name="Utilization %" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="balance" stroke="#F5C700" name="Total Balance" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>{leaveStats.pendingApprovals} leave requests awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {approvalWorkflow.map((level) => (
                    <div key={level.level} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        level.status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                        level.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {level.status === 'APPROVED' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span>{level.level}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{level.approver}</p>
                        <p className="text-sm text-muted-foreground">
                          {level.required ? 'Required' : 'Optional'}
                        </p>
                      </div>
                      <Badge
                        variant={
                          level.status === 'APPROVED' ? 'default' :
                          level.status === 'PENDING' ? 'secondary' :
                          'outline'
                        }
                      >
                        {level.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Leave Policies</CardTitle>
                    <CardDescription>Configure leave types and accrual rules</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Policy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Accrual</TableHead>
                      <TableHead>Carry Forward</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leavePolicies.map((policy) => (
                      <TableRow key={policy.id}>
                        <TableCell className="font-medium">{policy.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{policy.type}</Badge>
                        </TableCell>
                        <TableCell>{policy.balance} days</TableCell>
                        <TableCell>
                          <Badge variant="outline">{policy.accrual}</Badge>
                        </TableCell>
                        <TableCell>{policy.carryForward} days</TableCell>
                        <TableCell>{policy.employees}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Edit</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="holidays" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Holidays Calendar</CardTitle>
                    <CardDescription>Manage organization holidays by location</CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Holiday
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {holidays.map((holiday) => (
                    <Card key={holiday.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{holiday.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {format(new Date(holiday.date), 'MMMM dd, yyyy')}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{holiday.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Locations: {holiday.locations.join(', ')}
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approval" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Layer Approval Workflow</CardTitle>
                <CardDescription>Configure approval levels and approvers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approvalWorkflow.map((level) => (
                    <div key={level.level} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <span className="font-semibold text-purple-600 dark:text-purple-400">L{level.level}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{level.approver}</p>
                            <p className="text-sm text-muted-foreground">
                              {level.required ? 'Required approval' : 'Optional approval'}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            level.status === 'APPROVED' ? 'default' :
                            level.status === 'PENDING' ? 'secondary' :
                            'outline'
                          }
                        >
                          {level.status}
                        </Badge>
                      </div>
                      <div className="ml-13">
                        <p className="text-sm text-muted-foreground">
                          Leave requests will be routed to {level.approver.toLowerCase()} for approval
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full mt-4">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Approval Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Analytics</CardTitle>
                <CardDescription>Insights and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Leave Distribution by Type</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={leavePolicies.map(p => ({ name: p.type, value: p.balance }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {leavePolicies.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Monthly Leave Usage</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={leaveTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="utilization" fill="#53328A" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
