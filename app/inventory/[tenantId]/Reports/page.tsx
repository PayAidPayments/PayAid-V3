'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { useAuthStore } from '@/lib/stores/auth'
import { BarChart3, AlertTriangle, TrendingUp } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

export default function InventoryReportsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [selectedReport, setSelectedReport] = useState<string>('overview')

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['inventory-reports', 'overview', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/reports?type=overview`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch overview')
      return response.json()
    },
  })

  const { data: stockValueData, isLoading: stockValueLoading } = useQuery({
    queryKey: ['inventory-reports', 'stock-value', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/reports?type=stock-value`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch stock value')
      return response.json()
    },
  })

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['inventory-reports', 'low-stock', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/reports?type=low-stock`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch low stock')
      return response.json()
    },
  })

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['inventory-reports', 'movements', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/reports?type=movements`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch movements')
      return response.json()
    },
  })

  const { data: utilizationData, isLoading: utilizationLoading } = useQuery({
    queryKey: ['inventory-reports', 'warehouse-utilization', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/reports?type=warehouse-utilization`, {
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to fetch utilization')
      return response.json()
    },
  })

  const CHART_COLORS = ['#22C55E', '#10B981', '#059669', '#047857', '#065F46']

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 relative" style={{ zIndex: 1 }}>
      {/* Top Navigation Bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
            <nav className="flex items-center gap-4 text-sm">
              <Link href={`/inventory/${tenantId}/Home/`} className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href={`/inventory/${tenantId}/Products`} className="text-gray-600 hover:text-gray-900 transition-colors">Products</Link>
              <Link href={`/inventory/${tenantId}/Warehouses`} className="text-gray-600 hover:text-gray-900 transition-colors">Warehouses</Link>
              <Link href={`/inventory/${tenantId}/StockMovements`} className="text-gray-600 hover:text-gray-900 transition-colors">Stock Movements</Link>
              <Link href={`/inventory/${tenantId}/Reports`} className="text-green-600 font-medium border-b-2 border-green-600 pb-2">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="inventory" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Reports</h1>
          <p className="mt-2 text-gray-600">Analyze inventory performance and metrics</p>
        </div>

        {/* Overview Stats */}
        {overviewData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewData.totalProducts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{overviewData.lowStockProducts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{overviewData.outOfStockProducts || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{overviewData.totalStockValue?.toLocaleString('en-IN') || '0'}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Value by Category</CardTitle>
              <CardDescription>Total inventory value by category</CardDescription>
            </CardHeader>
            <CardContent>
              {stockValueLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : stockValueData?.byCategory?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockValueData.byCategory}>
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                      <Legend />
                      <Bar dataKey="value" fill="#22C55E" name="Stock Value (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Low Stock Products</CardTitle>
              <CardDescription>Products below reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStockLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : lowStockData?.products?.length > 0 ? (
                <div className="h-64 overflow-y-auto space-y-2">
                  {lowStockData.products.slice(0, 10).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-600">{product.quantity} / {product.reorderLevel}</p>
                        {product.needsReorder && (
                          <AlertTriangle className="w-4 h-4 text-red-500 inline ml-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No low stock products</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Movements Over Time</CardTitle>
              <CardDescription>Movement trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : movementsData?.byMonth?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={movementsData.byMonth}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="in" stroke="#22C55E" name="Stock In" />
                      <Line type="monotone" dataKey="out" stroke="#EF4444" name="Stock Out" />
                      <Line type="monotone" dataKey="transfers" stroke="#3B82F6" name="Transfers" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No movement data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Warehouse Utilization</CardTitle>
              <CardDescription>Stock distribution across warehouses</CardDescription>
            </CardHeader>
            <CardContent>
              {utilizationLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : utilizationData?.utilization?.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={utilizationData.utilization}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ warehouseName, percent }) => `${warehouseName} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="stockValue"
                      >
                        {utilizationData.utilization.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `₹${value.toLocaleString('en-IN')}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No warehouse data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

