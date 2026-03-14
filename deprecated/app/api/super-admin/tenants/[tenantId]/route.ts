import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
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

    const { tenantId } = await params
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        plan: true,
        subscriptionTier: true,
        licensedModules: true,
        maxUsers: true,
        maxContacts: true,
        maxInvoices: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const data = {
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
    }

    return NextResponse.json({ data })
  } catch (e) {
    console.error('Super admin tenant details error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
