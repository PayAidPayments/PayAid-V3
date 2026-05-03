'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Edit, TrendingDown, Calendar, MapPin, User, IndianRupee } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { PageLoading } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'

export default function HRAssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const assetId = params?.id as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/assets/${assetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch asset')
      return res.json()
    },
  })

  // Fetch assignment history
  const { data: assignmentData } = useQuery({
    queryKey: ['asset-assignments', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/assets/${assetId}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { assignments: [] }
      return res.json()
    },
    enabled: !!assetId,
  })

  // Fetch depreciation schedule
  const { data: depreciationData } = useQuery({
    queryKey: ['asset-depreciation', assetId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/assets/${assetId}/depreciation`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { schedule: [] }
      return res.json()
    },
    enabled: !!assetId,
  })

  const assignmentHistory = (assignmentData?.assignments || []).map((a: any) => ({
    id: a.id,
    employee: `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.trim() || 'Unknown',
    assignedDate: a.assignedDate,
    returnedDate: a.returnedDate,
    status: a.returnedDate ? 'RETURNED' : 'ASSIGNED',
  }))

  const depreciationSchedule = (depreciationData?.schedule || []).map((d: any) => ({
    year: new Date(d.period).getFullYear(),
    depreciation: d.depreciationAmount,
    currentValue: d.closingValue,
  }))

  if (isLoading) {
    return <PageLoading message="Loading asset details..." fullScreen={false} />
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Asset not found</p>
        <Link href={`/hr/${tenantId}/Assets`}>
          <Button>Back to Assets</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName={asset.name}
        moduleIcon={<Package className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description={`Category: ${asset.category}`}
      />

      <div className="p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Link href={`/hr/${tenantId}/Assets`}>
            <Button variant="outline">← Back to Assets</Button>
          </Link>
          <div className="flex gap-2">
            <Link href={`/hr/${tenantId}/Assets/${assetId}/Edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Asset
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
                  <p className="text-sm text-muted-foreground">Purchase Value</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(asset.purchaseValue || 0)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(asset.currentValue || 0)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-bold">
                    <Badge variant={asset.status === 'ASSIGNED' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Depreciation Rate</p>
                  <p className="text-2xl font-bold">{asset.depreciationRate || 20}%</p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="assignment">Assignment History</TabsTrigger>
            <TabsTrigger value="depreciation">Depreciation Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="font-medium">{asset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="font-medium">{asset.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Serial Number</span>
                    <span className="font-medium">{asset.serialNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Location</span>
                    <span className="font-medium">{asset.location || '-'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Purchase Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Purchase Date</span>
                    <span className="font-medium">
                      {asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMM dd, yyyy') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Purchase Value</span>
                    <span className="font-medium">{formatINRForDisplay(asset.purchaseValue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Depreciation Rate</span>
                    <span className="font-medium">{asset.depreciationRate || 20}% per year</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Value</span>
                    <span className="font-medium">{formatINRForDisplay(asset.currentValue || 0)}</span>
                  </div>
                </CardContent>
              </Card>

              {asset.assignedTo && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Current Assignment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {asset.assignedTo.employeeCode}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {asset.notes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{asset.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment History</CardTitle>
                <CardDescription>Track asset assignments over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Returned Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentHistory.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.employee}</TableCell>
                        <TableCell>{format(new Date(assignment.assignedDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {assignment.returnedDate ? format(new Date(assignment.returnedDate), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.status === 'ASSIGNED' ? 'default' : 'secondary'}>
                            {assignment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="depreciation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Depreciation Schedule</CardTitle>
                <CardDescription>Projected depreciation over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Depreciation</TableHead>
                      <TableHead>Current Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {depreciationSchedule.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No depreciation schedule available
                        </TableCell>
                      </TableRow>
                    ) : (
                      depreciationSchedule.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.year}</TableCell>
                          <TableCell>{formatINRForDisplay(item.depreciation)}</TableCell>
                          <TableCell className="font-semibold">{formatINRForDisplay(item.currentValue)}</TableCell>
                        </TableRow>
                      ))
                    )}
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
