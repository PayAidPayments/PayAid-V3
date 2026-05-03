'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Switch } from '@/components/ui/switch'
import { Briefcase, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

export default function HRContractorNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    startDate: '',
    endDate: '',
    monthlyRate: '',
    tdsApplicable: true,
    tdsRate: '10',
    panNumber: '',
    departmentId: '',
    project: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  })

  // Fetch departments
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/hr/departments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ departments: [] }))
    },
  })

  const createContractor = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/contractors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create contractor')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Contractors/${data.id}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createContractor.mutate({
      ...formData,
      monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
      tdsRate: formData.tdsApplicable && formData.tdsRate ? parseFloat(formData.tdsRate) : undefined,
      endDate: formData.endDate || undefined,
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Add Contractor"
        moduleIcon={<Briefcase className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Create a new contractor record"
      />

      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Contractor Information</CardTitle>
            <CardDescription>Fill in the details to add a new contractor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contract Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contract Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="departmentId">Department</Label>
                    <CustomSelect
                      value={formData.departmentId}
                      onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                      placeholder="Select department"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        {(departments?.departments || []).map((dept: any) => (
                          <CustomSelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Input
                      id="project"
                      value={formData.project}
                      onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="monthlyRate">Monthly Rate (₹) *</Label>
                    <Input
                      id="monthlyRate"
                      type="number"
                      value={formData.monthlyRate}
                      onChange={(e) => setFormData({ ...formData, monthlyRate: e.target.value })}
                      required
                      placeholder="75000"
                    />
                  </div>
                </div>
              </div>

              {/* TDS Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">TDS Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="tdsApplicable" className="font-medium">TDS Applicable</Label>
                      <p className="text-sm text-muted-foreground">Whether TDS should be deducted</p>
                    </div>
                    <Switch
                      id="tdsApplicable"
                      checked={formData.tdsApplicable}
                      onCheckedChange={(checked) => setFormData({ ...formData, tdsApplicable: checked })}
                    />
                  </div>
                  {formData.tdsApplicable && (
                    <>
                      <div>
                        <Label htmlFor="tdsRate">TDS Rate (%)</Label>
                        <Input
                          id="tdsRate"
                          type="number"
                          value={formData.tdsRate}
                          onChange={(e) => setFormData({ ...formData, tdsRate: e.target.value })}
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="panNumber">PAN Number *</Label>
                        <Input
                          id="panNumber"
                          value={formData.panNumber}
                          onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                          required={formData.tdsApplicable}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>
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
                <Button type="submit" disabled={createContractor.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createContractor.isPending ? 'Creating...' : 'Create Contractor'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
