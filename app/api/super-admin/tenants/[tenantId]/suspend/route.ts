import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { createAuditLogData } from '@/lib/utils/audit-helper'

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
    const body = await request.json()
    const { action } = body // 'suspend' or 'activate'

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const userId = decoded.userId || 'system'
    const newStatus = action === 'suspend' ? 'suspended' : 'active'
    const oldStatus = tenant.status

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: newStatus },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: createAuditLogData(
        'tenant',
        tenantId,
        userId,
        `Tenant ${action === 'suspend' ? 'suspended' : 'activated'}`,
        tenantId,
        request,
        { status: oldStatus },
        { status: newStatus }
      ),
    })

    return NextResponse.json({
      success: true,
      message: `Tenant ${action === 'suspend' ? 'suspended' : 'activated'} successfully`,
      data: { tenantId, status: newStatus },
    })
  } catch (e) {
    console.error('Suspend tenant error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
