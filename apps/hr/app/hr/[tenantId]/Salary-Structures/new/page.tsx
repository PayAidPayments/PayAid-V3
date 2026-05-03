'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Calculator, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function HRSalaryStructureNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    ctc: '',
    basicPercentage: '50',
    hraPercentage: '25',
    allowances: '',
    pfApplicable: true,
    esiApplicable: false,
    ptApplicable: true,
    effectiveDate: '',
  })

  // Calculate derived values
  const ctc = parseFloat(formData.ctc) || 0
  const basic = ctc * (parseFloat(formData.basicPercentage) / 100)
  const hra = ctc * (parseFloat(formData.hraPercentage) / 100)
  const allowances = parseFloat(formData.allowances) || 0
  const pf = formData.pfApplicable ? Math.min(basic * 0.12, 1800 * 12) : 0
  const esi = formData.esiApplicable ? ctc * 0.0075 : 0
  const pt = formData.ptApplicable ? 200 : 0
  const gross = basic + hra + allowances
  const deductions = pf + esi + pt
  const netSalary = gross - deductions

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

  const createSalaryStructure = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/salary-structures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create salary structure')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Salary-Structures`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createSalaryStructure.mutate({
      ...formData,
      ctc: parseFloat(formData.ctc),
      basic,
      hra,
      allowances: parseFloat(formData.allowances) || 0,
      pf,
      esi,
      pt,
      gross,
      deductions,
      netSalary,
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Create Salary Structure"
        moduleIcon={<Calculator className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Define salary structure with CTC breakdown"
      />

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Salary Structure Details</CardTitle>
              <CardDescription>Configure salary components and statutory deductions</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Structure Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., Software Engineer - L3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="departmentId">Department *</Label>
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
                      <Label htmlFor="ctc">Annual CTC (₹) *</Label>
                      <Input
                        id="ctc"
                        type="number"
                        value={formData.ctc}
                        onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                        required
                        placeholder="1200000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="effectiveDate">Effective Date *</Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        value={formData.effectiveDate}
                        onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Salary Components */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Salary Components</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="basicPercentage">Basic Salary (%) *</Label>
                      <Input
                        id="basicPercentage"
                        type="number"
                        value={formData.basicPercentage}
                        onChange={(e) => setFormData({ ...formData, basicPercentage: e.target.value })}
                        required
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Amount: {formatINRForDisplay(basic)}/year
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="hraPercentage">HRA (%) *</Label>
                      <Input
                        id="hraPercentage"
                        type="number"
                        value={formData.hraPercentage}
                        onChange={(e) => setFormData({ ...formData, hraPercentage: e.target.value })}
                        required
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Amount: {formatINRForDisplay(hra)}/year
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="allowances">Other Allowances (₹/year)</Label>
                      <Input
                        id="allowances"
                        type="number"
                        value={formData.allowances}
                        onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                        placeholder="200000"
                      />
                    </div>
                  </div>
                </div>

                {/* Statutory Deductions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Statutory Deductions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="pfApplicable" className="font-medium">PF Applicable</Label>
                        <input
                          type="checkbox"
                          id="pfApplicable"
                          checked={formData.pfApplicable}
                          onChange={(e) => setFormData({ ...formData, pfApplicable: e.target.checked })}
                          className="rounded"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Provident Fund</p>
                      {formData.pfApplicable && (
                        <p className="text-xs font-medium mt-2">{formatINRForDisplay(pf)}/year</p>
                      )}
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="esiApplicable" className="font-medium">ESI Applicable</Label>
                        <input
                          type="checkbox"
                          id="esiApplicable"
                          checked={formData.esiApplicable}
                          onChange={(e) => setFormData({ ...formData, esiApplicable: e.target.checked })}
                          className="rounded"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Employee State Insurance</p>
                      {formData.esiApplicable && (
                        <p className="text-xs font-medium mt-2">{formatINRForDisplay(esi)}/year</p>
                      )}
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="ptApplicable" className="font-medium">PT Applicable</Label>
                        <input
                          type="checkbox"
                          id="ptApplicable"
                          checked={formData.ptApplicable}
                          onChange={(e) => setFormData({ ...formData, ptApplicable: e.target.checked })}
                          className="rounded"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">Professional Tax</p>
                      {formData.ptApplicable && (
                        <p className="text-xs font-medium mt-2">{formatINRForDisplay(pt)}/year</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">CTC Breakdown Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Salary</span>
                      <span className="font-semibold">{formatINRForDisplay(gross)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deductions</span>
                      <span className="font-semibold text-red-600">-{formatINRForDisplay(deductions)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Net Salary</span>
                      <span className="font-bold text-lg">{formatINRForDisplay(netSalary)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Annual CTC</span>
                      <span className="font-semibold">{formatINRForDisplay(ctc)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSalaryStructure.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {createSalaryStructure.isPending ? 'Creating...' : 'Create Salary Structure'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
