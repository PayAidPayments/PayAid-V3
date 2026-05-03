import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'

const thresholdSchema = z.object({
  minValue: z.number().int().min(0).max(100),
  maxValue: z.number().int().min(0).max(100),
  label: z.string().min(1),
  actionPolicyJson: z.any().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const thresholds = await prisma.leadScoreThreshold.findMany({
      where: { tenantId },
      orderBy: [{ minValue: 'asc' }],
    })
    return NextResponse.json({ success: true, thresholds })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get score thresholds error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin'], 'score threshold write')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:score_threshold:create:${idempotencyKey}`)
      const existingThresholdId = (existing?.afterSnapshot as { threshold_id?: string } | null)?.threshold_id
      if (existing && existingThresholdId) {
        return NextResponse.json(
          { success: true, deduplicated: true, threshold: { id: existingThresholdId } },
          { status: 200 }
        )
      }
    }
    const body = await request.json()
    const parsed = thresholdSchema.parse(body)

    if (parsed.minValue > parsed.maxValue) {
      return NextResponse.json(
        { success: false, error: 'minValue must be <= maxValue' },
        { status: 400 }
      )
    }

    const threshold = await prisma.leadScoreThreshold.create({
      data: { tenantId, ...parsed },
    })
    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:score_threshold:create:${idempotencyKey}`, {
        threshold_id: threshold.id,
      })
    }
    return NextResponse.json({ success: true, threshold }, { status: 201 })
  } catch (error: any) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create score threshold error:', error)
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
