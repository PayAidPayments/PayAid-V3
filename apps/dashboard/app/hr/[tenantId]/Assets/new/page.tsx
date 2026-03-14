'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Package, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

export default function HRAssetNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    serialNumber: '',
    purchaseDate: '',
    purchaseValue: '',
    depreciationRate: '20',
    assignedToId: '',
    location: '',
    notes: '',
  })

  // Fetch employees for assignment
  const { data: employees } = useQuery({
    queryKey: ['employees-for-assignment'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ employees: [] }))
    },
  })

  const createAsset = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create asset')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Assets`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAsset.mutate({
      ...formData,
      purchaseValue: parseFloat(formData.purchaseValue),
      depreciationRate: parseFloat(formData.depreciationRate),
      assignedToId: formData.assignedToId || undefined,
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Add Asset"
        moduleIcon={<Package className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Register a new asset"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
            <CardDescription>Fill in the details to add a new asset</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Asset Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., MacBook Pro 16"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <CustomSelect
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      placeholder="Select category"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        <CustomSelectItem value="Laptop">Laptop</CustomSelectItem>
                        <CustomSelectItem value="Monitor">Monitor</CustomSelectItem>
                        <CustomSelectItem value="Mobile">Mobile</CustomSelectItem>
                        <CustomSelectItem value="Furniture">Furniture</CustomSelectItem>
                        <CustomSelectItem value="Vehicle">Vehicle</CustomSelectItem>
                        <CustomSelectItem value="Other">Other</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Bangalore Office"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Purchase Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchaseValue">Purchase Value (₹) *</Label>
                    <Input
                      id="purchaseValue"
                      type="number"
                      value={formData.purchaseValue}
                      onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                      required
                      placeholder="250000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="depreciationRate">Depreciation Rate (%)</Label>
                    <Input
                      id="depreciationRate"
                      type="number"
                      value={formData.depreciationRate}
                      onChange={(e) => setFormData({ ...formData, depreciationRate: e.target.value })}
                      placeholder="20"
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Annual depreciation rate</p>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Assignment</h3>
                <div>
                  <Label htmlFor="assignedToId">Assign To Employee (Optional)</Label>
                  <CustomSelect
                    value={formData.assignedToId}
                    onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                    placeholder="Leave unassigned"
                  >
                    <CustomSelectTrigger />
                    <CustomSelectContent>
                      <CustomSelectItem value="">Unassigned</CustomSelectItem>
                      {(employees?.employees || []).map((emp: any) => (
                        <CustomSelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAsset.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createAsset.isPending ? 'Creating...' : 'Create Asset'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
