'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/lib/api/client'
import { ModuleSwitcher } from '@/components/ModuleSwitcher'
import { useAuthStore } from '@/lib/stores/auth'
import { ArrowLeft } from 'lucide-react'
import { INDIAN_STATES } from '@/lib/utils/indian-states'

export default function NewWarehousePage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { user, tenant } = useAuthStore()
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    country: 'India',
    isActive: true,
  })

  const createWarehouse = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/inventory/warehouses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create warehouse')
      }
      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/inventory/${tenantId}/Warehouses`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createWarehouse.mutate({
      name: formData.name,
      code: formData.code || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      country: formData.country,
      isActive: formData.isActive,
    })
  }

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
              <Link href={`/inventory/${tenantId}/Warehouses`} className="text-purple-600 font-medium border-b-2 border-purple-600 pb-2">Warehouses</Link>
              <Link href={`/inventory/${tenantId}/StockMovements`} className="text-gray-600 hover:text-gray-900 transition-colors">Stock Movements</Link>
              <Link href={`/inventory/${tenantId}/Reports`} className="text-gray-600 hover:text-gray-900 transition-colors">Reports</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ModuleSwitcher currentModule="inventory" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/inventory/${tenantId}/Warehouses`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Warehouse</h1>
              <p className="text-sm text-gray-600 mt-1">Add a new warehouse location</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Details</CardTitle>
                <CardDescription>Enter the information for your warehouse</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Warehouse Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Main Warehouse"
                  />
                </div>

                <div>
                  <Label htmlFor="code">Warehouse Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., WH-001"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Mumbai"
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State</Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="India"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link href={`/inventory/${tenantId}/Warehouses`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700"
                disabled={createWarehouse.isPending}
              >
                {createWarehouse.isPending ? 'Creating...' : 'Create Warehouse'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

