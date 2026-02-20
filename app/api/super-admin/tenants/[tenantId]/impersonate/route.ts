import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']

export async function POST(
  request: NextRequest,
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
      include: {
        users: {
          where: { role: { in: ['owner', 'admin'] } },
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (tenant.users.length === 0) {
      return NextResponse.json({ error: 'No admin user found for this tenant' }, { status: 404 })
    }

    const adminUser = tenant.users[0]

    // Create impersonation token
    const impersonationToken = signToken({
      userId: adminUser.id,
      email: adminUser.email,
      tenantId: tenant.id,
      roles: ['admin'],
      licensedModules: tenant.licensedModules,
      sub: adminUser.id,
      tenant_id: tenant.id,
    })

    return NextResponse.json({
      success: true,
      token: impersonationToken,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
    })
  } catch (e) {
    console.error('Impersonate tenant error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
