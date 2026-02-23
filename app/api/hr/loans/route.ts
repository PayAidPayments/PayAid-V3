import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { emi, emiBreakdown } from '@/lib/hr/loan-emi'

/** Feature #22: Loan & Advance - List (placeholder) and EMI calc. */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    return NextResponse.json({
      loans: [],
      note: 'Add EmployeeLoan model (employeeId, principal, rate, tenureMonths, status, startDate) and link EMI deduction to payroll.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    const body = await request.json().catch(() => ({}))
    const principal = Number(body.principal) || 0
    const annualRate = Number(body.annualRatePercent) || 10
    const tenureMonths = Number(body.tenureMonths) || 12
    if (principal <= 0) return NextResponse.json({ error: 'principal required' }, { status: 400 })
    const e = emi(principal, annualRate, tenureMonths)
    const breakdown = emiBreakdown(principal, annualRate, tenureMonths)
    return NextResponse.json({
      principal,
      annualRatePercent: annualRate,
      tenureMonths,
      emi: Math.round(e * 100) / 100,
      totalRepayment: Math.round(breakdown.reduce((s, r) => s + r.emi, 0) * 100) / 100,
      breakdown: breakdown.slice(0, 12),
      note: 'Use this EMI in payroll deduction; add EmployeeLoan and approval workflow when ready.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
