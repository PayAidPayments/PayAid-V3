import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()

    const { id } = await params

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        subscriptionTier: true,
        plan: true,
        maxUsers: true,
        maxContacts: true,
        maxInvoices: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            contacts: true,
            invoices: true,
            deals: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Calculate payment metrics
    const [paymentsMTD, transactionsMTD, pipelineValue] = await Promise.all([
      prisma.invoice
        .aggregate({
          where: {
            tenantId: id,
            status: 'paid',
            paidAt: { gte: startOfMonth },
          },
          _sum: { total: true },
        })
        .then((r) => Number(r._sum?.total || 0))
        .catch(() => 0),
      prisma.invoice
        .count({
          where: {
            tenantId: id,
            status: 'paid',
            paidAt: { gte: startOfMonth },
          },
        })
        .catch(() => 0),
      prisma.deal
        .aggregate({
          where: {
            tenantId: id,
            stage: { not: 'closed_lost' },
          },
          _sum: { value: true },
        })
        .then((r) => Number(r._sum.value || 0))
        .catch(() => 0),
    ])

    // Calculate revenue history (last 12 months)
    const revenueHistory = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthRevenue = await prisma.invoice
        .aggregate({
          where: {
            tenantId: id,
            status: 'paid',
            paidAt: { gte: monthStart, lte: monthEnd },
          },
          _sum: { total: true },
        })
        .then((r) => Number(r._sum?.total || 0))
        .catch(() => 0)

      revenueHistory.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
      })
    }

    // Get WhatsApp metrics
    const whatsappMessages = await prisma.whatsappMessage
      .count({
        where: {
          conversation: {
            account: {
              tenantId: id,
            },
          },
          createdAt: { gte: twelveMonthsAgo },
        },
      })
      .catch(() => 0)

    const data = {
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
      activeUsers: tenant._count.users,
      contactsCount: tenant._count.contacts,
      invoicesCount: tenant._count.invoices,
      paymentsMTD,
      transactionsMTD,
      pipelineValue,
      revenueHistory,
      whatsappMessages,
      deliveryRate: 87, // Mock - would calculate from WhatsApp API
      pendingInvites: 0, // Mock - would count pending invitations
    }

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Super admin merchant detail error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
