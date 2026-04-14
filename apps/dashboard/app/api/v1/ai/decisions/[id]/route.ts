import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const ENTITY_TYPE = 'ai_decision'

/**
 * GET /api/v1/ai/decisions/[id]
 *
 * Single AI decision detail, including full reasoning trace snapshot.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const log = await prisma.auditLog.findFirst({
      where: { id: params.id, tenantId, entityType: ENTITY_TYPE },
      select: {
        id: true,
        entityId: true,
        changedBy: true,
        changeSummary: true,
        beforeSnapshot: true,
        afterSnapshot: true,
        timestamp: true,
      },
    })

    if (!log) {
      return NextResponse.json({ error: 'AI decision not found', id: params.id }, { status: 404 })
    }

    const snap = log.afterSnapshot as Record<string, unknown> | null

    return NextResponse.json({
      id: log.id,
      entity_id: log.entityId,
      type: snap?.type ?? 'unknown',
      action: snap?.action ?? log.changeSummary,
      confidence: snap?.confidence ?? null,
      outcome: snap?.outcome ?? 'pending',
      actor: log.changedBy ?? 'system',
      override_reason: snap?.override_reason ?? null,
      reasoning_trace: snap?.reasoning_trace ?? null,
      context: log.beforeSnapshot ?? null,
      created_at: log.timestamp,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    console.error('AI decision detail error:', e)
    return NextResponse.json({ error: 'Failed to fetch AI decision' }, { status: 500 })
  }
}
