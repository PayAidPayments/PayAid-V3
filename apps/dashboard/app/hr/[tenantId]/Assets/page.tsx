'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Plus, TrendingDown, CheckCircle, AlertCircle, IndianRupee, Search } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function HRAssetsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  // Mock data
  const assets = [
    {
      id: '1',
      name: 'MacBook Pro 16"',
      category: 'Laptop',
      assignedTo: 'Rajesh Kumar',
      purchaseDate: '2025-01-15',
      purchaseValue: 250000,
      currentValue: 200000,
      depreciation: 20,
      status: 'ASSIGNED',
      location: 'Bangalore Office',
    },
    {
      id: '2',
      name: 'Dell Monitor 27"',
      category: 'Monitor',
      assignedTo: 'Priya Sharma',
      purchaseDate: '2025-02-10',
      purchaseValue: 25000,
      currentValue: 20000,
      depreciation: 20,
      status: 'ASSIGNED',
      location: 'Mumbai Office',
    },
    {
      id: '3',
      name: 'Office Chair',
      category: 'Furniture',
      assignedTo: null,
      purchaseDate: '2024-12-01',
      purchaseValue: 15000,
      currentValue: 12000,
      depreciation: 20,
      status: 'AVAILABLE',
      location: 'Bangalore Office',
    },
  ]

  const totalAssets = assets.length
  const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0)
  const assignedAssets = assets.filter(a => a.status === 'ASSIGNED').length

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Assets"
        moduleIcon={<Package className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Asset Tracking & Depreciation"
      />

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">{totalAssets}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatINRForDisplay(totalValue)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p className="text-2xl font-bold">{assignedAssets}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">{totalAssets - assignedAssets}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Depreciation Schedule Info */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingDown className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Depreciation Tracking</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Assets are automatically depreciated based on their category and useful life. Depreciation schedules are updated monthly and can be exported for accounting purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href={`/hr/${tenantId}/Assets/new`}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </Link>
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button variant="outline">
            Export Depreciation Schedule
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Assets</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Assets</CardTitle>
                <CardDescription>Complete asset inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Purchase Value</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Depreciation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>{asset.assignedTo || '-'}</TableCell>
                        <TableCell>{formatINRForDisplay(asset.purchaseValue)}</TableCell>
                        <TableCell>{formatINRForDisplay(asset.currentValue)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.depreciation}%</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              asset.status === 'ASSIGNED' ? 'default' :
                              asset.status === 'AVAILABLE' ? 'secondary' :
                              'outline'
                            }
                          >
                            {asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/hr/${tenantId}/Assets/${asset.id}`}>
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

          <TabsContent value="assigned" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Assets</CardTitle>
                <CardDescription>Assets currently assigned to employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>{assignedAssets} assets assigned</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Assets</CardTitle>
                <CardDescription>Assets available for assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>{totalAssets - assignedAssets} assets available</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="depreciation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Depreciation Schedule</CardTitle>
                <CardDescription>Monthly depreciation tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <TrendingDown className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Depreciation schedule view</p>
                  <p className="text-sm mt-2">Shows monthly depreciation for all assets</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
