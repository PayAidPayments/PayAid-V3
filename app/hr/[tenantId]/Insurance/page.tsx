'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Plus, Users, IndianRupee, Shield, TrendingUp, CheckCircle } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HRInsurancePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const insurancePlans = [
    {
      id: '1',
      name: 'Group Health Insurance',
      type: 'HEALTH',
      provider: 'ICICI Lombard',
      coverage: 500000,
      premium: 12000,
      employees: 47,
      status: 'ACTIVE',
      renewalDate: '2026-12-31',
    },
    {
      id: '2',
      name: 'Term Life Insurance',
      type: 'LIFE',
      provider: 'HDFC Life',
      coverage: 1000000,
      premium: 8000,
      employees: 47,
      status: 'ACTIVE',
      renewalDate: '2026-12-31',
    },
  ]

  const benefits = [
    {
      id: '1',
      name: 'NPS Contribution',
      type: 'RETIREMENT',
      contribution: 10000,
      employees: 35,
      status: 'ACTIVE',
    },
    {
      id: '2',
      name: 'Flexible Benefits',
      type: 'FLEXIBLE',
      contribution: 0,
      employees: 47,
      status: 'ACTIVE',
    },
  ]

  const totalCoverage = insurancePlans.reduce((sum, p) => sum + p.coverage, 0)
  const totalPremium = insurancePlans.reduce((sum, p) => sum + p.premium, 0)

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Insurance & Benefits"
        moduleIcon={<Heart className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Group Health, NPS & Flexible Benefits"
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Coverage</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(totalCoverage)}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Premium</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(totalPremium)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Plans</p>
                  <p className="text-2xl font-bold">{insurancePlans.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Employees Covered</p>
                  <p className="text-2xl font-bold">47</p>
                </div>
                <Users className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Insurance/new`}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </Link>
          <Button variant="outline">
            Configure Benefits
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="insurance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="claims">Claims</TabsTrigger>
          </TabsList>

          <TabsContent value="insurance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Plans</CardTitle>
                <CardDescription>Group health and life insurance coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Coverage</TableHead>
                      <TableHead>Premium</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insurancePlans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{plan.type}</Badge>
                        </TableCell>
                        <TableCell>{plan.provider}</TableCell>
                        <TableCell>{formatINRForDisplay(plan.coverage)}</TableCell>
                        <TableCell>{formatINRForDisplay(plan.premium)}</TableCell>
                        <TableCell>{plan.employees}</TableCell>
                        <TableCell>
                          <Badge variant={plan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {plan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Insurance/${plan.id}`}>
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

          <TabsContent value="benefits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employee Benefits</CardTitle>
                <CardDescription>NPS, Flexible Benefits, and other perks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benefits.map((benefit) => (
                    <Card key={benefit.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{benefit.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Type: {benefit.type} • {benefit.employees} employees enrolled
                            </p>
                            {benefit.contribution > 0 && (
                              <p className="text-sm font-medium">
                                Monthly Contribution: {formatINRForDisplay(benefit.contribution)}
                              </p>
                            )}
                          </div>
                          <Badge variant={benefit.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {benefit.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Claims</CardTitle>
                <CardDescription>Track and manage insurance claims</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>No claims submitted</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
