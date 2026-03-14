import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    if (query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = `%${query}%`

    // Search tenants
    const tenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { subdomain: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        subdomain: true,
      },
    })

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    })

    // Search invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: query, mode: 'insensitive' } },
          { customerName: { contains: query, mode: 'insensitive' } },
          { customerEmail: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        total: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
    })

    // Combine results
    const results = [
      ...tenants.map((t) => ({
        type: 'tenant' as const,
        id: t.id,
        title: t.name,
        subtitle: t.subdomain || undefined,
        href: `/super-admin/business/tenants/${t.id}`,
      })),
      ...users.map((u) => ({
        type: 'user' as const,
        id: u.id,
        title: u.name || u.email,
        subtitle: u.tenant?.name || undefined,
        href: `/super-admin/business/users/${u.id}`,
      })),
      ...invoices.map((inv) => ({
        type: 'invoice' as const,
        id: inv.id,
        title: `Invoice ${inv.invoiceNumber}`,
        subtitle: `${inv.customerName} - ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(inv.total))}`,
        href: `/super-admin/revenue/payments?invoice=${inv.id}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (e) {
    console.error('Search error:', e)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
