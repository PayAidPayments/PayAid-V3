import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = verifyToken(token)
    const roles = decoded.roles ?? (decoded.role ? [decoded.role] : [])
    const isSuperAdmin = roles.some((r: string) => SUPER_ADMIN_ROLES.includes(r))
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        subscriptionTier: true,
        plan: true,
        licensedModules: true,
        maxUsers: true,
        maxContacts: true,
        maxInvoices: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            contacts: true,
            invoices: true,
            deals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    // Calculate payment metrics for each tenant
    const data = await Promise.all(
      tenants.map(async (t) => {
        const userUsage = t.maxUsers > 0 ? (t._count.users / t.maxUsers) * 100 : 0
        const contactUsage = t.maxContacts > 0 ? (t._count.contacts / t.maxContacts) * 100 : 0
        const invoiceUsage = t.maxInvoices > 0 ? (t._count.invoices / t.maxInvoices) * 100 : 0
        const overallUsage = Math.max(userUsage, contactUsage, invoiceUsage)

        // Get payment metrics for this tenant
        const [paymentsMTD, transactionsMTD] = await Promise.all([
          prisma.invoice
            .aggregate({
              where: {
                tenantId: t.id,
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
                tenantId: t.id,
                status: 'paid',
                paidAt: { gte: startOfMonth },
              },
            })
            .catch(() => 0),
        ])

        return {
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt?.toISOString() || null,
          usage: {
            users: Math.round(userUsage),
            contacts: Math.round(contactUsage),
            invoices: Math.round(invoiceUsage),
            overall: Math.round(overallUsage),
          },
          activeUsers: t._count.users,
          paymentsMTD,
          transactionsMTD,
        }
      })
    )

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Super admin tenants list error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
