// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest, { params }: { params: Promise<{ period: string }> }) {
  const { period } = await params
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId')
    if (!tenantId) return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })

    const blockedInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        OR: [{ itcStatus: 'blocked' as any }, { reverseCharge: true }],
      } as any,
      select: { id: true, invoiceNumber: true, itcStatus: true, reverseCharge: true, total: true } as any,
      take: 200,
    })
    const ledgerMismatch = blockedInvoices.some((inv) => inv.itcStatus === 'blocked')
    const rcmUnpaid = blockedInvoices.some((inv) => inv.reverseCharge)
    const violations: string[] = []
    if (ledgerMismatch) violations.push('ITC claimed does not match ledger balance')
    if (rcmUnpaid) violations.push('RCM tax appears unpaid for one or more invoices')

    const status = violations.length > 0 ? 'blocked' : 'valid'
    await prisma.gstrValidation.create({
      data: {
        tenantId,
        period,
        form: 'GSTR-3B',
        status,
        errors: violations,
      },
    })

    if (violations.length > 0) {
      return NextResponse.json({ period, status, violations }, { status: 422 })
    }

    return NextResponse.json({
      period,
      status,
      exportReady: true,
      blockedInvoiceCount: blockedInvoices.length,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to validate GSTR-3B export', message: (error as Error).message }, { status: 500 })
  }
}
