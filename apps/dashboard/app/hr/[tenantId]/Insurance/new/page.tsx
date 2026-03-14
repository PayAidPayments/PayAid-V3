'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Shield, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function HRInsuranceNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    planName: '',
    planType: 'HEALTH',
    provider: '',
    coverageAmount: '',
    premiumAmount: '',
    startDate: '',
    endDate: '',
    description: '',
  })

  const createPlan = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/insurance/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create insurance plan')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/hr/${tenantId}/Insurance`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPlan.mutate({
      ...formData,
      coverageAmount: parseFloat(formData.coverageAmount),
      premiumAmount: parseFloat(formData.premiumAmount),
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : null,
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Add Insurance Plan"
        moduleIcon={<Shield className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Create a new insurance plan"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Insurance Plan Details</CardTitle>
            <CardDescription>Configure insurance plan information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planName">Plan Name *</Label>
                    <Input
                      id="planName"
                      value={formData.planName}
                      onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                      required
                      placeholder="e.g., Group Health Insurance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="planType">Plan Type *</Label>
                    <CustomSelect
                      value={formData.planType}
                      onValueChange={(value) => setFormData({ ...formData, planType: value })}
                      placeholder="Select plan type"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        <CustomSelectItem value="HEALTH">Health Insurance</CustomSelectItem>
                        <CustomSelectItem value="LIFE">Life Insurance</CustomSelectItem>
                        <CustomSelectItem value="ACCIDENTAL">Accidental Insurance</CustomSelectItem>
                        <CustomSelectItem value="TERM">Term Insurance</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="provider">Insurance Provider *</Label>
                    <Input
                      id="provider"
                      value={formData.provider}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      required
                      placeholder="e.g., HDFC Life, ICICI Lombard"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coverageAmount">Coverage Amount (₹) *</Label>
                    <Input
                      id="coverageAmount"
                      type="number"
                      value={formData.coverageAmount}
                      onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })}
                      required
                      placeholder="500000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="premiumAmount">Premium Amount (₹) *</Label>
                    <Input
                      id="premiumAmount"
                      type="number"
                      value={formData.premiumAmount}
                      onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
                      required
                      placeholder="50000"
                    />
                  </div>
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
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add plan details and coverage information..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createPlan.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createPlan.isPending ? 'Creating...' : 'Create Plan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
