'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function PayrollReportsPage() {
  const [ecrMonth, setEcrMonth] = useState(new Date().getMonth() + 1)
  const [ecrYear, setEcrYear] = useState(new Date().getFullYear())
  const [form16EmployeeId, setForm16EmployeeId] = useState('')
  const [form16FY, setForm16FY] = useState('2024-25')

  const { data: ecrData, isLoading: ecrLoading, refetch: refetchECR } = useQuery({
    queryKey: ['ecr-report', ecrMonth, ecrYear],
    queryFn: async () => {
      const response = await fetch(`/api/hr/payroll/reports/ecr?month=${ecrMonth}&year=${ecrYear}`)
      if (!response.ok) throw new Error('Failed to fetch ECR report')
      return response.json()
    },
    enabled: false, // Only fetch on button click
  })

  const { data: form16Data, isLoading: form16Loading, refetch: refetchForm16 } = useQuery({
    queryKey: ['form16-report', form16EmployeeId, form16FY],
    queryFn: async () => {
      const response = await fetch(
        `/api/hr/payroll/reports/form-16?employeeId=${form16EmployeeId}&financialYear=${form16FY}`
      )
      if (!response.ok) throw new Error('Failed to fetch Form 16')
      return response.json()
    },
    enabled: false, // Only fetch on button click
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payroll Reports</h1>
        <p className="mt-2 text-gray-600">Generate statutory compliance reports</p>
      </div>

      {/* ECR Report */}
      <Card>
        <CardHeader>
          <CardTitle>ECR (Electronic Challan cum Return)</CardTitle>
          <CardDescription>Generate ECR file for EPFO submission</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={ecrMonth}
                  onChange={(e) => setEcrMonth(parseInt(e.target.value))}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <Input
                  type="number"
                  value={ecrYear}
                  onChange={(e) => setEcrYear(parseInt(e.target.value))}
                  min={2020}
                  max={2100}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => refetchECR()} disabled={ecrLoading}>
                  {ecrLoading ? 'Generating...' : 'Generate ECR'}
                </Button>
              </div>
            </div>

            {ecrData && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">ECR Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Employees</div>
                    <div className="text-lg font-bold">{ecrData.totalEmployees}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total EPF Contribution</div>
                    <div className="text-lg font-bold">
                      ₹{ecrData.totalEPFContribution.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total EPS Contribution</div>
                    <div className="text-lg font-bold">
                      ₹{ecrData.totalEPSContribution.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Remittance</div>
                    <div className="text-lg font-bold text-green-600">
                      ₹{ecrData.totalRemittance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form 16 Report */}
      <Card>
        <CardHeader>
          <CardTitle>Form 16</CardTitle>
          <CardDescription>Generate Form 16 for employee tax filing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <Input
                  type="text"
                  value={form16EmployeeId}
                  onChange={(e) => setForm16EmployeeId(e.target.value)}
                  placeholder="Enter employee ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
                <select
                  value={form16FY}
                  onChange={(e) => setForm16FY(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 px-3"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => refetchForm16()}
                  disabled={form16Loading || !form16EmployeeId}
                >
                  {form16Loading ? 'Generating...' : 'Generate Form 16'}
                </Button>
              </div>
            </div>

            {form16Data && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Form 16 Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Employee</div>
                    <div className="text-lg font-bold">{form16Data.employee.name}</div>
                    <div className="text-sm text-gray-500">PAN: {form16Data.employee.pan}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Financial Year</div>
                    <div className="text-lg font-bold">{form16Data.financialYear}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Gross Salary</div>
                    <div className="text-lg font-bold">
                      ₹{form16Data.salaryDetails.grossSalary.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Taxable Income</div>
                    <div className="text-lg font-bold">
                      ₹{form16Data.salaryDetails.taxableIncome.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Tax Deducted</div>
                    <div className="text-lg font-bold text-red-600">
                      ₹{form16Data.taxDetails.totalTaxDeducted.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
