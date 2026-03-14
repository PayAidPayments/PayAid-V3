'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { FileText, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

export default function HRPerformanceReviewNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    employeeId: '',
    reviewType: 'ANNUAL',
    period: '',
    reviewerId: '',
    startDate: '',
    endDate: '',
  })

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees-for-review'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ employees: [] }))
    },
  })

  const createReview = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/performance/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create review')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Performance`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createReview.mutate({
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Start Performance Review"
        moduleIcon={<FileText className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Initiate performance review process"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Review Details</CardTitle>
            <CardDescription>Set up a new performance review</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeId">Employee *</Label>
                  <CustomSelect
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                    placeholder="Select employee"
                  >
                    <CustomSelectTrigger />
                    <CustomSelectContent>
                      {(employees?.employees || []).map((emp: any) => (
                        <CustomSelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div>
                  <Label htmlFor="reviewType">Review Type *</Label>
                  <CustomSelect
                    value={formData.reviewType}
                    onValueChange={(value) => setFormData({ ...formData, reviewType: value })}
                    placeholder="Select review type"
                  >
                    <CustomSelectTrigger />
                    <CustomSelectContent>
                      <CustomSelectItem value="ANNUAL">Annual Review</CustomSelectItem>
                      <CustomSelectItem value="QUARTERLY">Quarterly Review</CustomSelectItem>
                      <CustomSelectItem value="MONTHLY">Monthly Review</CustomSelectItem>
                      <CustomSelectItem value="PROJECT">Project Review</CustomSelectItem>
                      <CustomSelectItem value="360">360 Review</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div>
                  <Label htmlFor="period">Review Period *</Label>
                  <Input
                    id="period"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    required
                    placeholder="e.g., Q1 2026, January 2026"
                  />
                </div>
                <div>
                  <Label htmlFor="reviewerId">Reviewer</Label>
                  <CustomSelect
                    value={formData.reviewerId}
                    onValueChange={(value) => setFormData({ ...formData, reviewerId: value })}
                    placeholder="Select reviewer"
                  >
                    <CustomSelectTrigger />
                    <CustomSelectContent>
                      {(employees?.employees || []).map((emp: any) => (
                        <CustomSelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeCode})
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
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
                <Button type="submit" disabled={createReview.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createReview.isPending ? 'Creating...' : 'Start Review'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
