'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Briefcase, Edit, IndianRupee, FileText, Calendar, Building2, CreditCard, AlertCircle } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'

interface Contractor {
  id: string
  contractorCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  startDate: string
  endDate?: string
  monthlyRate?: number
  tdsApplicable: boolean
  tdsRate?: number
  panNumber?: string
  department?: { id: string; name: string }
  project?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

export default function HRContractorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const contractorId = params?.id as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const { data: contractor, isLoading } = useQuery<Contractor>({
    queryKey: ['contractor', contractorId],
    queryFn: async () => {
      // Mock data for now - replace with real API
      return {
        id: contractorId,
        contractorCode: 'CNT001',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91 9876543210',
        status: 'ACTIVE',
        startDate: '2025-01-15',
        endDate: null,
        monthlyRate: 75000,
        tdsApplicable: true,
        tdsRate: 10,
        panNumber: 'ABCDE1234F',
        department: { id: '1', name: 'Engineering' },
        project: 'Project Alpha',
        address: '123 Main Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
      }
    },
  })

  // Mock payment history
  const paymentHistory = [
    { id: '1', month: 'January 2026', amount: 75000, tds: 7500, netAmount: 67500, status: 'PAID', paidDate: '2026-02-05' },
    { id: '2', month: 'December 2025', amount: 75000, tds: 7500, netAmount: 67500, status: 'PAID', paidDate: '2026-01-05' },
    { id: '3', month: 'November 2025', amount: 75000, tds: 7500, netAmount: 67500, status: 'PAID', paidDate: '2025-12-05' },
  ]

  if (isLoading) {
    return <PageLoading message="Loading contractor details..." fullScreen={false} />
  }

  if (!contractor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Contractor not found</p>
        <Link href={`/hr/${tenantId}/Contractors`}>
          <Button>Back to Contractors</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName={`${contractor.firstName} ${contractor.lastName}`}
        moduleIcon={<Briefcase className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description={`Contractor Code: ${contractor.contractorCode}`}
      />

      <div className="p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link href={`/hr/${tenantId}/Contractors`}>
            <Button variant="outline">← Back to Contractors</Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/hr/${tenantId}/Contractors/${contractorId}/Edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Contractor
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rate</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(contractor.monthlyRate || 0)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">TDS Rate</p>
                  <p className="text-2xl font-bold">{contractor.tdsApplicable ? `${contractor.tdsRate || 10}%` : 'N/A'}</p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-bold">
                    <Badge variant={contractor.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {contractor.status}
                    </Badge>
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-2xl font-bold">{format(new Date(contractor.startDate), 'MMM yyyy')}</p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TDS Automation Banner */}
        {contractor.tdsApplicable && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">TDS Automation Enabled</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    TDS of {contractor.tdsRate}% ({formatINRForDisplay((contractor.monthlyRate || 0) * (contractor.tdsRate || 10) / 100)}) 
                    is automatically deducted from monthly payments. Form 16A certificates are auto-generated quarterly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tds">TDS Configuration</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="font-medium">{contractor.firstName} {contractor.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="font-medium">{contractor.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="font-medium">{contractor.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">PAN Number</span>
                    <span className="font-medium">{contractor.panNumber || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Department</span>
                    <span className="font-medium">{contractor.department?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Project</span>
                    <span className="font-medium">{contractor.project || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Start Date</span>
                    <span className="font-medium">{format(new Date(contractor.startDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">End Date</span>
                    <span className="font-medium">{contractor.endDate ? format(new Date(contractor.endDate), 'MMM dd, yyyy') : 'Ongoing'}</span>
                  </div>
                </CardContent>
              </Card>

              {contractor.address && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">
                      {contractor.address}, {contractor.city}, {contractor.state} - {contractor.pincode}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>TDS Configuration</CardTitle>
                <CardDescription>Tax Deducted at Source settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">TDS Applicable</p>
                    <p className="text-sm text-muted-foreground">Whether TDS should be deducted</p>
                  </div>
                  <Badge variant={contractor.tdsApplicable ? 'default' : 'secondary'}>
                    {contractor.tdsApplicable ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {contractor.tdsApplicable && (
                  <>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">TDS Rate</p>
                        <p className="text-sm text-muted-foreground">Percentage to deduct</p>
                      </div>
                      <span className="text-lg font-semibold">{contractor.tdsRate || 10}%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Monthly TDS Amount</p>
                        <p className="text-sm text-muted-foreground">Auto-calculated</p>
                      </div>
                      <span className="text-lg font-semibold">
                        {formatINRForDisplay((contractor.monthlyRate || 0) * (contractor.tdsRate || 10) / 100)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">PAN Number</p>
                        <p className="text-sm text-muted-foreground">Required for TDS</p>
                      </div>
                      <span className="font-medium">{contractor.panNumber || 'Not provided'}</span>
                    </div>
                  </>
                )}
                <Button variant="outline" className="w-full">
                  Edit TDS Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Monthly payments and TDS deductions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Gross Amount</TableHead>
                      <TableHead>TDS</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.month}</TableCell>
                        <TableCell>{formatINRForDisplay(payment.amount)}</TableCell>
                        <TableCell>{formatINRForDisplay(payment.tds)}</TableCell>
                        <TableCell className="font-semibold">{formatINRForDisplay(payment.netAmount)}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'PAID' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(payment.paidDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Contractor documents and certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No documents uploaded</p>
                  <Button variant="outline" className="mt-4">
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
