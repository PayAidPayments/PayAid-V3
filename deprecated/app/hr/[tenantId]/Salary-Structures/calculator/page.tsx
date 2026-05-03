'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator, ArrowLeft } from 'lucide-react'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

export default function HRCTCCalculatorPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!

  const [inputs, setInputs] = useState({
    ctc: '',
    basicPercentage: '50',
    hraPercentage: '25',
    allowances: '',
    pfApplicable: true,
    esiApplicable: false,
    ptApplicable: true,
  })

  // Calculate derived values
  const ctc = parseFloat(inputs.ctc) || 0
  const basic = ctc * (parseFloat(inputs.basicPercentage) / 100)
  const hra = ctc * (parseFloat(inputs.hraPercentage) / 100)
  const allowances = parseFloat(inputs.allowances) || 0
  const pf = inputs.pfApplicable ? Math.min(basic * 0.12, 1800 * 12) : 0
  const esi = inputs.esiApplicable ? ctc * 0.0075 : 0
  const pt = inputs.ptApplicable ? 200 : 0
  const gross = basic + hra + allowances
  const deductions = pf + esi + pt
  const netSalary = gross - deductions

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="CTC Calculator"
        moduleIcon={<Calculator className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description="Calculate CTC breakdown with statutory deductions"
      />

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Link href={`/hr/${tenantId}/Salary-Structures`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Salary Structures
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Input Values</CardTitle>
                <CardDescription>Enter CTC and component percentages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ctc">Annual CTC (₹) *</Label>
                  <Input
                    id="ctc"
                    type="number"
                    value={inputs.ctc}
                    onChange={(e) => setInputs({ ...inputs, ctc: e.target.value })}
                    placeholder="1200000"
                    className="text-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="basicPercentage">Basic Salary (%)</Label>
                    <Input
                      id="basicPercentage"
                      type="number"
                      value={inputs.basicPercentage}
                      onChange={(e) => setInputs({ ...inputs, basicPercentage: e.target.value })}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hraPercentage">HRA (%)</Label>
                    <Input
                      id="hraPercentage"
                      type="number"
                      value={inputs.hraPercentage}
                      onChange={(e) => setInputs({ ...inputs, hraPercentage: e.target.value })}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="allowances">Other Allowances (₹/year)</Label>
                  <Input
                    id="allowances"
                    type="number"
                    value={inputs.allowances}
                    onChange={(e) => setInputs({ ...inputs, allowances: e.target.value })}
                    placeholder="200000"
                  />
                </div>
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pfApplicable" className="font-medium">PF Applicable</Label>
                    <input
                      type="checkbox"
                      id="pfApplicable"
                      checked={inputs.pfApplicable}
                      onChange={(e) => setInputs({ ...inputs, pfApplicable: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="esiApplicable" className="font-medium">ESI Applicable</Label>
                    <input
                      type="checkbox"
                      id="esiApplicable"
                      checked={inputs.esiApplicable}
                      onChange={(e) => setInputs({ ...inputs, esiApplicable: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ptApplicable" className="font-medium">PT Applicable</Label>
                    <input
                      type="checkbox"
                      id="ptApplicable"
                      checked={inputs.ptApplicable}
                      onChange={(e) => setInputs({ ...inputs, ptApplicable: e.target.checked })}
                      className="rounded"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>CTC Breakdown</CardTitle>
                <CardDescription>Calculated salary components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Basic Salary</span>
                      <span className="font-semibold">{formatINRForDisplay(basic)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {inputs.basicPercentage}% of CTC
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">HRA</span>
                      <span className="font-semibold">{formatINRForDisplay(hra)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {inputs.hraPercentage}% of CTC
                    </div>
                  </div>
                  {allowances > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Other Allowances</span>
                        <span className="font-semibold">{formatINRForDisplay(allowances)}</span>
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Gross Salary</span>
                      <span className="font-bold text-lg">{formatINRForDisplay(gross)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-2">Deductions</h4>
                  {inputs.pfApplicable && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PF (12% of Basic, max ₹21,600)</span>
                      <span className="font-medium text-red-600">-{formatINRForDisplay(pf)}</span>
                    </div>
                  )}
                  {inputs.esiApplicable && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ESI (0.75% of CTC)</span>
                      <span className="font-medium text-red-600">-{formatINRForDisplay(esi)}</span>
                    </div>
                  )}
                  {inputs.ptApplicable && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Professional Tax</span>
                      <span className="font-medium text-red-600">-{formatINRForDisplay(pt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Total Deductions</span>
                    <span className="font-semibold text-red-600">-{formatINRForDisplay(deductions)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Net Salary (Annual)</span>
                    <span className="font-bold text-2xl">{formatINRForDisplay(netSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">Monthly Net Salary</span>
                    <span className="font-semibold">{formatINRForDisplay(netSalary / 12)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Annual CTC</span>
                    <span className="font-semibold">{formatINRForDisplay(ctc)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
