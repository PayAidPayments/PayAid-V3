'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { UserPlus, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

export default function HROnboardingNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    employeeId: '',
    templateId: '',
    startDate: '',
    notes: '',
  })

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees-for-onboarding'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ employees: [] }))
    },
  })

  // Fetch onboarding templates
  const { data: templatesData } = useQuery({
    queryKey: ['onboarding-templates'],
    queryFn: async () => {
      const res = await fetch('/api/hr/onboarding/templates?isActive=true', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ templates: [] }))
    },
  })

  const templates = templatesData?.templates || []

  const createOnboarding = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/onboarding/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to start onboarding')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Onboarding`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createOnboarding.mutate({
      ...formData,
      startDate: new Date(formData.startDate),
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Start Onboarding"
        moduleIcon={<UserPlus className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Initiate employee onboarding process"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Onboarding Details</CardTitle>
            <CardDescription>Select employee and onboarding template to begin</CardDescription>
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
                  <Label htmlFor="templateId">Onboarding Template *</Label>
                  <CustomSelect
                    value={formData.templateId}
                    onValueChange={(value) => setFormData({ ...formData, templateId: value })}
                    placeholder="Select template"
                  >
                    <CustomSelectTrigger />
                    <CustomSelectContent>
                      {templates.map((template) => (
                        <CustomSelectItem key={template.id} value={template.id}>
                          {template.name}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
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
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
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
                <Button type="submit" disabled={createOnboarding.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createOnboarding.isPending ? 'Starting...' : 'Start Onboarding'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
