'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { LogOut, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

export default function HROffboardingNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    employeeId: '',
    exitType: 'RESIGNATION',
    lastWorkingDay: '',
    noticePeriod: '30',
    reason: '',
    notes: '',
  })

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees-for-offboarding'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ employees: [] }))
    },
  })

  const createOffboarding = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/offboarding/instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to initiate offboarding')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Offboarding`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createOffboarding.mutate({
      ...formData,
      lastWorkingDay: new Date(formData.lastWorkingDay),
      noticePeriod: parseInt(formData.noticePeriod),
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Initiate Offboarding"
        moduleIcon={<LogOut className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Start employee exit process"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Offboarding Details</CardTitle>
            <CardDescription>Initiate the employee exit process</CardDescription>
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
                  <Label htmlFor="exitType">Exit Type *</Label>
                  <CustomSelect
                    value={formData.exitType}
                    onValueChange={(value) => setFormData({ ...formData, exitType: value })}
                    placeholder="Select exit type"
                  >
                    <CustomSelectTrigger />
                    <CustomSelectContent>
                      <CustomSelectItem value="RESIGNATION">Resignation</CustomSelectItem>
                      <CustomSelectItem value="TERMINATION">Termination</CustomSelectItem>
                      <CustomSelectItem value="RETIREMENT">Retirement</CustomSelectItem>
                      <CustomSelectItem value="END_OF_CONTRACT">End of Contract</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                <div>
                  <Label htmlFor="lastWorkingDay">Last Working Day *</Label>
                  <Input
                    id="lastWorkingDay"
                    type="date"
                    value={formData.lastWorkingDay}
                    onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="noticePeriod">Notice Period (Days)</Label>
                  <Input
                    id="noticePeriod"
                    type="number"
                    value={formData.noticePeriod}
                    onChange={(e) => setFormData({ ...formData, noticePeriod: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason *</Label>
                  <textarea
                    id="reason"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    placeholder="Enter exit reason..."
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
                <Button type="submit" disabled={createOffboarding.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createOffboarding.isPending ? 'Initiating...' : 'Initiate Offboarding'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
