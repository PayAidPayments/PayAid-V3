import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'
import { createAuditLogData } from '@/lib/utils/audit-helper'

export async function POST(request: NextRequest) {
  let decoded: { userId?: string }
  try {
    decoded = await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  const userId = decoded.userId ?? 'system'

  try {
    const body = await request.json()
    const { action, tenantIds } = body as { action: 'approve' | 'reject'; tenantIds: string[] }

    if (!action || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing action (approve|reject) or tenantIds array' },
        { status: 400 }
      )
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    const results: { tenantId: string; ok: boolean; error?: string }[] = []

    for (const tenantId of tenantIds) {
      try {
        const onboarding = await prisma.merchantOnboarding.findUnique({
          where: { tenantId },
        })
        if (!onboarding) {
          results.push({ tenantId, ok: false, error: 'Onboarding not found' })
          continue
        }
        if (onboarding.status !== 'pending_review') {
          results.push({ tenantId, ok: false, error: `Status is ${onboarding.status}` })
          continue
        }

        await prisma.merchantOnboarding.update({
          where: { tenantId },
          data: {
            status,
            reviewedBy: userId,
            reviewedAt: new Date(),
            ...(action === 'reject' && { rejectionReason: 'Bulk rejected' }),
          },
        })

        if (action === 'approve') {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { status: 'active', onboardingCompleted: true },
          })
        } else {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { status: 'suspended' },
          })
        }

        await prisma.auditLog.create({
          data: createAuditLogData(
            'merchant_onboarding',
            tenantId,
            userId,
            `Onboarding bulk ${action}`,
            tenantId,
            request,
            {},
            { status }
          ),
        })

        results.push({ tenantId, ok: true })
      } catch (e) {
        results.push({
          tenantId,
          ok: false,
          error: e instanceof Error ? e.message : 'Unknown error',
        })
      }
    }

    const succeeded = results.filter((r) => r.ok).length
    return NextResponse.json({
      data: { results, succeeded, failed: results.length - succeeded },
    })
  } catch (e) {
    console.error('Super admin onboarding bulk error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
