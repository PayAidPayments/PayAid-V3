'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, Users, CheckCircle, Clock, AlertCircle, FileText, IndianRupee } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default function HROffboardingPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const offboardingCases = [
    {
      id: '1',
      employee: 'Rajesh Kumar',
      department: 'Engineering',
      lastWorkingDay: '2026-03-15',
      status: 'IN_PROGRESS',
      exitType: 'RESIGNATION',
      noticePeriod: 30,
      tasksCompleted: 5,
      tasksTotal: 8,
      finalSettlement: 450000,
    },
    {
      id: '2',
      employee: 'Priya Sharma',
      department: 'Sales',
      lastWorkingDay: '2026-02-28',
      status: 'COMPLETED',
      exitType: 'RESIGNATION',
      noticePeriod: 30,
      tasksCompleted: 8,
      tasksTotal: 8,
      finalSettlement: 380000,
    },
  ]

  const inProgress = offboardingCases.filter(c => c.status === 'IN_PROGRESS').length
  const completed = offboardingCases.filter(c => c.status === 'COMPLETED').length

  const exitWorkflowSteps = [
    { step: 1, name: 'Exit Interview', status: 'COMPLETED' },
    { step: 2, name: 'Knowledge Transfer', status: 'COMPLETED' },
    { step: 3, name: 'Asset Return', status: 'IN_PROGRESS' },
    { step: 4, name: 'Access Revocation', status: 'PENDING' },
    { step: 5, name: 'Final Settlement', status: 'PENDING' },
    { step: 6, name: 'Form 16 & Documents', status: 'PENDING' },
  ]

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Offboarding"
        moduleIcon={<LogOut className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Full Exit Workflows"
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{inProgress}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Processing</p>
                  <p className="text-2xl font-bold">5 days</p>
                </div>
                <LogOut className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Offboarding/new`}>
            <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              <LogOut className="mr-2 h-4 w-4" />
              Initiate Offboarding
            </Button>
          </Link>
          <Button variant="outline">
            View Workflow Templates
          </Button>
        </div>

        {/* Exit Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Exit Workflow Steps</CardTitle>
            <CardDescription>Standard offboarding checklist</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exitWorkflowSteps.map((step) => (
                <div key={step.step} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                    step.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'COMPLETED' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span>{step.step}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.name}</p>
                  </div>
                  <Badge
                    variant={
                      step.status === 'COMPLETED' ? 'default' :
                      step.status === 'IN_PROGRESS' ? 'secondary' :
                      'outline'
                    }
                  >
                    {step.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offboarding Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Offboarding Cases</CardTitle>
            <CardDescription>Active and completed exit processes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Last Working Day</TableHead>
                  <TableHead>Exit Type</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Final Settlement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offboardingCases.map((case_) => (
                  <TableRow key={case_.id}>
                    <TableCell className="font-medium">{case_.employee}</TableCell>
                    <TableCell>{case_.department}</TableCell>
                    <TableCell>{format(new Date(case_.lastWorkingDay), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{case_.exitType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{case_.tasksCompleted}/{case_.tasksTotal}</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(case_.tasksCompleted / case_.tasksTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatINRForDisplay(case_.finalSettlement)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          case_.status === 'COMPLETED' ? 'default' :
                          case_.status === 'IN_PROGRESS' ? 'secondary' :
                          'outline'
                        }
                      >
                        {case_.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/hr/${tenantId}/Offboarding/${case_.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
