'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, Plus, IndianRupee, TrendingUp, Users, Edit } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HRSalaryStructuresPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const salaryStructures = [
    {
      id: '1',
      name: 'Software Engineer - L3',
      department: 'Engineering',
      ctc: 1200000,
      basic: 600000,
      hra: 300000,
      allowances: 200000,
      pf: 72000,
      esi: 0,
      pt: 200,
      employees: 12,
      effectiveDate: '2025-01-01',
      status: 'ACTIVE',
    },
    {
      id: '2',
      name: 'Sales Manager',
      department: 'Sales',
      ctc: 1500000,
      basic: 750000,
      hra: 375000,
      allowances: 250000,
      pf: 90000,
      esi: 0,
      pt: 200,
      employees: 8,
      effectiveDate: '2025-01-01',
      status: 'ACTIVE',
    },
    {
      id: '3',
      name: 'HR Executive',
      department: 'HR',
      ctc: 800000,
      basic: 400000,
      hra: 200000,
      allowances: 150000,
      pf: 48000,
      esi: 0,
      pt: 200,
      employees: 5,
      effectiveDate: '2025-02-01',
      status: 'ACTIVE',
    },
  ]

  const totalEmployees = salaryStructures.reduce((sum, s) => sum + s.employees, 0)
  const avgCTC = salaryStructures.reduce((sum, s) => sum + s.ctc, 0) / salaryStructures.length

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Salary Structures"
        moduleIcon={<Calculator className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="CTC Calculator & Salary Revisions"
      />

      <div className="p-6 space-y-6">
        {/* CTC Calculator Banner */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calculator className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">CTC Calculator</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Calculate CTC breakdown with statutory deductions</p>
                </div>
              </div>
              <Link href={`/hr/${tenantId}/Salary-Structures/calculator`}>
                <Button variant="outline">
                  Open Calculator
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Structures</p>
                  <p className="text-2xl font-bold">{salaryStructures.length}</p>
                </div>
                <Calculator className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-2xl font-bold">{totalEmployees}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg CTC</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(avgCTC)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{salaryStructures.filter(s => s.status === 'ACTIVE').length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Salary-Structures/new`}>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Salary Structure
            </Button>
          </Link>
          <Button variant="outline">
            Bulk Assignment
          </Button>
          <Button variant="outline">
            Export Structures
          </Button>
        </div>

        {/* Salary Structures Table */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Structures</CardTitle>
            <CardDescription>All salary structures with CTC breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Structure Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>CTC</TableHead>
                  <TableHead>Basic</TableHead>
                  <TableHead>HRA</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>PF</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaryStructures.map((structure) => (
                  <TableRow key={structure.id}>
                    <TableCell className="font-medium">{structure.name}</TableCell>
                    <TableCell>{structure.department}</TableCell>
                    <TableCell className="font-semibold">{formatINRForDisplay(structure.ctc)}</TableCell>
                    <TableCell>{formatINRForDisplay(structure.basic)}</TableCell>
                    <TableCell>{formatINRForDisplay(structure.hra)}</TableCell>
                    <TableCell>{formatINRForDisplay(structure.allowances)}</TableCell>
                    <TableCell>{formatINRForDisplay(structure.pf)}</TableCell>
                    <TableCell>{structure.employees}</TableCell>
                    <TableCell>
                      <Badge variant={structure.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {structure.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/hr/${tenantId}/Salary-Structures/${structure.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CTC Breakdown Example */}
        <Card>
          <CardHeader>
            <CardTitle>CTC Breakdown Example</CardTitle>
            <CardDescription>How salary components are calculated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Basic Salary</span>
                <span className="text-sm">50% of CTC</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">HRA</span>
                <span className="text-sm">25% of CTC (or 50% of Basic)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Allowances</span>
                <span className="text-sm">Remaining amount</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">PF (Employee)</span>
                <span className="text-sm">12% of Basic (capped at ₹15,000)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">ESI</span>
                <span className="text-sm">0.75% of Gross (if applicable)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Professional Tax</span>
                <span className="text-sm">State-wise slab</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
