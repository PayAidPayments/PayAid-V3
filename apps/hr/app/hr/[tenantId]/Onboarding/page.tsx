'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, FileText, CheckCircle, Clock, FileCheck, Plus, Users } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default function HROnboardingPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const onboardingInstances = [
    {
      id: '1',
      employee: 'Rajesh Kumar',
      employeeCode: 'EMP001',
      startDate: '2026-02-15',
      status: 'IN_PROGRESS',
      tasksCompleted: 5,
      tasksTotal: 8,
      documentsSigned: 3,
      documentsTotal: 4,
    },
    {
      id: '2',
      employee: 'Priya Sharma',
      employeeCode: 'EMP002',
      startDate: '2026-02-20',
      status: 'IN_PROGRESS',
      tasksCompleted: 2,
      tasksTotal: 8,
      documentsSigned: 1,
      documentsTotal: 4,
    },
    {
      id: '3',
      employee: 'Amit Patel',
      employeeCode: 'EMP003',
      startDate: '2026-01-10',
      status: 'COMPLETED',
      tasksCompleted: 8,
      tasksTotal: 8,
      documentsSigned: 4,
      documentsTotal: 4,
    },
  ]

  const onboardingChecklist = [
    { id: '1', task: 'Send offer letter', category: 'DOCUMENTS', status: 'COMPLETED', assignedTo: 'HR Team' },
    { id: '2', task: 'Collect signed offer letter', category: 'DOCUMENTS', status: 'COMPLETED', assignedTo: 'HR Team' },
    { id: '3', task: 'Setup email and system access', category: 'IT', status: 'COMPLETED', assignedTo: 'IT Team' },
    { id: '4', task: 'Assign workspace and equipment', category: 'FACILITIES', status: 'IN_PROGRESS', assignedTo: 'Admin' },
    { id: '5', task: 'Schedule orientation session', category: 'TRAINING', status: 'PENDING', assignedTo: 'HR Team' },
    { id: '6', task: 'Complete background verification', category: 'VERIFICATION', status: 'PENDING', assignedTo: 'HR Team' },
    { id: '7', task: 'Sign NDA and confidentiality agreement', category: 'DOCUMENTS', status: 'PENDING', assignedTo: 'Employee' },
    { id: '8', task: 'Submit bank details and PAN', category: 'DOCUMENTS', status: 'PENDING', assignedTo: 'Employee' },
  ]

  const eSignDocuments = [
    { id: '1', name: 'Offer Letter', status: 'SIGNED', signedDate: '2026-02-15', employee: 'Rajesh Kumar' },
    { id: '2', name: 'NDA', status: 'PENDING', signedDate: null, employee: 'Rajesh Kumar' },
    { id: '3', name: 'Employment Contract', status: 'PENDING', signedDate: null, employee: 'Rajesh Kumar' },
    { id: '4', name: 'Confidentiality Agreement', status: 'PENDING', signedDate: null, employee: 'Rajesh Kumar' },
  ]

  const inProgress = onboardingInstances.filter(i => i.status === 'IN_PROGRESS').length
  const completed = onboardingInstances.filter(i => i.status === 'COMPLETED').length

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Onboarding"
        moduleIcon={<UserPlus className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Employee & Contractor Checklists with E-Sign"
      />

      <div className="p-6 space-y-6">
        {/* E-Sign Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">E-Signature Enabled</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Offer letters, NDAs, and contracts can be signed digitally</p>
                </div>
              </div>
              <Button variant="outline">
                Configure E-Sign
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  <p className="text-sm text-muted-foreground">Tasks Pending</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Docs Signed</p>
                  <p className="text-2xl font-bold">3/8</p>
                </div>
                <FileCheck className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Onboarding/new`}>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Start Onboarding
            </Button>
          </Link>
          <Link href={`/hr/${tenantId}/Onboarding/Templates`}>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Manage Templates
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="instances" className="space-y-4">
          <TabsList>
            <TabsTrigger value="instances">Onboarding Instances</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="documents">E-Sign Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="instances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Instances</CardTitle>
                <CardDescription>Active and completed onboarding processes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee Code</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Tasks Progress</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onboardingInstances.map((instance) => (
                      <TableRow key={instance.id}>
                        <TableCell className="font-medium">{instance.employee}</TableCell>
                        <TableCell>{instance.employeeCode}</TableCell>
                        <TableCell>{format(new Date(instance.startDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{instance.tasksCompleted}/{instance.tasksTotal}</span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(instance.tasksCompleted / instance.tasksTotal) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{instance.documentsSigned}/{instance.documentsTotal}</span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              instance.status === 'COMPLETED' ? 'default' :
                              instance.status === 'IN_PROGRESS' ? 'secondary' :
                              'outline'
                            }
                          >
                            {instance.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Onboarding/Instances/${instance.id}`}>
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

          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Checklist</CardTitle>
                <CardDescription>Standard onboarding tasks and requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {onboardingChecklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                        item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {item.status === 'COMPLETED' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.task}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category} • Assigned to: {item.assignedTo}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === 'COMPLETED' ? 'default' :
                          item.status === 'IN_PROGRESS' ? 'secondary' :
                          'outline'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>E-Sign Documents</CardTitle>
                <CardDescription>Documents requiring digital signatures</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signed Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eSignDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.employee}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doc.status === 'SIGNED' ? 'default' :
                              doc.status === 'PENDING' ? 'secondary' :
                              'outline'
                            }
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {doc.signedDate ? format(new Date(doc.signedDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {doc.status === 'PENDING' ? (
                            <Button variant="outline" size="sm">Send for Signing</Button>
                          ) : (
                            <Button variant="ghost" size="sm">View</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
