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
    const { plan, modules } = body

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const userId = decoded.userId || 'system'
    const updateData: any = {}
    if (plan) {
      updateData.subscriptionTier = plan
      updateData.plan = plan
    }
    if (modules && Array.isArray(modules)) {
      updateData.licensedModules = modules
    }

    const beforeSnapshot = {
      plan: tenant.plan,
      subscriptionTier: tenant.subscriptionTier,
      licensedModules: tenant.licensedModules || [],
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: createAuditLogData(
        'tenant',
        tenantId,
        userId,
        `Tenant plan updated: ${plan || 'modules changed'}`,
        tenantId,
        request,
        beforeSnapshot,
        { ...beforeSnapshot, ...updateData }
      ),
    })

    return NextResponse.json({
      success: true,
      message: 'Tenant plan updated successfully',
      data: { tenantId, ...updateData },
    })
  } catch (e) {
    console.error('Update tenant plan error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
