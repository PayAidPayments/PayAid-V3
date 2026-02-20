import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  let decoded: { user_id?: string; userId?: string; email?: string }
  try {
    decoded = await requireSuperAdmin() as any
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const { flagId } = await params
    const body = await request.json()
    const { featureName, description, isEnabled, settings } = body

    // Get current flag state for audit
    const currentFlag = await prisma.featureToggle.findUnique({
      where: { id: flagId },
    })

    if (!currentFlag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }

    const beforeSnapshot = {
      featureName: currentFlag.featureName,
      isEnabled: currentFlag.isEnabled,
      settings: currentFlag.settings,
    }

    const flag = await prisma.featureToggle.update({
      where: { id: flagId },
      data: {
        featureName,
        isEnabled,
        settings: { ...(settings || {}), description: description || null },
      },
    })

    const afterSnapshot = {
      featureName: flag.featureName,
      isEnabled: flag.isEnabled,
      settings: flag.settings,
    }

    // Create audit log entry
    const userId = decoded.user_id || decoded.userId || 'system'
    const tenantId = flag.tenantId || 'platform'
    
    try {
      await prisma.auditLog.create({
        data: {
          entityType: 'FeatureToggle',
          entityId: flagId,
          changedBy: userId,
          changeSummary: `Feature flag "${featureName}" ${isEnabled ? 'enabled' : 'disabled'}`,
          beforeSnapshot,
          afterSnapshot,
          tenantId,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      data: flag,
    })
  } catch (e) {
    console.error('Update feature flag error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const { flagId } = await params

    await prisma.featureToggle.delete({
      where: { id: flagId },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete feature flag error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
