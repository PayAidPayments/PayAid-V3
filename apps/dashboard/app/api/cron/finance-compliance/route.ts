// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

function getRealizationDeadline(invoiceDate: Date, isInrExport: boolean): Date {
  const deadline = new Date(invoiceDate)
  deadline.setMonth(deadline.getMonth() + (isInrExport ? 18 : 15))
  return deadline
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const exports = await prisma.exportInvoice.findMany({
      where: { status: { in: ['pending_realization', 'delayed'] } },
      select: {
        id: true,
        tenantId: true,
        invoiceDate: true,
        isInrExport: true,
        realizationDeadline: true,
        status: true,
      },
    })

    let delayedCount = 0
    for (const exp of exports) {
      const computedDeadline = exp.realizationDeadline || getRealizationDeadline(exp.invoiceDate, exp.isInrExport)
      const isDelayed = now > computedDeadline
      await prisma.exportInvoice.update({
        where: { id: exp.id },
        data: {
          realizationDeadline: computedDeadline,
          status: isDelayed ? 'delayed' : 'pending_realization',
        },
      })
      if (isDelayed) delayedCount += 1
    }

    // Create an alert per tenant where delayed invoices exceed one year
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const tenantsWithOverdue = await prisma.exportInvoice.groupBy({
      by: ['tenantId'],
      where: {
        status: 'delayed',
        invoiceDate: { lt: oneYearAgo },
      },
      _count: { id: true },
    })

    for (const t of tenantsWithOverdue) {
      await prisma.alert.create({
        data: {
          tenantId: t.tenantId,
          title: 'Export realization overdue > 1 year',
          message: `${t._count.id} exports are delayed beyond one year; block fresh exports until resolved`,
          type: 'warning',
          source: 'finance-compliance-cron',
        },
      })
    }

    return NextResponse.json({
      success: true,
      processed: exports.length,
      delayedCount,
      tenantsFlagged: tenantsWithOverdue.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Finance compliance cron failed', message: error?.message }, { status: 500 })
  }
}
