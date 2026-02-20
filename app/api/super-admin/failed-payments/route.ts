import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const days = Math.min(parseInt(searchParams.get('days') || '90', 10), 365)
    const from = new Date()
    from.setDate(from.getDate() - days)

    const failed = await prisma.invoice.findMany({
      where: {
        status: 'failed',
        createdAt: { gte: from },
      },
      include: {
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const data = failed.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      tenantId: inv.tenantId,
      tenantName: inv.tenant?.name ?? '—',
      total: inv.total,
      currency: inv.currency,
      status: inv.status,
      paymentStatus: inv.paymentStatus,
      createdAt: inv.createdAt.toISOString(),
      dueDate: inv.dueDate?.toISOString() ?? null,
      customerName: inv.customerName,
      customerEmail: inv.customerEmail,
    }))

    const totalFailed = await prisma.invoice.count({
      where: { status: 'failed', createdAt: { gte: from } },
    })
    const totalPayments = await prisma.invoice.count({
      where: { createdAt: { gte: from } },
    })
    const failedRate = totalPayments > 0 ? (totalFailed / totalPayments) * 100 : 0

    return NextResponse.json({
      data,
      summary: { totalFailed, totalPayments, failedRate: failedRate.toFixed(1) },
    })
  } catch (e) {
    console.error('Super admin failed-payments error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
