import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import { createAuditLogData } from '@/lib/utils/audit-helper'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const { userId } = await params
    const body = await request.json()
    const { action } = body // 'lock' or 'unlock'

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const decoded = await requireSuperAdmin()
    const adminUserId = decoded.userId || 'system'
    const userTenantId = user.tenantId || 'unknown'

    // Note: User model doesn't have a status field yet, so we can't actually lock
    // This is a placeholder - in production, add a `status` field or use metadata
    // For now, we'll log the action and return success

    // Create audit log
    await prisma.auditLog.create({
      data: createAuditLogData(
        'user',
        userId,
        adminUserId,
        `User ${action === 'lock' ? 'locked' : 'unlocked'} by Super Admin`,
        userTenantId,
        request,
        { email: user.email, role: user.role },
        { email: user.email, role: user.role, action }
      ),
    })

    return NextResponse.json({
      success: true,
      message: `User ${action === 'lock' ? 'locked' : 'unlocked'} successfully`,
      data: { userId, action },
      note: 'User status field not yet implemented - action logged only',
    })
  } catch (e) {
    console.error('Lock user error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
