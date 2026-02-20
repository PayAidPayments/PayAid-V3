'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Shield, CheckCircle, Clock, AlertCircle, Upload, Download, IndianRupee, FileText } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'

export default function HRStatutoryCompliancePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const complianceItems = [
    {
      id: '1',
      type: 'PF/ECR',
      description: 'Employee Contribution Report',
      dueDate: '2026-03-15',
      status: 'FILED',
      amount: 180000,
      lastFiled: '2026-02-15',
      autoFile: true,
    },
    {
      id: '2',
      type: 'ESI',
      description: 'Employee State Insurance',
      dueDate: '2026-03-21',
      status: 'PENDING',
      amount: 45000,
      lastFiled: '2026-02-21',
      autoFile: true,
    },
    {
      id: '3',
      type: 'TDS/24Q',
      description: 'Tax Deducted at Source - Quarterly',
      dueDate: '2026-04-30',
      status: 'FILED',
      amount: 180000,
      lastFiled: '2026-01-31',
      autoFile: true,
    },
    {
      id: '4',
      type: 'PT',
      description: 'Professional Tax - Karnataka',
      dueDate: '2026-03-05',
      status: 'FILED',
      amount: 12000,
      lastFiled: '2026-02-05',
      autoFile: true,
    },
  ]

  const complianceScore = 98
  const pendingCount = complianceItems.filter(c => c.status === 'PENDING').length
  const filedCount = complianceItems.filter(c => c.status === 'FILED').length

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Statutory Compliance"
        moduleIcon={<Shield className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="PF/ECR, ESI, TDS/24Q, PT Auto-File & Pay"
      />

      <div className="p-6 space-y-6">
        {/* Compliance Score */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Compliance Score</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">{complianceScore}%</p>
                <p className="text-sm text-muted-foreground mt-2">All filings up to date</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Filed</p>
                <p className="text-2xl font-bold">{filedCount}/{complianceItems.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Pending: {pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">PF/ECR</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(180000)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Filed</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ESI</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(45000)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Pending</p>
                </div>
                <Shield className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">TDS/24Q</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(180000)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Filed</p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">PT</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(12000)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Filed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto-File Banner */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Automated Compliance Filing</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  All statutory filings are automated. PF/ECR uploads, ESI returns, TDS/24Q filings, and Professional Tax across 28 states/8 UTs are processed automatically on due dates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Manual Upload
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button variant="outline">
            Configure Auto-File
          </Button>
        </div>

        {/* Compliance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
            <CardDescription>All statutory compliance filings</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Filed</TableHead>
                  <TableHead>Auto-File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complianceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.type}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{format(new Date(item.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{formatINRForDisplay(item.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'FILED' ? 'default' :
                          item.status === 'PENDING' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.lastFiled ? format(new Date(item.lastFiled), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {item.autoFile ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View</Button>
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
