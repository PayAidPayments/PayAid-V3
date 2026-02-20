'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { Switch } from '@/components/ui/switch'
import { Users, Save } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { useAuthStore } from '@/lib/stores/auth'
import { PageLoading } from '@/components/ui/loading'

export default function HREmployeeEditPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const employeeId = params?.id as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    officialEmail: '',
    personalEmail: '',
    mobileCountryCode: '+91',
    mobileNumber: '',
    joiningDate: '',
    departmentId: '',
    designationId: '',
    locationId: '',
    managerId: '',
    ctcAnnualInr: '',
    pfApplicable: true,
    esiApplicable: false,
    ptApplicable: true,
    tdsApplicable: true,
  })

  // Fetch employee data
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/employees/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch employee')
      return res.json()
    },
  })

  // Fetch departments, designations, locations, managers
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/hr/departments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ departments: [] }))
    },
  })

  const { data: designations } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await fetch('/api/hr/designations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ designations: [] }))
    },
  })

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/hr/locations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ locations: [] }))
    },
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-for-manager'],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json().catch(() => ({ employees: [] }))
    },
  })

  // Populate form when employee data loads
  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        officialEmail: employee.officialEmail || '',
        personalEmail: employee.personalEmail || '',
        mobileCountryCode: employee.mobileCountryCode || '+91',
        mobileNumber: employee.mobileNumber || '',
        joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
        departmentId: employee.departmentId || '',
        designationId: employee.designationId || '',
        locationId: employee.locationId || '',
        managerId: employee.managerId || '',
        ctcAnnualInr: employee.ctcAnnualInr?.toString() || '',
        pfApplicable: employee.pfApplicable ?? true,
        esiApplicable: employee.esiApplicable ?? false,
        ptApplicable: employee.ptApplicable ?? true,
        tdsApplicable: employee.tdsApplicable ?? true,
      })
    }
  }, [employee])

  const updateEmployee = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/hr/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || 'Failed to update employee')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/hr/${tenantId}/Employees/${employeeId}`)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateEmployee.mutate({
      ...formData,
      ctcAnnualInr: formData.ctcAnnualInr ? parseFloat(formData.ctcAnnualInr) : undefined,
    })
  }

  if (isLoading) {
    return <PageLoading message="Loading employee data..." fullScreen={false} />
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName={`Edit ${employee?.firstName || ''} ${employee?.lastName || ''}`}
        moduleIcon={<Users className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description={`Employee Code: ${employee?.employeeCode || ''}`}
      />

      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Employee Information</CardTitle>
            <CardDescription>Update employee details</CardDescription>
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
                    <Label htmlFor="officialEmail">Official Email *</Label>
                    <Input
                      id="officialEmail"
                      type="email"
                      value={formData.officialEmail}
                      onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="personalEmail">Personal Email</Label>
                    <Input
                      id="personalEmail"
                      type="email"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <div className="flex gap-2">
                      <CustomSelect
                        value={formData.mobileCountryCode}
                        onValueChange={(value) => setFormData({ ...formData, mobileCountryCode: value })}
                        className="w-32"
                      >
                        <CustomSelectTrigger />
                        <CustomSelectContent>
                          <CustomSelectItem value="+91">+91 (IN)</CustomSelectItem>
                          <CustomSelectItem value="+1">+1 (US)</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                      <Input
                        id="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        required
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Employment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="joiningDate">Joining Date *</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      required
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
                    <Label htmlFor="designationId">Designation *</Label>
                    <CustomSelect
                      value={formData.designationId}
                      onValueChange={(value) => setFormData({ ...formData, designationId: value })}
                      placeholder="Select designation"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        {(designations?.designations || []).map((desg: any) => (
                          <CustomSelectItem key={desg.id} value={desg.id}>
                            {desg.name}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="locationId">Location</Label>
                    <CustomSelect
                      value={formData.locationId}
                      onValueChange={(value) => setFormData({ ...formData, locationId: value })}
                      placeholder="Select location"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        {(locations?.locations || []).map((loc: any) => (
                          <CustomSelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="managerId">Manager</Label>
                    <CustomSelect
                      value={formData.managerId}
                      onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                      placeholder="Select manager"
                    >
                      <CustomSelectTrigger />
                      <CustomSelectContent>
                        {(employees?.employees || []).filter((emp: any) => emp.id !== employeeId).map((emp: any) => (
                          <CustomSelectItem key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName} ({emp.employeeCode})
                          </CustomSelectItem>
                        ))}
                      </CustomSelectContent>
                    </CustomSelect>
                  </div>
                  <div>
                    <Label htmlFor="ctcAnnualInr">Annual CTC (₹)</Label>
                    <Input
                      id="ctcAnnualInr"
                      type="number"
                      value={formData.ctcAnnualInr}
                      onChange={(e) => setFormData({ ...formData, ctcAnnualInr: e.target.value })}
                      placeholder="1200000"
                    />
                  </div>
                </div>
              </div>

              {/* Statutory Flags */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Statutory Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="pfApplicable" className="font-medium">PF Applicable</Label>
                      <p className="text-sm text-muted-foreground">Provident Fund</p>
                    </div>
                    <Switch
                      id="pfApplicable"
                      checked={formData.pfApplicable}
                      onCheckedChange={(checked) => setFormData({ ...formData, pfApplicable: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="esiApplicable" className="font-medium">ESI Applicable</Label>
                      <p className="text-sm text-muted-foreground">Employee State Insurance</p>
                    </div>
                    <Switch
                      id="esiApplicable"
                      checked={formData.esiApplicable}
                      onCheckedChange={(checked) => setFormData({ ...formData, esiApplicable: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="ptApplicable" className="font-medium">PT Applicable</Label>
                      <p className="text-sm text-muted-foreground">Professional Tax</p>
                    </div>
                    <Switch
                      id="ptApplicable"
                      checked={formData.ptApplicable}
                      onCheckedChange={(checked) => setFormData({ ...formData, ptApplicable: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="tdsApplicable" className="font-medium">TDS Applicable</Label>
                      <p className="text-sm text-muted-foreground">Tax Deducted at Source</p>
                    </div>
                    <Switch
                      id="tdsApplicable"
                      checked={formData.tdsApplicable}
                      onCheckedChange={(checked) => setFormData({ ...formData, tdsApplicable: checked })}
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
                <Button type="submit" disabled={updateEmployee.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateEmployee.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
