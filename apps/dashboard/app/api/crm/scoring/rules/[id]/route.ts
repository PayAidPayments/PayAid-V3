import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'

const updateRuleSchema = z.object({
  key: z.string().min(1).optional(),
  category: z.enum(['fit', 'engagement', 'negative']).optional(),
  weight: z.number().min(-100).max(100).optional(),
  active: z.boolean().optional(),
  configJson: z.any().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin'], 'scoring rule write')
    const { id } = await params
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:scoring_rule:update:${id}:${idempotencyKey}`)
      const existingRuleId = (existing?.afterSnapshot as { rule_id?: string } | null)?.rule_id
      if (existing && existingRuleId) {
        return NextResponse.json({ success: true, deduplicated: true, rule: { id: existingRuleId } }, { status: 200 })
      }
    }
    const body = await request.json()
    const parsed = updateRuleSchema.parse(body)

    const rule = await prisma.leadScoreRule.updateMany({
      where: { id, tenantId },
      data: parsed,
    })

    if (rule.count === 0) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
    }

    const updated = await prisma.leadScoreRule.findFirst({ where: { id, tenantId } })
    if (idempotencyKey && updated) {
      await markIdempotentRequest(tenantId, userId, `crm:scoring_rule:update:${id}:${idempotencyKey}`, {
        rule_id: updated.id,
      })
    }
    return NextResponse.json({ success: true, rule: updated })
  } catch (error: any) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: error.status })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Update scoring rule error:', error)
    const status = error instanceof z.ZodError ? 400 : 500
    return NextResponse.json({ success: false, error: error.message }, { status })
  }
}
