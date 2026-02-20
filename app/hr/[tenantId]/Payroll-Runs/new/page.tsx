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
import { Calendar, Save, Users, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { format } from 'date-fns'

export default function HRPayrollRunNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    payrollMonth: format(new Date(), 'yyyy-MM'),
    payDate: '',
    type: 'REGULAR',
    departmentId: '',
    includeContractors: false,
    includeBonuses: false,
    includeArrears: false,
    notes: '',
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

  const [validationResult, setValidationResult] = useState<any>(null)
  const [showValidation, setShowValidation] = useState(false)

  const validatePayroll = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/payroll-runs/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Validation failed')
      return res.json()
    },
    onSuccess: (data) => {
      setValidationResult(data)
      setShowValidation(true)
    },
  })

  const createPayrollRun = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hr/payroll-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to create payroll run')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Payroll-Runs/${data.id}`)
    },
  })

  const handleValidate = () => {
    validatePayroll.mutate({
      ...formData,
      departmentId: formData.departmentId || undefined,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPayrollRun.mutate({
      ...formData,
      departmentId: formData.departmentId || undefined,
    })
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Create Payroll Run"
        moduleIcon={<Calendar className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Process payroll for employees"
      />

      <div className="p-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Payroll Run Details</CardTitle>
            <CardDescription>Configure payroll processing parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payrollMonth">Payroll Month *</Label>
                    <Input
                      id="payrollMonth"
                      type="month"
                      value={formData.payrollMonth}
                      onChange={(e) => setFormData({ ...formData, payrollMonth: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payDate">Pay Date *</Label>
                    <Input
                      id="payDate"
                      type="date"
                      value={formData.payDate}
                      onChange={(e) => setFormData({ ...formData, payDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Payroll Type *</Label>
                    <CustomSelect
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                      placeholder="Select type"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        <CustomSelectItem value="REGULAR">Regular Payroll</CustomSelectItem>
                        <CustomSelectItem value="OFF_CYCLE">Off-Cycle Payroll</CustomSelectItem>
                        <CustomSelectItem value="BONUS">Bonus Payroll</CustomSelectItem>
                        <CustomSelectItem value="ARREARS">Arrears</CustomSelectItem>
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="departmentId">Department (Optional)</Label>
                    <CustomSelect
                      value={formData.departmentId}
                      onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                      placeholder="All departments"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        <CustomSelectItem value="">All Departments</CustomSelectItem>
                        {(departments?.departments || []).map((dept: any) => (
                          <CustomSelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Processing Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="includeContractors" className="font-medium">Include Contractors</Label>
                      <p className="text-sm text-muted-foreground">Process contractor payments</p>
                    </div>
                    <Switch
                      id="includeContractors"
                      checked={formData.includeContractors}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeContractors: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="includeBonuses" className="font-medium">Include Bonuses</Label>
                      <p className="text-sm text-muted-foreground">Process bonus payments</p>
                    </div>
                    <Switch
                      id="includeBonuses"
                      checked={formData.includeBonuses}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeBonuses: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="includeArrears" className="font-medium">Include Arrears</Label>
                      <p className="text-sm text-muted-foreground">Process pending arrears</p>
                    </div>
                    <Switch
                      id="includeArrears"
                      checked={formData.includeArrears}
                      onCheckedChange={(checked) => setFormData({ ...formData, includeArrears: checked })}
                    />
                  </div>
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
                  placeholder="Add any notes or remarks..."
                />
              </div>

              {/* Validation Results */}
              {showValidation && validationResult && (
                <Card className={validationResult.isValid ? 'border-green-500' : 'border-red-500'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      Validation Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {validationResult.errors.length > 0 && (
                      <div>
                        <p className="font-semibold text-red-600 mb-2">Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.errors.map((error: string, index: number) => (
                            <li key={index} className="text-red-600">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.warnings.length > 0 && (
                      <div>
                        <p className="font-semibold text-amber-600 mb-2">Warnings:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.warnings.map((warning: string, index: number) => (
                            <li key={index} className="text-amber-600">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.anomalies.length > 0 && (
                      <div>
                        <p className="font-semibold text-blue-600 mb-2">Anomalies Detected:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {validationResult.anomalies.map((anomaly: string, index: number) => (
                            <li key={index} className="text-blue-600">{anomaly}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-sm">
                        <strong>Total Employees:</strong> {validationResult.summary.totalEmployees} |{' '}
                        <strong>Total Contractors:</strong> {validationResult.summary.totalContractors} |{' '}
                        <strong>Estimated Amount:</strong> ₹{validationResult.summary.totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidate}
                  disabled={validatePayroll.isPending}
                >
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {validatePayroll.isPending ? 'Validating...' : 'Validate Before Creating'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPayrollRun.isPending || (showValidation && !validationResult.isValid)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {createPayrollRun.isPending ? 'Creating...' : 'Create Payroll Run'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
