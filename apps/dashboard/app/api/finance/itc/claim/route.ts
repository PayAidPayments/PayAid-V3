// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

function getNov30DeadlineForFY(claimDate: Date): Date {
  const fyStartYear = claimDate.getMonth() >= 3 ? claimDate.getFullYear() : claimDate.getFullYear() - 1
  return new Date(fyStartYear, 10, 30, 23, 59, 59, 999)
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    const { invoiceId, claimDate, supplierReturnFiled, ledgerMatched } = body ?? {}

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }

    const effectiveDate = claimDate ? new Date(claimDate) : new Date()
    const deadline = getNov30DeadlineForFY(effectiveDate)
    const violations: string[] = []

    if (effectiveDate > deadline) violations.push('ITC claim blocked after 30 November deadline')
    if (!supplierReturnFiled) violations.push('Supplier return not filed / GSTR-2B mismatch')
    if (!ledgerMatched) violations.push('Ledger mismatch between claim and GSTR-3B')

    const status = violations.length > 0 ? 'blocked' : 'claimed'

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: { id: true },
    })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found for tenant' }, { status: 404 })
    }

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        itcStatus: status as any,
        gstValidation: {
          itcClaimCheckedAt: new Date().toISOString(),
          violations,
        },
      },
    })

    const lateFee = violations.length > 0 ? 50 * Math.max(1, Math.ceil((effectiveDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24))) : 0

    return NextResponse.json({
      invoiceId: invoice.id,
      itcStatus: status,
      blocked: violations.length > 0,
      violations,
      lateFee,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    return NextResponse.json({ error: 'Failed to process ITC claim', message: (error as Error).message }, { status: 500 })
  }
}
