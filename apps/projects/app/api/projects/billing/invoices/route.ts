import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Same capability pool as PATCH mark-invoiced: admin-like, project owner, or PM on any tenant project. */
async function userCanLinkTimeToFinanceInvoice(
  tenantId: string,
  userId: string,
  roles: string[]
): Promise<boolean> {
  const roleList = roles || []
  const isAdminLike = roleList
    .map((r) => String(r).toLowerCase())
    .some((r) => ['owner', 'admin', 'super_admin', 'business_admin'].includes(r))
  if (isAdminLike) return true

  const [owned, pm] = await Promise.all([
    prisma.project.findFirst({
      where: { tenantId, ownerId: userId },
      select: { id: true },
    }),
    prisma.projectMember.findFirst({
      where: {
        userId,
        role: { in: ['PROJECT_MANAGER', 'project_manager', 'Project Manager'] },
        project: { tenantId },
      },
      select: { id: true },
    }),
  ])

  return Boolean(owned || pm)
}

// GET /api/projects/billing/invoices — Minimal invoice list for linking time entries (Projects module).
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'projects')

    const allowed = await userCanLinkTimeToFinanceInvoice(tenantId, userId, roles || [])
    if (!allowed) {
      return NextResponse.json({ error: 'You do not have permission to link time to invoices' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rawLimit = parseInt(searchParams.get('limit') || '80', 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 150) : 80
    const q = searchParams.get('q')?.trim()

    const where: { tenantId: string; invoiceNumber?: { contains: string; mode: 'insensitive' } } =
      {
        tenantId,
      }
    if (q) {
      where.invoiceNumber = { contains: q, mode: 'insensitive' }
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        invoiceDate: true,
        customerName: true,
        total: true,
      },
    })

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        invoiceDate: inv.invoiceDate.toISOString(),
        customerName: inv.customerName,
        total: inv.total,
      })),
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('GET /api/projects/billing/invoices', error)
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 })
  }
}
