'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IndianRupee, Plus, Calendar, Users, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default function HRPayrollRunsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const payrollRuns = [
    {
      id: '1',
      cycleName: 'February 2026',
      runDate: '2026-02-28',
      status: 'COMPLETED',
      employees: 47,
      totalAmount: 4200000,
      processedDate: '2026-02-27',
    },
    {
      id: '2',
      cycleName: 'January 2026',
      runDate: '2026-01-31',
      status: 'COMPLETED',
      employees: 45,
      totalAmount: 4000000,
      processedDate: '2026-01-30',
    },
    {
      id: '3',
      cycleName: 'March 2026',
      runDate: '2026-03-31',
      status: 'DRAFT',
      employees: 47,
      totalAmount: 0,
      processedDate: null,
    },
  ]

  const upcomingRuns = [
    {
      id: '3',
      cycleName: 'March 2026',
      runDate: '2026-03-31',
      employees: 47,
      estimatedAmount: 4200000,
    },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Payroll Runs"
        moduleIcon={<IndianRupee className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Bulk & Off-cycle Payroll Processing"
      />

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Next Payroll</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(4200000)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Due: Mar 31, 2026</p>
                </div>
                <Calendar className="h-10 w-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(4200000)}</p>
                  <p className="text-xs text-muted-foreground mt-1">47 employees</p>
                </div>
                <Users className="h-10 w-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-xs text-muted-foreground mt-1">Draft runs</p>
                </div>
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Payroll-Runs/new`}>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Payroll Run
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button variant="outline">
            Bulk Process
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Runs</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Payroll Runs</CardTitle>
                <CardDescription>View and manage all payroll processing runs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Run Date</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.cycleName}</TableCell>
                        <TableCell>{format(new Date(run.runDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{run.employees}</TableCell>
                        <TableCell>
                          {run.totalAmount > 0 ? formatINRForDisplay(run.totalAmount) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              run.status === 'COMPLETED' ? 'default' :
                              run.status === 'DRAFT' ? 'secondary' :
                              'outline'
                            }
                          >
                            {run.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {run.processedDate ? format(new Date(run.processedDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Payroll-Runs/${run.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payroll Runs</CardTitle>
                <CardDescription>Scheduled payroll runs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Run Date</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Estimated Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingRuns.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium">{run.cycleName}</TableCell>
                        <TableCell>{format(new Date(run.runDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{run.employees}</TableCell>
                        <TableCell>{formatINRForDisplay(run.estimatedAmount)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Payroll-Runs/${run.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Payroll Runs</CardTitle>
                <CardDescription>Successfully processed payroll runs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>2 completed runs</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="draft" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Draft Payroll Runs</CardTitle>
                <CardDescription>Payroll runs in draft status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>1 draft run pending</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
