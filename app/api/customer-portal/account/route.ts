import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Fetch account data
    const account = await prisma.account.findFirst({
      where: { tenantId },
      include: {
        // Note: Account model doesn't have deals relation, deals are linked via Contact
        contracts: {
          select: {
            id: true,
            title: true,
            status: true,
            endDate: true,
          },
        },
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Calculate totals - Account model doesn't have deals, so set to 0
    const activeDealsCount = 0
    const totalDealValue = 0

    // Fetch invoices (from finance module)
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Fetch tickets (from support module if exists)
    // Note: Ticket model may not exist in Prisma schema
    const tickets: any[] = []

    // Recent activity (simplified)
    const recentActivity: Array<{ title: string; date: Date }> = []

    return NextResponse.json({
      success: true,
      data: {
        id: account.id,
        name: account.name,
        activeDealsCount,
        totalDealValue,
        openTicketsCount: tickets.filter((t: any) => t.status === 'open').length,
        deals: [], // Account model doesn't have deals relation
        invoices: invoices.map((inv) => ({
          id: inv.id,
          number: inv.invoiceNumber,
          amount: Number(inv.total),
          status: inv.status,
          date: inv.createdAt,
        })),
        contracts: account.contracts || [],
        tickets,
        recentActivity,
      },
    })
  } catch (error) {
    console.error('[Customer Portal API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
