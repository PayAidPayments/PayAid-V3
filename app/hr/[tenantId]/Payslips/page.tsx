'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Download, Search, Filter, IndianRupee, Calendar, FileCheck } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default function HRPayslipsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const payslips = [
    {
      id: '1',
      employee: 'Rajesh Kumar',
      employeeCode: 'EMP001',
      month: 'February 2026',
      grossSalary: 100000,
      netSalary: 85000,
      status: 'GENERATED',
      generatedDate: '2026-02-27',
    },
    {
      id: '2',
      employee: 'Priya Sharma',
      employeeCode: 'EMP002',
      month: 'February 2026',
      grossSalary: 125000,
      netSalary: 105000,
      status: 'GENERATED',
      generatedDate: '2026-02-27',
    },
    {
      id: '3',
      employee: 'Amit Patel',
      employeeCode: 'EMP003',
      month: 'February 2026',
      grossSalary: 80000,
      netSalary: 68000,
      status: 'PENDING',
      generatedDate: null,
    },
  ]

  const forms = [
    {
      id: '1',
      type: 'Form 16',
      employee: 'Rajesh Kumar',
      financialYear: '2025-26',
      status: 'GENERATED',
      generatedDate: '2026-01-15',
    },
    {
      id: '2',
      type: 'Form 12BA',
      employee: 'Rajesh Kumar',
      financialYear: '2025-26',
      status: 'GENERATED',
      generatedDate: '2026-01-15',
    },
  ]

  const generatedCount = payslips.filter(p => p.status === 'GENERATED').length
  const totalNetSalary = payslips.filter(p => p.status === 'GENERATED').reduce((sum, p) => sum + p.netSalary, 0)

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Payslips & Forms"
        moduleIcon={<FileText className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Form 16, 12BA Auto-Generation"
      />

      <div className="p-6 space-y-6">
        {/* Auto-Generation Banner */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Auto-Generation Enabled</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payslips and tax forms are automatically generated after payroll processing</p>
                </div>
              </div>
              <Button variant="outline">
                Configure Auto-Gen
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
                  <p className="text-sm text-muted-foreground">Generated</p>
                  <p className="text-2xl font-bold">{generatedCount}</p>
                </div>
                <FileCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Net Salary</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(totalNetSalary)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Form 16 Generated</p>
                  <p className="text-2xl font-bold">{forms.filter(f => f.type === 'Form 16').length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{payslips.filter(p => p.status === 'PENDING').length}</p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Bulk Download
          </Button>
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            Generate Form 16
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="payslips" className="space-y-4">
          <TabsList>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="forms">Tax Forms</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="payslips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payslips</CardTitle>
                <CardDescription>Employee payslips for current and past months</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Employee Code</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell className="font-medium">{payslip.employee}</TableCell>
                        <TableCell>{payslip.employeeCode}</TableCell>
                        <TableCell>{payslip.month}</TableCell>
                        <TableCell>{formatINRForDisplay(payslip.grossSalary)}</TableCell>
                        <TableCell className="font-semibold">{formatINRForDisplay(payslip.netSalary)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payslip.status === 'GENERATED' ? 'default' :
                              payslip.status === 'PENDING' ? 'secondary' :
                              'outline'
                            }
                          >
                            {payslip.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payslip.generatedDate ? format(new Date(payslip.generatedDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {payslip.status === 'GENERATED' && (
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Link href={`/hr/${tenantId}/Payslips/${payslip.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tax Forms</CardTitle>
                <CardDescription>Form 16, 12BA, and other tax documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Type</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Financial Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.type}</TableCell>
                        <TableCell>{form.employee}</TableCell>
                        <TableCell>{form.financialYear}</TableCell>
                        <TableCell>
                          <Badge variant={form.status === 'GENERATED' ? 'default' : 'secondary'}>
                            {form.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(form.generatedDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Link href={`/hr/${tenantId}/Payslips/Forms/${form.id}`}>
                              <Button variant="ghost" size="sm">View</Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payslip History</CardTitle>
                <CardDescription>Historical payslip records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Historical payslip records</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
