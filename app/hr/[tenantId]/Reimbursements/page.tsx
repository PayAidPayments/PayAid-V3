'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Receipt, Plus, MessageCircle, CheckCircle, Clock, XCircle, IndianRupee, Filter } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function HRReimbursementsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const reimbursements = [
    {
      id: '1',
      employee: 'Rajesh Kumar',
      category: 'Travel',
      amount: 5000,
      submittedDate: '2026-02-15',
      status: 'PENDING',
      approvedBy: null,
      whatsappApproval: true,
    },
    {
      id: '2',
      employee: 'Priya Sharma',
      category: 'Meals',
      amount: 2500,
      submittedDate: '2026-02-14',
      status: 'APPROVED',
      approvedBy: 'Manager',
      whatsappApproval: true,
    },
    {
      id: '3',
      employee: 'Amit Patel',
      category: 'Office Supplies',
      amount: 3000,
      submittedDate: '2026-02-13',
      status: 'REJECTED',
      approvedBy: null,
      whatsappApproval: false,
    },
  ]

  const pendingCount = reimbursements.filter(r => r.status === 'PENDING').length
  const pendingAmount = reimbursements
    .filter(r => r.status === 'PENDING')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Reimbursements & Expenses"
        moduleIcon={<Receipt className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="WhatsApp Approval Workflow"
      />

      <div className="p-6 space-y-6">
        {/* WhatsApp Approval Banner */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">WhatsApp Approval Enabled</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Approve reimbursements directly via WhatsApp</p>
                </div>
              </div>
              <Button variant="outline">
                Configure WhatsApp
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
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatINRForDisplay(pendingAmount)}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(45000)}</p>
                  <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Processing</p>
                  <p className="text-2xl font-bold">2.5 days</p>
                  <p className="text-xs text-muted-foreground mt-1">Time to approve</p>
                </div>
                <MessageCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Reimbursements/new`}>
            <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Submit Reimbursement
            </Button>
          </Link>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            Bulk Approve
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reimbursements</CardTitle>
                <CardDescription>Awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reimbursements
                      .filter(r => r.status === 'PENDING')
                      .map((reimbursement) => (
                        <TableRow key={reimbursement.id}>
                          <TableCell className="font-medium">
                            {reimbursement.employee?.firstName} {reimbursement.employee?.lastName}
                          </TableCell>
                          <TableCell>{reimbursement.category}</TableCell>
                          <TableCell>{formatINRForDisplay(parseFloat(reimbursement.amount?.toString() || '0'))}</TableCell>
                          <TableCell>{format(new Date(reimbursement.createdAt || reimbursement.expenseDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            {reimbursement.whatsappApproval ? (
                              <Badge variant="outline" className="text-green-600">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Enabled
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(reimbursement.id)}
                                disabled={approveMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectClick(reimbursement.id)}
                                disabled={rejectMutation.isPending}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Approved Reimbursements</CardTitle>
                <CardDescription>Successfully processed</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reimbursements
                      .filter(r => r.status === 'APPROVED')
                      .map((reimbursement) => (
                        <TableRow key={reimbursement.id}>
                          <TableCell className="font-medium">
                            {reimbursement.employee?.firstName} {reimbursement.employee?.lastName}
                          </TableCell>
                          <TableCell>{reimbursement.category}</TableCell>
                          <TableCell>{formatINRForDisplay(parseFloat(reimbursement.amount?.toString() || '0'))}</TableCell>
                          <TableCell>{reimbursement.approvedBy || '-'}</TableCell>
                          <TableCell>{format(new Date(reimbursement.approvedAt || reimbursement.createdAt || reimbursement.expenseDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <Link href={`/hr/${tenantId}/Reimbursements/${reimbursement.id}`}>
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

          <TabsContent value="rejected" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rejected Reimbursements</CardTitle>
                <CardDescription>Rejected requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <XCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>1 rejected reimbursement</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Reimbursements</CardTitle>
                <CardDescription>Complete reimbursement history</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reimbursements.map((reimbursement) => (
                      <TableRow key={reimbursement.id}>
                        <TableCell className="font-medium">{reimbursement.employee}</TableCell>
                        <TableCell>{reimbursement.category}</TableCell>
                        <TableCell>{formatINRForDisplay(reimbursement.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reimbursement.status === 'APPROVED' ? 'default' :
                              reimbursement.status === 'REJECTED' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {reimbursement.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(reimbursement.submittedDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Reimbursements/${reimbursement.id}`}>
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
        </Tabs>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Reimbursement</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this reimbursement request.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false)
                  setRejectionReason('')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                variant="destructive"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
