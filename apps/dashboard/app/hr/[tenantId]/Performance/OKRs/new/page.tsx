'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Target, Save, Plus, X } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'

interface KeyResult {
  id: string
  description: string
  target: string
  unit: string
}

export default function HRPerformanceOKRNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    employeeId: '',
    objective: '',
    quarter: 'Q1',
    year: new Date().getFullYear().toString(),
    keyResults: [] as KeyResult[],
  })

  const [newKR, setNewKR] = useState({ description: '', target: '', unit: 'number' })

  // Fetch employees
  const { data: employees } = useQuery({
    queryKey: ['employees-for-okr'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ employees: [] }))
    },
  })

  const addKeyResult = () => {
    if (newKR.description && newKR.target) {
      setFormData({
        ...formData,
        keyResults: [...formData.keyResults, { ...newKR, id: Date.now().toString() }],
      })
      setNewKR({ description: '', target: '', unit: 'number' })
    }
  }

  const removeKeyResult = (id: string) => {
    setFormData({
      ...formData,
      keyResults: formData.keyResults.filter((kr) => kr.id !== id),
    })
  }

  const createOKR = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/performance/okrs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create OKR')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/hr/${tenantId}/Performance`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.keyResults.length === 0) {
      alert('Please add at least one key result')
      return
    }
    createOKR.mutate({
      ...formData,
      year: parseInt(formData.year),
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Create OKR"
        moduleIcon={<Target className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Set Objectives and Key Results"
      />

      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>OKR Details</CardTitle>
            <CardDescription>Define objective and measurable key results</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="quarter">Quarter *</Label>
                      <CustomSelect
                        value={formData.quarter}
                        onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                      >
                        <CustomSelectTrigger />
                        <CustomSelectContent>
                          <CustomSelectItem value="Q1">Q1</CustomSelectItem>
                          <CustomSelectItem value="Q2">Q2</CustomSelectItem>
                          <CustomSelectItem value="Q3">Q3</CustomSelectItem>
                          <CustomSelectItem value="Q4">Q4</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>
                    <div>
                      <Label htmlFor="year">Year *</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="objective">Objective *</Label>
                  <textarea
                    id="objective"
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.objective}
                    onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                    required
                    placeholder="Enter the objective..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Key Results</h3>
                  <span className="text-sm text-muted-foreground">
                    {formData.keyResults.length} added
                  </span>
                </div>
                {formData.keyResults.map((kr) => (
                  <Card key={kr.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{kr.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Target: {kr.target} {kr.unit}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyResult(kr.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                <Card className="p-4 border-dashed">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="krDescription">Key Result Description</Label>
                      <Input
                        id="krDescription"
                        value={newKR.description}
                        onChange={(e) => setNewKR({ ...newKR, description: e.target.value })}
                        placeholder="e.g., Increase customer satisfaction score"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="krTarget">Target Value</Label>
                        <Input
                          id="krTarget"
                          type="text"
                          value={newKR.target}
                          onChange={(e) => setNewKR({ ...newKR, target: e.target.value })}
                          placeholder="e.g., 90"
                        />
                      </div>
                      <div>
                        <Label htmlFor="krUnit">Unit</Label>
                        <CustomSelect
                          value={newKR.unit}
                          onValueChange={(value) => setNewKR({ ...newKR, unit: value })}
                        >
                          <CustomSelectTrigger />
                          <CustomSelectContent>
                            <CustomSelectItem value="number">Number</CustomSelectItem>
                            <CustomSelectItem value="percentage">Percentage</CustomSelectItem>
                            <CustomSelectItem value="currency">Currency (₹)</CustomSelectItem>
                            <CustomSelectItem value="days">Days</CustomSelectItem>
                          </CustomSelectContent>
                        </CustomSelect>
                      </div>
                    </div>
                    <Button type="button" onClick={addKeyResult} variant="outline" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Key Result
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createOKR.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createOKR.isPending ? 'Creating...' : 'Create OKR'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
