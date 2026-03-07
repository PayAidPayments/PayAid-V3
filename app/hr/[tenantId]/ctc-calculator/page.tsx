'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatINR } from '@/lib/utils/formatINR'
import { ArrowLeft, Calculator } from 'lucide-react'

// Typical India CTC breakdown (percent of CTC). Can be made configurable later.
const DEFAULT_SPLIT = {
  basic: 0.4,
  hra: 0.2,
  specialAllowance: 0.25,
  otherAllowances: 0.15,
}

const PF_EMPLOYEE_PCT = 12
const PF_EMPLOYER_PCT = 12
const PF_WAGE_CEILING = 15000
const ESI_EMPLOYEE_PCT = 0.75
const ESI_EMPLOYER_PCT = 3.25
const ESI_WAGE_CEILING = 21000

function estimateMonthly(ctcAnnual: number) {
  const monthly = ctcAnnual / 12
  const basic = monthly * DEFAULT_SPLIT.basic
  const hra = monthly * DEFAULT_SPLIT.hra
  const specialAllowance = monthly * DEFAULT_SPLIT.specialAllowance
  const otherAllowances = monthly * DEFAULT_SPLIT.otherAllowances
  const gross = basic + hra + specialAllowance + otherAllowances

  const pfBase = Math.min(basic, PF_WAGE_CEILING)
  const pfEmployee = (pfBase * PF_EMPLOYEE_PCT) / 100
  const pfEmployer = (pfBase * PF_EMPLOYER_PCT) / 100
  const pfApplicable = basic <= PF_WAGE_CEILING * 1.5

  const esiBase = Math.min(gross, ESI_WAGE_CEILING)
  const esiEmployee = (esiBase * ESI_EMPLOYEE_PCT) / 100
  const esiEmployer = (esiBase * ESI_EMPLOYER_PCT) / 100
  const esiApplicable = gross <= ESI_WAGE_CEILING

  const pt = gross <= 15000 ? 0 : gross <= 25000 ? 200 : 300
  const annualGross = gross * 12
  const standardDeduction = 75000
  const taxableApprox = Math.max(0, annualGross - standardDeduction - (pfEmployee * 12))
  const taxApprox = taxableApprox <= 700000 ? 0 : (taxableApprox - 700000) * 0.2 * 0.12
  const tdsMonthly = taxApprox / 12

  const totalDeductions = pfEmployee + esiEmployee + pt + tdsMonthly
  const takeHome = gross - totalDeductions

  return {
    monthly,
    basic,
    hra,
    specialAllowance,
    otherAllowances,
    gross,
    pfEmployee,
    pfEmployer,
    pfApplicable,
    esiEmployee,
    esiEmployer,
    esiApplicable,
    pt,
    tdsMonthly,
    totalDeductions,
    takeHome,
    employerCost: gross + pfEmployer + esiEmployer,
  }
}

export default function CTCCalculatorPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [ctcInput, setCtcInput] = useState('')
  const ctc = parseFloat(ctcInput) || 0
  const result = ctc > 0 ? estimateMonthly(ctc) : null

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/hr/${tenantId}/Payroll`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            CTC Calculator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Input annual CTC → breakdown Basic / HRA / Allowances, tax impact, take-home, PF/ESI eligibility
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Annual CTC (₹)</CardTitle>
          <CardDescription>Enter gross annual cost to company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Annual CTC</Label>
            <Input
              type="number"
              min={0}
              step={10000}
              value={ctcInput}
              onChange={(e) => setCtcInput(e.target.value)}
              placeholder="e.g. 600000"
              className="mt-1 max-w-xs"
            />
          </div>

          {result && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4">
              <p className="text-xs font-medium uppercase text-slate-500">Earnings (monthly)</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>Basic (40%)</span>
                  <span>{formatINR(result.basic)}</span>
                </li>
                <li className="flex justify-between">
                  <span>HRA (20%)</span>
                  <span>{formatINR(result.hra)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Special allowance</span>
                  <span>{formatINR(result.specialAllowance)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Other allowances</span>
                  <span>{formatINR(result.otherAllowances)}</span>
                </li>
                <li className="flex justify-between font-semibold pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Gross</span>
                  <span>{formatINR(result.gross)}</span>
                </li>
              </ul>

              <p className="text-xs font-medium uppercase text-slate-500 pt-2">Deductions (monthly)</p>
              <ul className="space-y-1 text-sm">
                <li className="flex justify-between">
                  <span>PF (employee) {result.pfApplicable ? '' : '(not applicable)'}</span>
                  <span>{formatINR(result.pfEmployee)}</span>
                </li>
                <li className="flex justify-between">
                  <span>ESI (employee) {result.esiApplicable ? '' : '(not applicable)'}</span>
                  <span>{formatINR(result.esiEmployee)}</span>
                </li>
                <li className="flex justify-between">
                  <span>PT</span>
                  <span>{formatINR(result.pt)}</span>
                </li>
                <li className="flex justify-between">
                  <span>TDS (approx)</span>
                  <span>{formatINR(result.tdsMonthly)}</span>
                </li>
                <li className="flex justify-between font-semibold pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total deductions</span>
                  <span>{formatINR(result.totalDeductions)}</span>
                </li>
              </ul>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  Take-home (approx): {formatINR(result.takeHome)} / month
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Employer cost (incl. PF/ESI employer): {formatINR(result.employerCost)} / month
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
